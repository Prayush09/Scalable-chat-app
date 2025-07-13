"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var wss = new ws_1.WebSocketServer({ port: 3000 });
var rooms = {};
var socketToRoom = new Map();
wss.on('connection', function (ws) {
    ws.on('error', console.error);
    ws.on('message', function (data) {
        try {
            var parsedData = JSON.parse(data);
            var room = parsedData.room;
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
                console.log("Socket joined room: ".concat(room));
            }
            if (parsedData.type === 'chat') {
                var currentRoom = socketToRoom.get(ws);
                if (!currentRoom || !rooms[currentRoom]) {
                    console.warn("Cannot send message. Socket not in any valid room.");
                    return;
                }
                rooms[currentRoom].sockets.forEach(function (socket) {
                    if (socket.readyState === ws_1.WebSocket.OPEN) {
                        socket.send(data);
                    }
                });
            }
        }
        catch (e) {
            console.error("Failed to parse message:", data);
        }
    });
    ws.on('close', function () {
        var room = socketToRoom.get(ws);
        if (room && rooms[room]) {
            rooms[room].sockets.delete(ws);
            console.log("Socket disconnected from room: ".concat(room));
            if (rooms[room].sockets.size === 0) {
                delete rooms[room];
                console.log("Room deleted: ".concat(room));
            }
        }
        socketToRoom.delete(ws);
    });
    ws.send(JSON.stringify({ type: "system", message: "Connected to server." }));
});
