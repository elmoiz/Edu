const express = require('express');
const { body } = require('express-validator');
const Room = require('../models/Room');
const { authMiddleware, restrictTo } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/rooms
// @desc    Create new room
// @access  Private (Teachers only)
router.post('/', [
  authMiddleware,
  restrictTo('teacher', 'admin'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').optional().trim(),
  body('grade').optional().trim()
], async (req, res) => {
  try {
    const { title, description, subject, grade, settings } = req.body;
    
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const room = await Room.create({
      roomId,
      title,
      description,
      subject,
      grade,
      teacher: req.user._id,
      settings: settings || {}
    });

    await room.populate('teacher', 'username profile');
    
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms
// @desc    Get all rooms
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, subject, grade, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    
    // If student, show only their rooms or public rooms
    if (req.user.role === 'student') {
      query.$or = [
        { 'participants.user': req.user._id },
        { 'settings.isPrivate': false }
      ];
    }
    
    // If teacher, show only their rooms
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    const rooms = await Room.find(query)
      .populate('teacher', 'username profile')
      .populate('participants.user', 'username profile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Room.countDocuments(query);

    res.json({
      rooms,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms/:roomId
// @desc    Get single room
// @access  Private
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('teacher', 'username profile')
      .populate('participants.user', 'username profile');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/rooms/:roomId
// @desc    Update room
// @access  Private (Teacher only)
router.put('/:roomId', authMiddleware, restrictTo('teacher', 'admin'), async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the teacher
    if (room.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'participants' && key !== 'teacher') {
        room[key] = updates[key];
      }
    });

    await room.save();
    await room.populate('teacher', 'username profile');
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/rooms/:roomId
// @desc    Delete room
// @access  Private (Teacher only)
router.delete('/:roomId', authMiddleware, restrictTo('teacher', 'admin'), async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms/:roomId/messages
// @desc    Get room messages
// @access  Private
router.get('/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const messages = await Message.find({ room: room._id })
      .populate('sender', 'username profile')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;