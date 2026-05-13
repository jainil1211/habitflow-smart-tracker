import { useState, useEffect } from 'react';
import API from '../api/axios';

const HabitCard = ({ habit, onComplete }) => {
  const [completing, setCompleting] = useState(false);

  // Streak state
  const [streak, setStreak] = useState(null);

  // Progress state
  const [percentage, setPercentage] = useState(null);
  const [weekly, setWeekly] = useState([]);

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarData, setCalendarData] = useState({});
  const [calLoading, setCalLoading] = useState(false);

  // Reminder state
  const [editingReminder, setEditingReminder] = useState(false);
  const [reminderInput, setReminderInput] = useState(habit.reminderTime || '');
  const [reminderEnabled, setReminderEnabled] = useState(!!habit.reminderTime);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // Combined loading and error state for both API calls
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  // Fetch streak and progress together on mount
  useEffect(() => {
    fetchHabitData();
  }, [habit._id]);

  const fetchHabitData = async () => {
    setDataLoading(true);
    setDataError('');

    try {
      // Fetch both in parallel to avoid unnecessary sequential calls
      const [streakRes, progressRes] = await Promise.all([
        API.get(`/habits/${habit._id}/streak`),
        API.get(`/habits/${habit._id}/progress`),
      ]);

      setStreak(streakRes.data.streak);
      setPercentage(progressRes.data.weeklyCompletionPercentage);
      setWeekly(progressRes.data.weeklyProgress || []);
    } catch (err) {
      setDataError('Failed to load habit data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleClick = async () => {
    setCompleting(true);
    await onComplete(habit._id);

    // Refresh streak and progress after completing
    fetchHabitData();
    if (showCalendar) {
      fetchCalendar(); // refresh calendar if open
    }
    setCompleting(false);
  };

  const fetchCalendar = async () => {
    setCalLoading(true);
    try {
      const res = await API.get(`/habits/${habit._id}/calendar`);
      const map = {};
      res.data.forEach(item => {
        map[item.date] = item.completed;
      });
      setCalendarData(map);
    } catch (err) {
      console.error('Failed to load calendar data');
    } finally {
      setCalLoading(false);
    }
  };

  const handleToggleCalendar = () => {
    if (!showCalendar && Object.keys(calendarData).length === 0) {
      fetchCalendar();
    }
    setShowCalendar(!showCalendar);
  };

  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const monthName = today.toLocaleString('default', { month: 'long' });

    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <span>{monthName} {year}</span>
        </div>
        {calLoading ? (
          <div className="data-loading" style={{ justifyContent: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="calendar-grid">
            {weekDays.map(wd => <div key={wd} className="cal-weekday">{wd}</div>)}
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="cal-cell empty"></div>;
              
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday = dateStr === today.toISOString().split('T')[0];
              const status = calendarData[dateStr];
              
              let cls = 'cal-cell ';
              if (status === true) cls += 'completed ';
              else if (status === false) cls += 'missed ';
              
              if (isToday) cls += 'today ';
              
              return (
                <div key={day} className={cls} title={dateStr}>
                  {day}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="habit-card">
      <div className="habit-header">
        <h3>{habit.title}</h3>
        {streak !== null && (
          <div className="streak-badge">
            🔥 {streak}
          </div>
        )}
      </div>
      {habit.description && <p className="habit-desc">{habit.description}</p>}

      <div className="reminder-widget">
        <div className="reminder-top-row">
          <span className="reminder-label">⏰ Set Reminder</span>
          <label className="reminder-toggle">
            <input 
              type="checkbox" 
              checked={reminderEnabled} 
              onChange={async (e) => {
                const enabled = e.target.checked;
                setReminderEnabled(enabled);
                if (!enabled) {
                  try {
                    await API.put(`/habits/${habit._id}`, { reminderTime: '' });
                    habit.reminderTime = '';
                    setReminderInput('');
                    setEditingReminder(false);
                    showToast('Reminder disabled');
                  } catch (err) {
                    console.error('Failed to clear reminder');
                  }
                } else {
                  setEditingReminder(true);
                }
              }}
            />
            <span className="toggle-track">
              <span className="toggle-thumb"></span>
            </span>
          </label>
        </div>

        {reminderEnabled && editingReminder && (
          <div className="reminder-editor">
            <div className="reminder-input-group">
              <span className="reminder-clock-icon">🕐</span>
              <input
                type="time"
                value={reminderInput}
                onChange={(e) => setReminderInput(e.target.value)}
                className="reminder-time-input"
              />
            </div>
            <p className="reminder-hint">Reminder will notify you daily</p>
            <div className="reminder-actions">
              <button className="reminder-btn save" onClick={async () => {
                if (!reminderInput) return;
                try {
                  await API.put(`/habits/${habit._id}`, { reminderTime: reminderInput });
                  habit.reminderTime = reminderInput;
                  setEditingReminder(false);
                  showToast(`Reminder set at ${reminderInput}`);
                } catch (err) {
                  console.error('Failed to update reminder');
                }
              }}>Save</button>
              <button className="reminder-btn cancel" onClick={() => {
                setEditingReminder(false);
                if (!habit.reminderTime) setReminderEnabled(false);
              }}>Cancel</button>
            </div>
          </div>
        )}

        {reminderEnabled && !editingReminder && habit.reminderTime && (
          <div className="reminder-badge-row" onClick={() => setEditingReminder(true)}>
            <span className="reminder-active-badge">
              <span className="reminder-badge-dot"></span>
              Reminder set at {habit.reminderTime}
            </span>
            <span className="edit-hint">edit</span>
          </div>
        )}

        {toastVisible && (
          <div className="reminder-toast">{toastMessage}</div>
        )}
      </div>

      {dataLoading ? (
        <div className="data-loading">
          <div className="spinner"></div> Loading stats...
        </div>
      ) : dataError ? (
        <p className="data-error">{dataError}</p>
      ) : (
        <>
          <div className="progress-container">
            <div className="progress-header">
              <span className="progress-label">Weekly Progress</span>
              <span className="progress-value">{percentage}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${percentage || 0}%` }}></div>
            </div>
          </div>

          <div className="weekly-section">
            <p className="weekly-label">Last 7 days</p>
            <div className="weekly-grid">
              {weekly.map((day) => (
                <div
                  key={day.date}
                  className={`day-dot ${day.completed ? 'completed' : 'missed'}`}
                  title={day.date}
                />
              ))}
            </div>
          </div>

          <button className="calendar-toggle" onClick={handleToggleCalendar}>
            {showCalendar ? 'Hide Calendar' : 'View Calendar'}
          </button>

          {showCalendar && renderCalendar()}
        </>
      )}

      <button
        className="btn btn-complete"
        onClick={handleClick}
        disabled={completing}
      >
        {completing ? 'Completing...' : '✓ Completed Today'}
      </button>
    </div>
  );
};

export default HabitCard;
