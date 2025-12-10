const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { GameSession } = require('./gameLogic');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const games = {}; // Store active games

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create Game
    socket.on('create_game', ({ mode }) => {
        const roomId = uuidv4().slice(0, 6); // Short code
        games[roomId] = new GameSession(roomId, socket.id, mode);
        socket.join(roomId);
        socket.emit('game_started', games[roomId]);
    });

    // Join Game (Multiplayer)
    socket.on('join_game', (roomId) => {
        if (games[roomId] && games[roomId].mode === 'MULTIPLAYER') {
            games[roomId].addPlayer(socket.id, 'Human');
            socket.join(roomId);
            io.to(roomId).emit('player_joined', games[roomId]);
        } else {
            socket.emit('error', 'Room not found or is Single Player');
        }
    });

    // Player Action
    socket.on('action', ({ roomId, actionType }) => {
        const game = games[roomId];
        if (game) {
            game.processAction(socket.id, actionType);
            io.to(roomId).emit('update_state', game);
        }
    });
});

const PORT = process.env.PORT || 4000;
const path = require('path');
// Serve static files from React app
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));