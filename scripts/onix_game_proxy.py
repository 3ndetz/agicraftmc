"""Native IPv4 L4 bridge for Docker Desktop, with trusted PROXY protocol hops.

No third-party dependencies. Config contains only endpoints, not credentials.
Only explicitly trusted peers may supply an original client address.
"""
import asyncio
import ipaddress
import json
import logging
import socket
import struct
import sys
import time
from pathlib import Path

MAGIC = b'\r\n\r\n\x00\r\nQUIT\n'


def v1(source, destination):
    ipaddress.IPv4Address(source[0]); ipaddress.IPv4Address(destination[0])
    return f'PROXY TCP4 {source[0]} {destination[0]} {source[1]} {destination[1]}\r\n'.encode()


def parse_v1(header):
    if len(header) > 108 or not header.endswith(b'\r\n'):
        raise ValueError('Invalid PROXY line')
    parts = header.decode('ascii').split()
    if len(parts) != 6 or parts[:2] != ['PROXY', 'TCP4']:
        raise ValueError('Only PROXY TCP4 is accepted')
    ipaddress.IPv4Address(parts[2]); ipaddress.IPv4Address(parts[3])
    source_port, destination_port = int(parts[4]), int(parts[5])
    if not (0 < source_port < 65536 and 0 < destination_port < 65536):
        raise ValueError('Invalid port')
    return parts[2], source_port


def v2(source, destination):
    addresses = socket.inet_aton(source[0]) + socket.inet_aton(destination[0])
    return MAGIC + bytes([0x21, 0x12]) + struct.pack('!H', 12) + addresses + struct.pack('!HH', source[1], destination[1])


def udp_identity(data, peer, trusted):
    if peer[0] in trusted and data.startswith(MAGIC):
        if len(data) < 28 or data[12:16] != bytes([0x21, 0x12, 0, 12]):
            raise ValueError('Invalid trusted UDP PROXY header')
        source = socket.inet_ntoa(data[16:20]), struct.unpack('!H', data[24:26])[0]
        if not source[1]:
            raise ValueError('Invalid source port')
        return source, data[28:]
    return peer, data


class TCPBridge:
    def __init__(self, spec, trusted):
        self.spec, self.trusted, self.active = spec, set(trusted), 0

    async def handle(self, reader, writer):
        if self.active >= 2048:
            writer.close(); return
        self.active += 1
        backend = None
        try:
            source = writer.get_extra_info('peername')[:2]
            initial = b''
            if self.spec.get('proxy_protocol') == 1 and source[0] in self.trusted:
                initial = await asyncio.wait_for(reader.readexactly(6), 10)
                if initial == b'PROXY ':
                    header = initial + await asyncio.wait_for(reader.readuntil(b'\r\n'), 10)
                    source, initial = parse_v1(header), b''
            remote, backend = await asyncio.wait_for(asyncio.open_connection(*self.spec['target']), 10)
            if self.spec.get('proxy_protocol') == 1:
                backend.write(v1(source, writer.get_extra_info('sockname')[:2]))
            backend.write(initial); await backend.drain()

            async def pipe(src, dst):
                try:
                    while data := await asyncio.wait_for(src.read(65536), 300):
                        dst.write(data); await dst.drain()
                finally:
                    try: dst.write_eof()
                    except (OSError, AttributeError): pass
            await asyncio.gather(pipe(reader, backend), pipe(remote, writer))
        except (OSError, ValueError, UnicodeError, asyncio.TimeoutError, asyncio.IncompleteReadError, asyncio.LimitOverrunError):
            pass
        finally:
            self.active -= 1
            for stream in [backend, writer]:
                if stream:
                    stream.close()
                    try: await asyncio.wait_for(stream.wait_closed(), 3)
                    except (OSError, asyncio.TimeoutError): pass


class UDPReply(asyncio.DatagramProtocol):
    def __init__(self, owner, peer): self.owner, self.peer = owner, peer
    def datagram_received(self, data, addr):
        session = self.owner.sessions.get(self.peer)
        if session:
            session['last'] = time.monotonic()
            self.owner.transport.sendto(data, self.peer)


class UDPBridge(asyncio.DatagramProtocol):
    def __init__(self, spec, trusted):
        self.spec, self.trusted = spec, set(trusted)
        self.sessions, self.pending, self.transport = {}, {}, None

    def connection_made(self, transport): self.transport = transport

    def datagram_received(self, data, peer):
        if len(data) > 8192:
            return
        try: identity, payload = udp_identity(data, peer, self.trusted)
        except ValueError: return
        if self.spec.get('proxy_protocol') == 2:
            local = self.transport.get_extra_info('sockname')[:2]
            payload = v2(identity, local) + payload
        if peer in self.sessions:
            self.sessions[peer]['last'] = time.monotonic()
            self.sessions[peer]['transport'].sendto(payload)
        elif peer in self.pending:
            if len(self.pending[peer]) < 8: self.pending[peer].append(payload)
        elif len(self.sessions) + len(self.pending) < 2048:
            self.pending[peer] = [payload]
            asyncio.create_task(self.create_session(peer))

    async def create_session(self, peer):
        try:
            transport, _ = await asyncio.get_running_loop().create_datagram_endpoint(
                lambda: UDPReply(self, peer), remote_addr=tuple(self.spec['target']))
            self.sessions[peer] = {'transport': transport, 'last': time.monotonic()}
            for payload in self.pending[peer]: transport.sendto(payload)
        except OSError: pass
        finally: self.pending.pop(peer, None)

    def expire(self, now=None):
        now = time.monotonic() if now is None else now
        for peer, session in list(self.sessions.items()):
            if now - session['last'] > 90:
                session['transport'].close(); del self.sessions[peer]


async def serve(config):
    trusted = config.get('trusted_proxy_ips', [])
    tcp, udp, servers = [], [], []
    for spec in config.get('tcp', []):
        bridge = TCPBridge(spec, trusted); tcp.append(bridge)
        servers.append(await asyncio.start_server(bridge.handle, *spec['bind']))
    for spec in config.get('udp', []):
        bridge = UDPBridge(spec, trusted); udp.append(bridge)
        await asyncio.get_running_loop().create_datagram_endpoint(lambda b=bridge: b, local_addr=tuple(spec['bind']))
    logging.info('Bridge started: %s TCP and %s UDP listeners', len(tcp), len(udp))
    while True:
        for bridge in udp: bridge.expire()
        if config.get('status_file'):
            Path(config['status_file']).write_text(json.dumps({'updated': time.time(), 'tcp_connections': sum(b.active for b in tcp), 'udp_sessions': sum(len(b.sessions) for b in udp), 'tcp_listeners': len(tcp), 'udp_listeners': len(udp)}))
        await asyncio.sleep(10)


if __name__ == '__main__':
    config = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
    if config.get('required_marker') and not Path(config['required_marker']).exists():
        raise SystemExit('Deployment not ready')
    logging.basicConfig(filename=config.get('log_file'), level=logging.INFO, format='%(asctime)s %(message)s')
    asyncio.run(serve(config))
