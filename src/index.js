const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');
const { toCaptalize } = require('./utils/string');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use('/', express.static(path.resolve(__dirname, '..', 'uploads')));

io.on('connection', (socket) => {
  console.log('New WebSocket connection');


  socket.on('join', (options, cb) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return cb(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('server', 'Welcome!'));
    socket.broadcast.to(user.room).emit('message',
      generateMessage('server', `${toCaptalize(user.username)} has joined!`));

    let users = getUsersInRoom(user.room);

    users = users.map(user => {
      user.username = toCaptalize(user.username);
      return user;
    });

    io.to(user.room).emit('roomData', {
      room: user.room,
      users
    });

    cb();
  });

  socket.on('sendMessage', (message, cb) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('message',
      generateMessage(user.username, message));
    cb();
  });

  socket.on('sendLocation', ({ lat, lng }, cb) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('locationMessage',
      generateLocationMessage(user.username, `https://google.com/maps?q=${lat},${lng}`));
    cb();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', generateMessage('server', `${toCaptalize(user.username)} has left!`));

      let users = getUsersInRoom(user.room);

      users = users.map(user => {
        user.username = toCaptalize(user.username);
        return user;
      });

      io.to(user.room).emit('roomData', {
        room: user.room,
        users
      });
    }
  });
});

server.listen(process.env.PORT || 3000);