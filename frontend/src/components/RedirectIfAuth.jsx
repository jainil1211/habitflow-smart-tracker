import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../hooks/useAuth';

// Wraps auth pages — if already logged in, redirect to dashboard
const RedirectIfAuth = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RedirectIfAuth;
