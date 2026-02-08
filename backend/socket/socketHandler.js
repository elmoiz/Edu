const Room = require('../models/Room');
const Message = require('../models/Message');
const { socketAuth } = require('../middleware/auth');

// Store active rooms in memory for fast access
const activeRooms = new Map();

// Fallback in-memory poll store when Redis is not available (temporary)
const pollsStore = new Map();

module.exports = (io, redisClient) => {
  // Authentication middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // Join room
    socket.on('join-room', async ({ roomId, password }) => {
      try {
        const room = await Room.findOne({ roomId }).populate('teacher', 'username');
        
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check password if private
        if (room.settings.isPrivate && room.settings.password !== password) {
          socket.emit('error', { message: 'Incorrect password' });
          return;
        }

        // Check if room is full
        if (room.participants.length >= room.settings.maxParticipants) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        // Check if user is already in room
        const existingParticipant = room.participants.find(
          p => p.user.toString() === socket.user._id.toString()
        );

        if (!existingParticipant) {
          // Add participant
          room.participants.push({
            user: socket.user._id,
            socketId: socket.id
          });
          await room.save();
        } else {
          // Update socket ID
          existingParticipant.socketId = socket.id;
          await room.save();
        }

        // Join socket room
        socket.join(roomId);
        socket.currentRoom = roomId;

        // Store in active rooms
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, {
            teacher: room.teacher._id.toString(),
            participants: new Map()
          });
        }
        activeRooms.get(roomId).participants.set(socket.id, {
          userId: socket.user._id.toString(),
          username: socket.user.username
        });

        // Notify others
        socket.to(roomId).emit('user-joined', {
          userId: socket.user._id,
          username: socket.user.username,
          socketId: socket.id,
          participantCount: room.participants.length
        });

        // Send room data to user
        const roomData = await Room.findOne({ roomId })
          .populate('participants.user', 'username profile')
          .populate('teacher', 'username profile');

        socket.emit('joined-room', {
          room: roomData,
          isTeacher: room.teacher._id.toString() === socket.user._id.toString()
        });

        console.log(`👤 ${socket.user.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // WebRTC Signaling
    socket.on('offer', ({ targetId, offer }) => {
      socket.to(targetId).emit('offer', {
        offer,
        senderId: socket.id,
        senderName: socket.user.username
      });
    });

    socket.on('answer', ({ targetId, answer }) => {
      socket.to(targetId).emit('answer', {
        answer,
        senderId: socket.id
      });
    });

    socket.on('ice-candidate', ({ targetId, candidate }) => {
      socket.to(targetId).emit('ice-candidate', {
        candidate,
        senderId: socket.id
      });
    });

    // Chat messages
    socket.on('send-message', async ({ content, type = 'text' }) => {
      try {
        if (!socket.currentRoom) return;

        const room = await Room.findOne({ roomId: socket.currentRoom });
        if (!room || !room.settings.allowChat) return;

        // Save message to database
        const message = await Message.create({
          room: room._id,
          sender: socket.user._id,
          content,
          type
        });

        await message.populate('sender', 'username profile');

        const messageData = {
          _id: message._id,
          content: message.content,
          type: message.type,
          sender: message.sender,
          createdAt: message.createdAt
        };

        // Broadcast to room
        io.to(socket.currentRoom).emit('new-message', messageData);
      } catch (error) {
        console.error('Send message error:', error);
      }
    });

    // Hand raise
    socket.on('toggle-hand', async ({ isRaised }) => {
      try {
        if (!socket.currentRoom) return;

        const room = await Room.findOne({ roomId: socket.currentRoom });
        if (!room || !room.settings.allowHandRaise) return;

        const participant = room.participants.find(
          p => p.socketId === socket.id
        );

        if (participant) {
          participant.isHandRaised = isRaised;
          await room.save();

          io.to(socket.currentRoom).emit('hand-toggled', {
            userId: socket.user._id,
            username: socket.user.username,
            isRaised
          });
        }
      } catch (error) {
        console.error('Hand raise error:', error);
      }
    });

    // Screen sharing
    socket.on('screen-share', ({ isSharing }) => {
      if (!socket.currentRoom) return;
      
      socket.to(socket.currentRoom).emit('screen-share', {
        userId: socket.user._id,
        username: socket.user.username,
        isSharing
      });
    });

    // Whiteboard
    socket.on('whiteboard-draw', (data) => {
      if (!socket.currentRoom) return;
      
      // Broadcast to others (not sender)
      socket.to(socket.currentRoom).emit('whiteboard-draw', data);
    });

    socket.on('whiteboard-clear', () => {
      if (!socket.currentRoom) return;
      socket.to(socket.currentRoom).emit('whiteboard-clear');
    });

    // Polls
    socket.on('create-poll', async ({ question, options }) => {
      try {
        if (!socket.currentRoom) return;

        const room = await Room.findOne({ roomId: socket.currentRoom });
        if (room.teacher.toString() !== socket.user._id.toString()) {
          return; // Only teacher can create polls
        }

        const pollId = Date.now().toString();
        const poll = {
          id: pollId,
          question,
          options: options.map(opt => ({ text: opt, votes: 0, voters: [] })),
          createdBy: socket.user._id,
          createdAt: new Date()
        };

        // Store poll in Redis if available, otherwise use in-memory fallback
        const pollKey = `poll:${socket.currentRoom}:${pollId}`;
        if (redisClient && typeof redisClient.setEx === 'function') {
          await redisClient.setEx(pollKey, 3600, JSON.stringify(poll));
        } else {
          pollsStore.set(pollKey, JSON.stringify(poll));
        }

        io.to(socket.currentRoom).emit('new-poll', poll);
      } catch (error) {
        console.error('Create poll error:', error);
      }
    });

    socket.on('vote-poll', async ({ pollId, optionIndex }) => {
      try {
        if (!socket.currentRoom) return;
        const pollKey = `poll:${socket.currentRoom}:${pollId}`;
        let pollData = null;
        if (redisClient && typeof redisClient.get === 'function') {
          pollData = await redisClient.get(pollKey);
        } else {
          pollData = pollsStore.get(pollKey) || null;
        }
        
        if (!pollData) return;

        const poll = JSON.parse(pollData);
        
        // Check if user already voted
        const hasVoted = poll.options.some(opt => 
          opt.voters.includes(socket.user._id.toString())
        );

        if (hasVoted) {
          socket.emit('error', { message: 'You already voted' });
          return;
        }

        // Add vote
        poll.options[optionIndex].votes++;
        poll.options[optionIndex].voters.push(socket.user._id.toString());

        if (redisClient && typeof redisClient.setEx === 'function') {
          await redisClient.setEx(pollKey, 3600, JSON.stringify(poll));
        } else {
          pollsStore.set(pollKey, JSON.stringify(poll));
        }

        io.to(socket.currentRoom).emit('poll-updated', poll);
      } catch (error) {
        console.error('Vote poll error:', error);
      }
    });

    // Room controls (teacher only)
    socket.on('mute-all', async () => {
      try {
        if (!socket.currentRoom) return;

        const room = await Room.findOne({ roomId: socket.currentRoom });
        if (room.teacher.toString() !== socket.user._id.toString()) return;

        io.to(socket.currentRoom).emit('mute-all');
      } catch (error) {
        console.error('Mute all error:', error);
      }
    });

    socket.on('end-room', async () => {
      try {
        if (!socket.currentRoom) return;

        const room = await Room.findOne({ roomId: socket.currentRoom });
        if (room.teacher.toString() !== socket.user._id.toString()) return;

        room.status = 'ended';
        room.endedAt = new Date();
        await room.save();

        io.to(socket.currentRoom).emit('room-ended');
        
        // Clean up
        activeRooms.delete(socket.currentRoom);
      } catch (error) {
        console.error('End room error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);
      
      if (socket.currentRoom) {
        try {
          const room = await Room.findOne({ roomId: socket.currentRoom });
          if (room) {
            room.participants = room.participants.filter(
              p => p.socketId !== socket.id
            );
            await room.save();

            // Update active rooms
            const activeRoom = activeRooms.get(socket.currentRoom);
            if (activeRoom) {
              activeRoom.participants.delete(socket.id);
              if (activeRoom.participants.size === 0) {
                activeRooms.delete(socket.currentRoom);
              }
            }

            socket.to(socket.currentRoom).emit('user-left', {
              userId: socket.user._id,
              username: socket.user.username,
              participantCount: room.participants.length
            });
          }
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }
    });
  });
};