import { useState } from 'react';

const AddHabitForm = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation: title must not be empty
    if (!title.trim()) {
      setError('Habit title is required');
      return;
    }

    setLoading(true);

    try {
      await onAdd({ title: title.trim(), description: description.trim(), reminderTime: reminderEnabled ? reminderTime : '' });

      // Clear form inputs on success
      setTitle('');
      setDescription('');
      setReminderTime('');
      setReminderEnabled(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-habit-section">
      <h3>Add New Habit</h3>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="add-habit-form-container">
        <div className="form-group">
          <label htmlFor="habit-title">Title</label>
          <input
            type="text"
            id="habit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning Run"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="habit-desc">Description (optional)</label>
          <input
            type="text"
            id="habit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Run 3km every morning"
          />
        </div>

        <div className="form-group reminder-form-group">
          <div className="reminder-top-row">
            <label className="reminder-label">⏰ Set Reminder</label>
            <label className="reminder-toggle">
              <input 
                type="checkbox" 
                checked={reminderEnabled} 
                onChange={(e) => setReminderEnabled(e.target.checked)} 
              />
              <span className="toggle-track">
                <span className="toggle-thumb"></span>
              </span>
            </label>
          </div>
          {reminderEnabled && (
            <div className="reminder-editor">
              <div className="reminder-input-group">
                <span className="reminder-clock-icon">🕐</span>
                <input
                  type="time"
                  id="habit-reminder"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="reminder-time-input"
                />
              </div>
              <p className="reminder-hint">Reminder will notify you daily at this time</p>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : '+ Add Habit'}
        </button>
      </form>
    </div>
  );
};

export default AddHabitForm;
