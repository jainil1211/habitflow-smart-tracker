import { useState, useEffect } from 'react';
import API from '../api/axios';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await API.get('/leaderboard');
      setLeaders(res.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Could not load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-section glass-panel">
        <div className="data-loading">
          <div className="spinner"></div> Loading leaderboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-section glass-panel">
        <p className="data-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-section glass-panel">
      <div className="leaderboard-header">
        <h3>Weekly Leaderboard</h3>
        <p>Top performers in the last 7 days</p>
      </div>
      
      {leaders.length === 0 ? (
        <p className="empty-leaderboard">No activity this week yet.</p>
      ) : (
        <ul className="leaderboard-list">
          {leaders.map((user, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            return (
              <li key={user._id} className={`leaderboard-item ${isTop3 ? 'top-3 rank-' + rank : ''}`}>
                <div className="rank-badge">#{rank}</div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-level">Lvl {user.level}</span>
                </div>
                <div className="user-score">
                  <span className="score-value">{user.weeklyPoints}</span>
                  <span className="score-label">pts</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Leaderboard;
