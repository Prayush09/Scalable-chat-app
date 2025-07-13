import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const servers: Set<WebSocket> = new Set();

wss.on('connection', (ws: WebSocket) => {
  ws.on('error', console.error);

  servers.add(ws);

  ws.on('close', () => {
    servers.delete(ws);
  });

  ws.on('message', function message(data: string) {
    for (const socket of servers) {
      if (socket.readyState === WebSocket.OPEN && socket !== ws) {
        socket.send(data);
      }
    }
  });
});
