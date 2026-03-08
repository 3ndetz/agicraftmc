const express = require('express');
const net = require('net');

const router = express.Router();

// VarInt helpers (Minecraft protocol)
function writeVarInt(value) {
  const bytes = [];
  // Handle negative values and large numbers as unsigned 32-bit
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
 * Works with Minecraft 1.7+ and proxies like Velocity.
 */
function pingServer(host, port, timeout = 4000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buffer = Buffer.alloc(0);
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        socket.destroy();
        reject(new Error('Timeout'));
      }
    }, timeout);

    socket.connect(port, host, () => {
      const serverAddr = Buffer.from(host, 'utf8');

      // Handshake packet (0x00)
      const handshakeData = Buffer.concat([
        writeVarInt(0x00),                                       // Packet ID
        writeVarInt(767),                                        // Protocol version (1.21.1)
        writeVarInt(serverAddr.length),                          // Host string length
        serverAddr,                                              // Host
        Buffer.from([(port >> 8) & 0xFF, port & 0xFF]),         // Port (big-endian)
        writeVarInt(1),                                          // Next state: Status
      ]);
      const handshakePacket = Buffer.concat([writeVarInt(handshakeData.length), handshakeData]);

      // Status request packet (0x00, no payload)
      const statusRequest = Buffer.concat([writeVarInt(1), writeVarInt(0x00)]);

      socket.write(Buffer.concat([handshakePacket, statusRequest]));
    });

    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      try {
        let offset = 0;

        // Read total packet length
        const lenResult = readVarInt(buffer, offset);
        if (!lenResult) return;
        offset = lenResult.offset;
        if (buffer.length < offset + lenResult.value) return; // Need more data

        // Read packet ID
        const packetIdResult = readVarInt(buffer, offset);
        if (!packetIdResult || packetIdResult.value !== 0x00) return;
        offset = packetIdResult.offset;

        // Read JSON string length
        const jsonLenResult = readVarInt(buffer, offset);
        if (!jsonLenResult) return;
        offset = jsonLenResult.offset;
        if (buffer.length < offset + jsonLenResult.value) return;

        const jsonStr = buffer.toString('utf8', offset, offset + jsonLenResult.value);
        const response = JSON.parse(jsonStr);

        if (!done) {
          done = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(response);
        }
      } catch (_) {
        // Incomplete or malformed data — wait for more
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

// GET /api/servers/status
router.get('/status', async (req, res) => {
  const servers = [
    {
      id: 'velocity',
      name: 'AgiCraft Network',
      description: 'Velocity Proxy — основная точка входа на сеть',
      host: 'velocity',
      port: 25565,
    },
    {
      id: 'airesearch',
      name: 'AI Research',
      description: 'Экспериментальный сервер для тестирования ИИ-агентов',
      host: process.env.MINECRAFT_HOST || 'airesearch',
      port: parseInt(process.env.MINECRAFT_PORT || '25570'),
    },
  ];

  const results = await Promise.allSettled(
    servers.map((srv) => pingServer(srv.host, srv.port))
  );

  const statuses = results.map((result, i) => {
    const srv = servers[i];
    if (result.status === 'fulfilled') {
      const data = result.value;
      return {
        id: srv.id,
        name: srv.name,
        description: srv.description,
        online: true,
        players: data.players?.online ?? 0,
        maxPlayers: data.players?.max ?? 0,
        version: data.version?.name ?? null,
      };
    }
    return {
      id: srv.id,
      name: srv.name,
      description: srv.description,
      online: false,
      players: 0,
      maxPlayers: 0,
      version: null,
    };
  });

  res.json({ servers: statuses });
});

module.exports = router;
