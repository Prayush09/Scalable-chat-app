"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var wss = new ws_1.WebSocketServer({ port: 8080 });
var servers = [];
wss.on('connection', function (ws) {
    ws.on('error', console.error);
    servers.push(ws);
    ws.on('message', function message(data) {
        servers.map(function (socket) {
            socket.send(data);
        });
    });
});
