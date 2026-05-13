# HabitFlow: Project Architecture & Implementation

HabitFlow is a full-stack SaaS application designed for habit tracking with a focus on premium aesthetics and performance. It follows the **MERN** (MongoDB, Express, React, Node.js) architecture.

## 🏗️ High-Level Architecture

The project is split into two main directories:
1.  **`backend/`**: A RESTful API built with Node.js and Express, using MongoDB for data persistence.
2.  **`frontend/`**: A modern SPA (Single Page Application) built with React and Vite, styled with a custom "Space Black" design system.

---

## 🔐 Backend Implementation (`/backend`)

The backend follows a standard MVC-inspired pattern:

### 1. Data Models (`src/models`)
*   **`User.js`**: Stores user credentials, profile info, and stats (like total XP or level).
*   **`Habit.js`**: Defines habit metadata (title, description, frequency, reminder time) and associates it with a user.
*   **`HabitLog.js`**: Records completion instances. This decoupling allows for efficient history tracking and streak calculation without bloating the `Habit` document.

### 2. Authentication (`src/middleware/authMiddleware.js`)
*   Uses **JWT (JSON Web Tokens)** for stateless authentication.
*   Passwords are hashed using **bcrypt** before storage.
*   The `protect` middleware intercepts requests to private routes, validates the token, and attaches the `user` object to the request.

### 3. API Routes (`src/routes`)
*   **Auth**: Login, Register, and "Get Current User" (`/api/auth`).
*   **Habits**: CRUD operations for habits and logging daily completions (`/api/habits`).
*   **Leaderboard**: Aggregates user stats to provide a competitive ranking (`/api/leaderboard`).

---

## 🎨 Frontend Implementation (`/frontend`)

The frontend is designed for a premium user experience with a "Space Black" aesthetic.

### 1. State & Data Flow
*   **Axios Interceptors**: Located in `src/api/axios.js`, these automatically attach the JWT token from `localStorage` to every request and handle 401 (Unauthorized) errors globally.
*   **Custom Hooks**: `useAuth.js` manages authentication state and persistence.
*   **Dashboard Logic**: The main dashboard (`Dashboard.jsx`) fetches habits and user stats on mount and coordinates the UI updates.

### 2. Key Components
*   **`HabitCard`**: Displays individual habits with progress bars and completion toggles.
*   **`Leaderboard`**: A sticky sidebar component that displays top performers.
*   **`AddHabitForm`**: A clean modal or inline form for creating new habits.
*   **`DashboardHeader`**: A glassmorphic header containing user profile info and navigation.

### 3. Core Features
*   **Reminder System**: Uses the browser's **Notifications API**. A background interval in the Dashboard checks every minute if any habit's `reminderTime` matches the current time.
*   **Responsive Layout**: A 2-column grid system that adapts to different screen sizes, keeping the leaderboard accessible.
*   **Micro-interactions**: Subtle hover effects, smooth transitions, and glassmorphism effects for a premium feel.

---

## 🔄 How things work together (The "Flow")

1.  **User Access**: A user lands on the site. If logged in, they are redirected to `/dashboard`; otherwise, they see the Login page.
2.  **Habit Management**: When a user creates a habit, the frontend sends a POST request to `/api/habits`. The backend saves it to MongoDB and returns the new habit.
3.  **Tracking Progress**: Clicking "Complete" sends a log entry to `/api/habits/:id/log`. The backend updates the streak and XP, and the frontend refreshes to show the updated progress.
4.  **Notifications**: If a habit has a reminder set (e.g., 08:00 AM), the frontend triggers a system notification when that time is reached, even if the user isn't actively looking at the tab.
