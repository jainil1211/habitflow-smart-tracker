import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="brand-icon">🔥</span>
          <span className="brand-text">HabitFlow</span>
        </Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-greeting">Hey, {user.name}</span>
            <Link to="/" className="nav-link">Dashboard</Link>
            <button onClick={handleLogout} className="btn btn-logout">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link btn btn-primary-outline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
