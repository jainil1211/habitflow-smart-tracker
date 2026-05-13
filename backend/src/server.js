require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const habitRoutes = require('./routes/habitRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to HabitFlow API' });
});

// Centralized Error Handler (must be after routes)
app.use(errorHandler);

// The remaining MVC architecture folders are set up:
// - src/controllers
// - src/models
// - src/routes
// - src/middleware
// - src/config
// - src/utils

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
