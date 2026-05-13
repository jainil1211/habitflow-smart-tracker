const User = require('../models/User');
const HabitLog = require('../models/HabitLog');

// @desc    Get weekly leaderboard
// @route   GET /api/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: 'habitlogs',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] },
                completed: true,
                date: { $gte: sevenDaysAgo }
              }
            }
          ],
          as: 'weeklyLogs'
        }
      },
      {
        $project: {
          name: 1,
          level: { $ifNull: ['$level', 1] },
          weeklyPoints: { $multiply: [{ $size: '$weeklyLogs' }, 10] }
        }
      },
      {
        $sort: { weeklyPoints: -1, name: 1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
