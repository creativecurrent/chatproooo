const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and messages
let users = {};
let messages = [];

io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Handle new user joining
    socket.on('join', (username) => {
        users[socket.id] = username;
        socket.emit('message', {
            system: true,
            text: `Welcome to the chat, ${username}!`
        });
        
        // Notify others about new user
        socket.broadcast.emit('message', {
            system: true,
            text: `${username} has joined the chat`
        });
        
        // Send message history to new user
        socket.emit('messageHistory', messages);
    });
    
    // Handle new messages
    socket.on('sendMessage', (message) => {
        const msg = {
            text: message.text,
            sender: {
                id: socket.id,
                name: users[socket.id]
            },
            timestamp: new Date().toISOString()
        };
        
        messages.push(msg);
        io.emit('message', msg);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            io.emit('message', {
                system: true,
                text: `${username} has left the chat`
            });
            delete users[socket.id];
        }
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});