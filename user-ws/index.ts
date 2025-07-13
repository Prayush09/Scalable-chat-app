import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
const RELAYER_URL = 'ws://localhost:8080';
const relayerSocket = new WebSocket(RELAYER_URL);

interface Room {
  sockets: Set<WebSocket>;
}

const rooms: Record<string, Room> = {};
const socketToRoom = new Map<WebSocket, string>();

// Handle incoming messages from relayer
relayerSocket.onmessage = (event) => {
  try {
    const parsed = JSON.parse(event.data.toString());
    const room = parsed.room;

    if (room && rooms[room]) {
      rooms[room].sockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(parsed));
        }
      });
    }
  } catch (e) {
    console.error("Error parsing relayed message:", event.data);
  }
};

wss.on('connection', (ws: WebSocket) => {
  ws.on('error', console.error);

  ws.on('message', (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const room = parsedData.room;

      if (!room || typeof room !== 'string') {
        console.warn('Invalid room:', room);
        return;
      }

      if (parsedData.type === 'join') {
        if (!rooms[room]) {
          rooms[room] = { sockets: new Set() };
        }
        rooms[room].sockets.add(ws);
        socketToRoom.set(ws, room);
        console.log(`Socket joined room: ${room}`);
      }

      if (parsedData.type === 'chat') {
        if (relayerSocket.readyState === WebSocket.OPEN) {
          relayerSocket.send(data); // Send to all other servers
        } else {
          console.warn('Relayer not connected; message dropped.');
        }
      }
    } catch (e) {
      console.error("Failed to parse message:", data);
    }
  });

  ws.on('close', () => {
    const room = socketToRoom.get(ws);
    if (room && rooms[room]) {
      rooms[room].sockets.delete(ws);
      if (rooms[room].sockets.size === 0) {
        delete rooms[room];
      }
    }
    socketToRoom.delete(ws);
  });

  ws.send(JSON.stringify({ type: "system", message: "Connected to server." }));
});
