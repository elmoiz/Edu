const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  socketId: String,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isAudioEnabled: {
    type: Boolean,
    default: true
  },
  isVideoEnabled: {
    type: Boolean,
    default: true
  },
  isHandRaised: {
    type: Boolean,
    default: false
  },
  isScreenSharing: {
    type: Boolean,
    default: false
  }
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  subject: String,
  grade: String,
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [participantSchema],
  settings: {
    maxParticipants: {
      type: Number,
      default: 20
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    allowHandRaise: {
      type: Boolean,
      default: true
    },
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    isRecording: {
      type: Boolean,
      default: false
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    password: String
  },
  status: {
    type: String,
    enum: ['waiting', 'live', 'ended', 'recorded'],
    default: 'waiting'
  },
  startedAt: Date,
  endedAt: Date,
  recordingUrl: String,
  whiteboardData: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Methods
roomSchema.methods.addParticipant = async function(userId, socketId) {
  const exists = this.participants.find(p => p.user.toString() === userId.toString());
  if (!exists) {
    this.participants.push({ user: userId, socketId });
    await this.save();
  }
  return this;
};

roomSchema.methods.removeParticipant = async function(socketId) {
  this.participants = this.participants.filter(p => p.socketId !== socketId);
  await this.save();
  return this;
};

roomSchema.methods.getParticipantCount = function() {
  return this.participants.length;
};

module.exports = mongoose.model('Room', roomSchema);