// Reusable auth utility functions

// Check if user is currently authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Get current user data from localStorage
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get current token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Clear all auth data
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
