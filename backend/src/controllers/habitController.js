const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const { validationResult } = require('express-validator');

// @desc    Create a new habit
// @route   POST /api/habits
// @access  Private
exports.createHabit = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array().map(e => e.msg).join(', ')));
  }

  const { title, description, reminderTime } = req.body;

  try {
    const habit = new Habit({
      title,
      description,
      reminderTime: reminderTime || '',
      userId: req.user.id
    });

    const savedHabit = await habit.save();
    
    // Return success pattern
    res.status(201).json({
      success: true,
      data: savedHabit
    });
  } catch (err) {
    // Propagate error to centralized error middleware
    next(err);
  }
};

// @desc    Get all habits for logged-in user
// @route   GET /api/habits
// @access  Private
exports.getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: habits.length,
      data: habits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a habit
// @route   PUT /api/habits/:id
// @access  Private
exports.updateHabit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, reminderTime } = req.body;

  try {
    let habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Ensure the user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this habit' });
    }

    // Update fields
    if (title) habit.title = title;
    if (description !== undefined) habit.description = description;
    if (reminderTime !== undefined) habit.reminderTime = reminderTime;

    const updatedHabit = await habit.save();
    res.status(200).json(updatedHabit);
  } catch (err) {
    console.error('Update habit error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Ensure the user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this habit' });
    }

    await Habit.deleteOne({ _id: req.params.id });

    // Cleanup associated habit logs
    await HabitLog.deleteMany({ habitId: req.params.id });

    res.status(200).json({ message: 'Habit removed successfully' });
  } catch (err) {
    console.error('Delete habit error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark a habit as completed for a specific date
// @route   POST /api/habits/:id/log
// @access  Private
exports.logHabit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, completed } = req.body;
  const habitId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if habit exists and belongs to user
    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    if (habit.userId.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized for this habit' });
    }

    // Normalize date to 00:00:00 to prevent duplicates on the same day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    let log = await HabitLog.findOne({
      habitId,
      userId,
      date: startOfDay
    });

    let isNewLog = false;
    let pointsAdded = 0;

    if (log) {
      // Update existing log to prevent duplicates
      const isCompleting = !log.completed && (completed !== undefined ? completed : true);
      const isUncompleting = log.completed && completed === false;
      
      if (isCompleting) pointsAdded = 10;
      else if (isUncompleting) pointsAdded = -10;

      log.completed = completed !== undefined ? completed : true;
      await log.save();
    } else {
      // Create new log
      isNewLog = true;
      const isCompleted = completed !== undefined ? completed : true;
      log = new HabitLog({
        habitId,
        userId,
        date: startOfDay,
        completed: isCompleted
      });
      await log.save();
      
      if (isCompleted) pointsAdded = 10;
    }

    if (pointsAdded !== 0) {
      const User = require('../models/User');
      const userDoc = await User.findById(userId);
      if (userDoc) {
        userDoc.points += pointsAdded;
        if (userDoc.points < 0) userDoc.points = 0;
        userDoc.level = Math.floor(userDoc.points / 100) + 1;
        await userDoc.save();
      }
    }

    return res.status(isNewLog ? 201 : 200).json(log);
  } catch (err) {
    console.error('Log habit error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get streak for a specific habit
// @route   GET /api/habits/:id/streak
// @access  Private
exports.getStreak = async (req, res) => {
  const habitId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. Verify habit exists and belongs to user
    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    if (habit.userId.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized for this habit' });
    }

    // 2. Fetch only required logs (completed = true), sort by date descending
    const logs = await HabitLog.find({ habitId, userId, completed: true }).sort({ date: -1 });

    if (!logs || logs.length === 0) {
      return res.status(200).json({ streak: 0 });
    }

    // 3. Normalize dates to 'YYYY-MM-DD' and store in a Set for O(1) lookup
    // Using toISOString() ensures we compare standard UTC dates and avoid local timezone issues
    const logDates = new Set(logs.map(log => {
      return new Date(log.date).toISOString().split('T')[0];
    }));

    let streak = 0;
    
    // 4. Strict continuity check starting from today
    const checkDate = new Date(); 

    while (true) {
      // Normalize checkDate to 'YYYY-MM-DD'
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (logDates.has(dateStr)) {
        // If the date exists, increment streak
        streak++;
        // Move backward one day using UTC date math to avoid timezone shifts
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else {
        // Stop immediately if any day is missed (no leniency for skipping today)
        break;
      }
    }

    res.status(200).json({ streak });
  } catch (err) {
    console.error('Streak calculation error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get calendar data for a specific habit
// @route   GET /api/habits/:id/calendar
// @access  Private
exports.getCalendar = async (req, res) => {
  const habitId = req.params.id;
  const userId = req.user.id;

  try {
    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    if (habit.userId.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized for this habit' });
    }

    const logs = await HabitLog.find({ habitId, userId }).sort({ date: 1 });

    const calendarData = logs.map(log => ({
      date: new Date(log.date).toISOString().split('T')[0],
      completed: log.completed
    }));

    // Deduplicate dates in case of overlapping entries
    const uniqueMap = {};
    for (const item of calendarData) {
      uniqueMap[item.date] = item.completed;
    }

    const result = Object.keys(uniqueMap).map(date => ({
      date,
      completed: uniqueMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(result);
  } catch (err) {
    console.error('Calendar error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
