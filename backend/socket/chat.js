const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

const convId = (a, b) => [a, b].sort().join('_');

module.exports = (io) => {
  const onlineUsers = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'peerly_secret');
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));

    socket.on('join_conversation', ({ withUserId }) => {
      const room = convId(socket.userId, withUserId);
      socket.join(room);
    });

    socket.on('send_message', async ({ to, content, fileUrl, fileName, fileType }) => {
      try {
        const cid = convId(socket.userId, to);
        const msg = await Message.create({
          conversationId: cid, sender: socket.userId, receiver: to,
          content: content || '', fileUrl: fileUrl || '',
          fileName: fileName || '', fileType: fileType || ''
        });
        const populated = await msg.populate('sender', 'name avatar');
        io.to(cid).emit('new_message', populated);

        // Deliver to receiver if online but not in room
        const receiverSocket = onlineUsers.get(to);
        if (receiverSocket) {
          io.to(receiverSocket).emit('message_notification', {
            from: socket.userId, message: content
          });
        }
      } catch (err) {
        socket.emit('error', err.message);
      }
    });

    socket.on('typing', ({ to }) => {
      const room = convId(socket.userId, to);
      socket.to(room).emit('typing', { from: socket.userId });
    });

    socket.on('stop_typing', ({ to }) => {
      const room = convId(socket.userId, to);
      socket.to(room).emit('stop_typing', { from: socket.userId });
    });

    socket.on('mark_read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, receiver: socket.userId, read: false },
        { read: true, readAt: new Date() }
      );
      socket.to(conversationId).emit('messages_read', { by: socket.userId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });
  });
};
