const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const habitController = require('../controllers/habitController');
const authMiddleware = require('../middleware/authMiddleware');
const progressController = require('../controllers/progressController');

// Protect all routes by mounting middleware here
router.use(authMiddleware);

// @route   POST /api/habits
// @route   GET /api/habits
router.route('/')
  .post(
    [
      check('title', 'Habit title is required').not().isEmpty(),
    ],
    habitController.createHabit
  )
  .get(habitController.getHabits);

// @route   PUT /api/habits/:id
// @route   DELETE /api/habits/:id
router.route('/:id')
  .put(
    [
      check('title', 'Habit title cannot be empty if provided').optional().not().isEmpty(),
    ],
    habitController.updateHabit
  )
  .delete(habitController.deleteHabit);

// @route   POST /api/habits/:id/log
router.post(
  '/:id/log',
  [
    check('date', 'Valid date is required').isISO8601()
  ],
  habitController.logHabit
);

// @route   GET /api/habits/:id/streak
router.get('/:id/streak', habitController.getStreak);

// @route   GET /api/habits/:id/progress
router.get('/:id/progress', progressController.getProgress);

// @route   GET /api/habits/:id/calendar
router.get('/:id/calendar', habitController.getCalendar);

module.exports = router;
