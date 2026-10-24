import asyncio
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from onix_game_proxy import TCPBridge, UDPBridge, udp_identity, v1, v2, parse_v1, MAGIC


class ProtocolSecurity(unittest.TestCase):
    def test_untrusted_udp_cannot_spoof(self):
        peer = ('192.0.2.2', 5555)
        forged = v2(('203.0.113.50', 7777), ('127.0.0.1', 19132)) + b'hello'
        self.assertEqual(udp_identity(forged, peer, set()), (peer, forged))

    def test_trusted_udp_retains_original_address(self):
        payload = v2(('203.0.113.50', 7777), ('127.0.0.1', 19132)) + b'hello'
        self.assertEqual(udp_identity(payload, ('192.0.2.2', 5555), {'192.0.2.2'}), (('203.0.113.50', 7777), b'hello'))

    def test_malformed_proxy_headers_rejected(self):
        with self.assertRaises(ValueError): parse_v1(b'PROXY TCP4 1.2.3.4 1.2.3.5 65536 25565\r\n')
        with self.assertRaises(ValueError): udp_identity(MAGIC + b'bad', ('192.0.2.2', 5555), {'192.0.2.2'})


class RelayTraffic(unittest.IsolatedAsyncioTestCase):
    async def test_raw_database_bridge_does_not_insert_header(self):
        async def backend(reader, writer):
            data = await reader.readexactly(4); writer.write(data); await writer.drain(); writer.close()
        bs = await asyncio.start_server(backend, '127.0.0.1', 0)
        bridge = TCPBridge({'target': ['127.0.0.1', bs.sockets[0].getsockname()[1]]}, [])
        ps = await asyncio.start_server(bridge.handle, '127.0.0.1', 0)
        reader, writer = await asyncio.open_connection('127.0.0.1', ps.sockets[0].getsockname()[1])
        writer.write(b'\x00\x00\x00\x04'); await writer.drain()
        self.assertEqual(await asyncio.wait_for(reader.readexactly(4), 2), b'\x00\x00\x00\x04')
        writer.close(); await writer.wait_closed(); ps.close(); bs.close()
        await ps.wait_closed(); await bs.wait_closed()

    async def test_trusted_tcp_hop_preserves_original_client(self):
        seen = []
        async def backend(reader, writer):
            seen.append(parse_v1(await reader.readuntil(b'\r\n')))
            writer.write(await reader.readexactly(3)); await writer.drain(); writer.close()
        bs = await asyncio.start_server(backend, '127.0.0.1', 0)
        bridge = TCPBridge({'target': ['127.0.0.1', bs.sockets[0].getsockname()[1]], 'proxy_protocol': 1}, ['127.0.0.1'])
        ps = await asyncio.start_server(bridge.handle, '127.0.0.1', 0)
        reader, writer = await asyncio.open_connection('127.0.0.1', ps.sockets[0].getsockname()[1])
        writer.write(v1(('203.0.113.20', 23456), ('127.0.0.1', 25565)) + b'abc'); await writer.drain()
        self.assertEqual(await asyncio.wait_for(reader.readexactly(3), 2), b'abc')
        self.assertEqual(seen, [('203.0.113.20', 23456)])
        writer.close(); await writer.wait_closed(); ps.close(); bs.close()
        await ps.wait_closed(); await bs.wait_closed()

    async def test_tcp_preserves_bytes_and_actual_untrusted_ip(self):
        seen = []
        async def backend(reader, writer):
            seen.append(await reader.readuntil(b'\r\n'))
            data = await reader.readexactly(5); writer.write(data); await writer.drain(); writer.close()
        backend_server = await asyncio.start_server(backend, '127.0.0.1', 0)
        bridge = TCPBridge({'target': ['127.0.0.1', backend_server.sockets[0].getsockname()[1]], 'proxy_protocol': 1}, [])
        server = await asyncio.start_server(bridge.handle, '127.0.0.1', 0)
        reader, writer = await asyncio.open_connection('127.0.0.1', server.sockets[0].getsockname()[1])
        writer.write(b'hello'); await writer.drain()
        self.assertEqual(await asyncio.wait_for(reader.readexactly(5), 2), b'hello')
        self.assertEqual(parse_v1(seen[0])[0], '127.0.0.1')
        writer.close(); await writer.wait_closed(); server.close(); backend_server.close()
        await server.wait_closed(); await backend_server.wait_closed()

    async def test_udp_two_clients_keep_separate_reply_paths(self):
        seen = []
        class Backend(asyncio.DatagramProtocol):
            def connection_made(self, transport): self.transport = transport
            def datagram_received(self, data, peer):
                identity, payload = udp_identity(data, peer, {'127.0.0.1'})
                seen.append(identity); self.transport.sendto(payload, peer)
        loop = asyncio.get_running_loop()
        bt, _ = await loop.create_datagram_endpoint(Backend, local_addr=('127.0.0.1', 0))
        bridge = UDPBridge({'target': bt.get_extra_info('sockname'), 'proxy_protocol': 2}, [])
        rt, _ = await loop.create_datagram_endpoint(lambda: bridge, local_addr=('127.0.0.1', 0))
        clients = []
        class Client(asyncio.DatagramProtocol):
            def __init__(self, future): self.future = future
            def datagram_received(self, data, peer): self.future.set_result(data)
        for payload in [b'first', b'second']:
            future = loop.create_future()
            ct, _ = await loop.create_datagram_endpoint(lambda f=future: Client(f), remote_addr=rt.get_extra_info('sockname'))
            clients.append(ct); ct.sendto(payload)
            self.assertEqual(await asyncio.wait_for(future, 2), payload)
        self.assertNotEqual(seen[0][1], seen[1][1]); self.assertEqual(len(bridge.sessions), 2)
        bridge.expire(float('inf')); self.assertEqual(len(bridge.sessions), 0)
        for t in clients + [bt, rt]: t.close()


if __name__ == '__main__': unittest.main()
