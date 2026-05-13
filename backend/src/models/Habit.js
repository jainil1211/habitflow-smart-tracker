const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a habit title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    reminderTime: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Habit', HabitSchema);
