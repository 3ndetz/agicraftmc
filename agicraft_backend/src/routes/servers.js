const express = require('express');
const net = require('net');

const router = express.Router();

// VarInt helpers (Minecraft protocol)
function writeVarInt(value) {
  const bytes = [];
  value = value >>> 0;
  do {
    let temp = value & 0x7F;
    value >>>= 7;
    if (value !== 0) temp |= 0x80;
    bytes.push(temp);
  } while (value !== 0);
  return Buffer.from(bytes);
}

function readVarInt(buf, offset) {
  let result = 0;
  let shift = 0;
  let byte;
  do {
    if (offset >= buf.length) return null;
    byte = buf[offset++];
    result |= (byte & 0x7F) << shift;
    shift += 7;
  } while (byte & 0x80);
  return { value: result, offset };
}

/**
 * Ping a Minecraft server using the Server List Ping (SLP) protocol.
 * @param {string} host      TCP connection host (Docker internal hostname)
 * @param {number} port      TCP port
 * @param {string} pingHost  Host string inside the SLP handshake packet
 *                           (should match the public-facing hostname, e.g. agicraft.ru)
 */
function pingServer(host, port, pingHost, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buffer = Buffer.alloc(0);
    let done = false;

    const timer = setTimeout(() => {
      if (!done) { done = true; socket.destroy(); reject(new Error('Timeout')); }
    }, timeout);

    socket.connect(port, host, () => {
      // Use the public hostname in the handshake packet so Velocity recognises it
      const serverAddr = Buffer.from(pingHost || host, 'utf8');

      const handshakeData = Buffer.concat([
        writeVarInt(0x00),
        writeVarInt(767),                                        // Protocol version 1.21.1
        writeVarInt(serverAddr.length),
        serverAddr,
        Buffer.from([(port >> 8) & 0xFF, port & 0xFF]),
        writeVarInt(1),                                          // Next state: Status
      ]);
      const handshakePacket = Buffer.concat([writeVarInt(handshakeData.length), handshakeData]);
      const statusRequest = Buffer.concat([writeVarInt(1), writeVarInt(0x00)]);

      socket.write(Buffer.concat([handshakePacket, statusRequest]));
    });

    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      try {
        let offset = 0;
        const lenResult = readVarInt(buffer, offset);
        if (!lenResult) return;
        offset = lenResult.offset;
        if (buffer.length < offset + lenResult.value) return;

        const packetIdResult = readVarInt(buffer, offset);
        if (!packetIdResult || packetIdResult.value !== 0x00) return;
        offset = packetIdResult.offset;

        const jsonLenResult = readVarInt(buffer, offset);
        if (!jsonLenResult) return;
        offset = jsonLenResult.offset;
        if (buffer.length < offset + jsonLenResult.value) return;

        const jsonStr = buffer.toString('utf8', offset, offset + jsonLenResult.value);
        const response = JSON.parse(jsonStr);

        if (!done) { done = true; clearTimeout(timer); socket.destroy(); resolve(response); }
      } catch (_) {
        // Incomplete data — wait for more
      }
    });

    socket.on('error', (err) => {
      if (!done) { done = true; clearTimeout(timer); reject(err); }
    });

    socket.on('close', () => {
      if (!done) { done = true; clearTimeout(timer); reject(new Error('Connection closed')); }
    });
  });
}

/**
 * Plain TCP connectivity check — no Minecraft protocol.
 * Returns true if the port is reachable within timeout ms.
 */
function tcpCheck(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const timer = setTimeout(() => {
      if (!done) { done = true; socket.destroy(); resolve(false); }
    }, timeout);

    socket.connect(port, host, () => {
      if (!done) { done = true; clearTimeout(timer); socket.destroy(); resolve(true); }
    });

    socket.on('error', () => {
      if (!done) { done = true; clearTimeout(timer); resolve(false); }
    });
  });
}

// GET /api/servers/status
router.get('/status', async (req, res) => {
  const PUBLIC_HOST = process.env.PUBLIC_HOST || 'agicraft.ru';

  const servers = [
    {
      id: 'velocity',
      name: 'AgiCraft Network',
      host: 'velocity',         // Docker-internal TCP target
      pingHost: PUBLIC_HOST,    // Sent inside SLP handshake — must match Velocity's expected host
      port: 25565,
    },
    {
      id: 'agents',
      name: 'Agents',
      host: process.env.MINECRAFT_HOST || 'agents',
      pingHost: null,
      port: parseInt(process.env.MINECRAFT_PORT || '25576'),
    },
  ];

  const results = await Promise.allSettled(
    servers.map(async (srv) => {
      // Try full SLP ping first (gives player counts)
      try {
        const data = await pingServer(srv.host, srv.port, srv.pingHost);
        return {
          id: srv.id,
          name: srv.name,
          online: true,
          players: data.players?.online ?? 0,
          maxPlayers: data.players?.max ?? 0,
          version: data.version?.name ?? null,
        };
      } catch (_) {
        // SLP failed — fall back to plain TCP check (online/offline, no player count)
        const reachable = await tcpCheck(srv.host, srv.port);
        return {
          id: srv.id,
          name: srv.name,
          online: reachable,
          players: null,    // null = count unknown
          maxPlayers: null,
          version: null,
        };
      }
    })
  );

  const statuses = results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    return { id: servers[i].id, name: servers[i].name, online: false, players: 0, maxPlayers: 0, version: null };
  });

  res.json({ servers: statuses });
});

module.exports = router;
