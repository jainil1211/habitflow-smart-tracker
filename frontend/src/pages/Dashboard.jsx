import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getUser, clearAuth } from '../hooks/useAuth';
import HabitCard from '../components/HabitCard';
import AddHabitForm from '../components/AddHabitForm';
import Leaderboard from '../components/Leaderboard';
import DashboardHeader from '../components/DashboardHeader';

const Dashboard = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const user = getUser();
  const notifiedHabitsRef = useRef(new Set());
  const habitsRef = useRef([]);

  // Keep habitsRef in sync so the interval always reads the latest habits
  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        console.log('[Reminders] Requesting notification permission...');
        Notification.requestPermission().then(perm => {
          console.log('[Reminders] Permission result:', perm);
        });
      } else {
        console.log('[Reminders] Notification permission already:', Notification.permission);
      }
    } else {
      console.warn('[Reminders] Browser does not support Notifications API');
    }
  }, []);

  // Reminder checker function
  const checkReminders = useCallback(() => {
    const currentHabits = habitsRef.current;
    if (!currentHabits || currentHabits.length === 0) return;

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    console.log(`[Reminders] Checking at ${currentTime} on ${dateStr}`);

    currentHabits.forEach(habit => {
      if (!habit.reminderTime) return;

      console.log(`[Reminders]   "${habit.title}" reminder=${habit.reminderTime} vs now=${currentTime}`);

      if (habit.reminderTime === currentTime) {
        const notificationKey = `${habit._id}-${dateStr}`;

        if (!notifiedHabitsRef.current.has(notificationKey)) {
          console.log(`[Reminders] 🔔 TRIGGERING notification for "${habit.title}"`);
          try {
            new Notification('⏰ Habit Reminder', {
              body: `Time for your habit: ${habit.title}`,
            });
          } catch (err) {
            console.error('[Reminders] Notification creation failed:', err);
          }
          notifiedHabitsRef.current.add(notificationKey);
        } else {
          console.log(`[Reminders]   Already notified for "${habit.title}" today`);
        }
      }
    });
  }, []);

  // Set up reminder interval once on mount — reads habitsRef so no dependency on habits state
  useEffect(() => {
    // Run an immediate check
    checkReminders();

    const interval = setInterval(checkReminders, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [checkReminders]);

  // Fetch habits on component mount
  useEffect(() => {
    fetchUserData();
    fetchHabits();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await API.get('/auth/me');
      setUserData(res.data);
    } catch (err) {
      console.error('Failed to fetch user data');
    }
  };

  const fetchHabits = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await API.get('/habits');

      // Handle both response formats: array or { data: [...] }
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setHabits(data);
    } catch (err) {
      // If unauthorized, redirect to login
      if (err.response && err.response.status === 401) {
        clearAuth();
        navigate('/');
        return;
      }
      setError(err.response?.data?.message || 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  };

  // Create a new habit
  const handleAddHabit = async (habitData) => {
    const res = await API.post('/habits', habitData);

    // Refresh habit list after creation
    fetchHabits();
  };

  // Mark a habit as completed for today
  const handleComplete = async (habitId) => {
    const today = new Date().toISOString().split('T')[0];

    try {
      await API.post(`/habits/${habitId}/log`, {
        date: today,
        completed: true,
      });

      // Refresh habit list and user stats after completion
      fetchHabits();
      fetchUserData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark habit as complete');
    }
  };

  // Logout handler
  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <div className="app-wrapper">
      <DashboardHeader 
        userData={userData} 
        user={user} 
        onLogout={handleLogout} 
      />

      {error && <div className="alert-error">{error}</div>}

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <Leaderboard />
        </aside>

        <main className="dashboard-main">
          <AddHabitForm onAdd={handleAddHabit} />

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Loading habits...</p>
            </div>
          ) : habits.length === 0 ? (
            <div className="empty-state">
              <h3>No habits yet</h3>
              <p>Create your first habit above to start tracking!</p>
            </div>
          ) : (
            <div className="habits-grid">
              {habits.map((habit) => (
                <HabitCard
                  key={habit._id}
                  habit={habit}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

