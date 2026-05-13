import axios from 'axios';

// Base URL for all API requests
const BASE_URL = 'http://localhost:5000/api';

// Create a reusable Axios instance with default config
const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
// Automatically attaches JWT token from localStorage to every outgoing request.
// If no token exists, the request proceeds without the Authorization header.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
// Handles common error responses (e.g., expired token) in one place.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server returns 401 Unauthorized, clear stored credentials
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default API;
