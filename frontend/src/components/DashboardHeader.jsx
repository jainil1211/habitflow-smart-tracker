import { getUser, clearAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = ({ userData, user, onLogout }) => {
  return (
    <div className="dashboard-header">
      <div className="dashboard-header-left">
        <h2>Your Habits</h2>
        <span className="header-divider">&middot;</span>
        <p className="header-welcome">
          {userData ? `Welcome, ${userData.name}` : user ? `Welcome, ${user.name}` : 'Track, streak, and grow every day'}
        </p>
      </div>
      <div className="user-stats">
        {userData && (
          <>
            <div className="level-badge">Lvl {userData.level || 1}</div>
            <div className="points-badge">{userData.points || 0} pts</div>
          </>
        )}
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
