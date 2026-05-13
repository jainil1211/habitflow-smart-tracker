import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../hooks/useAuth';

// Wraps a route — if no token, redirect to login
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
