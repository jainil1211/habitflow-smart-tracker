const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

// @desc    Get progress for a specific habit
// @route   GET /api/habits/:id/progress
// @access  Private
exports.getProgress = async (req, res) => {
  const habitId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. Verify habit exists and belongs to the user
    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    if (habit.userId.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized for this habit' });
    }

    // 2. Fetch only required logs (completed = true)
    // Optimized query: Select only the 'date' field to minimize memory usage
    const completedLogs = await HabitLog.find({
      habitId,
      userId,
      completed: true
    }).select('date -_id');

    // Total completed days is simply the count of these logs
    const totalCompletedDays = completedLogs.length;

    // 3. Normalize dates to 'YYYY-MM-DD' and store in a Set for O(1) lookup
    // Using toISOString ensures we rely on standard UTC formatting, preventing timezone bugs
    const completedDatesSet = new Set(
      completedLogs.map(log => new Date(log.date).toISOString().split('T')[0])
    );

    // 4. Calculate weekly progress (last 7 days data)
    const weeklyProgress = [];
    let completedInLast7Days = 0;
    
    const today = new Date();

    // Iterate backwards starting from today down to 6 days ago
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date();
      // Use UTC date math to move backward reliably
      checkDate.setUTCDate(today.getUTCDate() - i);
      
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // Determine if this specific date exists in our Set of completed logs
      const isCompleted = completedDatesSet.has(dateStr);
      
      if (isCompleted) {
        completedInLast7Days++;
      }

      // Handle missing days by marking completed as false automatically
      weeklyProgress.push({
        date: dateStr,
        completed: isCompleted
      });
    }

    // Sort weekly progress so the oldest date is first (typical for frontend graphs/UI)
    weeklyProgress.sort((a, b) => a.date.localeCompare(b.date));

    // 5. Calculate completion percentage based purely on the last 7 days
    const weeklyCompletionPercentage = Math.round((completedInLast7Days / 7) * 100);

    // 6. Return structured data
    res.status(200).json({
      totalCompletedDays,
      weeklyCompletionPercentage,
      weeklyProgress
    });
  } catch (err) {
    console.error('Progress calculation error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
