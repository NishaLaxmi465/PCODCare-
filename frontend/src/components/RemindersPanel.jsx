import { Bell, CalendarPlus, Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api, apiErrorMessage } from '../api/client.js';

function localDateTime(date) {
  return date ? new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'No time set';
}

export default function RemindersPanel({ notifications = [], appointments = [], onChanged }) {
  const [reminder, setReminder] = useState({
    type: 'water',
    title: 'Drink water',
    message: 'Time for a hydration break',
    reminderAt: '',
    repeat: 'daily',
  });
  const [appointment, setAppointment] = useState({
    doctorName: '',
    specialty: 'Gynecologist',
    dateTime: '',
    location: '',
    reason: '',
  });
  const [status, setStatus] = useState('');

  const updateReminder = (key, value) => {
    setReminder((current) => {
      const next = { ...current, [key]: value };
      if (key === 'type') {
        if (value === 'water') return { ...next, title: 'Drink water', message: 'Time for a hydration break' };
        if (value === 'exercise') return { ...next, title: 'Move your body', message: 'A short walk or stretch can help' };
        if (value === 'medicine') return { ...next, title: 'Take medicine', message: 'Medicine reminder' };
      }
      return next;
    });
  };
  const updateAppointment = (key, value) => setAppointment((current) => ({ ...current, [key]: value }));

  const createReminder = async (event) => {
    event.preventDefault();
    setStatus('Saving reminder...');
    try {
      await api.post('/notifications', reminder);
      setStatus('Reminder saved');
      onChanged?.();
    } catch (error) {
      setStatus(apiErrorMessage(error, 'Could not save reminder'));
    }
  };

  const createAppointment = async (event) => {
    event.preventDefault();
    setStatus('Saving appointment...');
    try {
      await api.post('/appointments', appointment);
      setAppointment({ doctorName: '', specialty: 'Gynecologist', dateTime: '', location: '', reason: '' });
      setStatus('Appointment saved');
      onChanged?.();
    } catch (error) {
      setStatus(apiErrorMessage(error, 'Could not save appointment'));
    }
  };

  const markRead = async (notification) => {
    await api.patch(`/notifications/${notification._id}`, { read: true });
    onChanged?.();
  };

  const removeNotification = async (notification) => {
    await api.delete(`/notifications/${notification._id}`);
    onChanged?.();
  };

  return (
    <div>
      <div className="section-heading page-heading">
        <div>
          <p className="eyebrow">Reminders</p>
          <h2>Medicine, water, exercise, and appointments</h2>
        </div>
        {status ? <span className="form-status">{status}</span> : null}
      </div>

      <div className="two-column">
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>Reminder</h2>
            </div>
            <Bell size={20} />
          </div>
          <form className="compact-form" onSubmit={createReminder}>
            <label>
              Type
              <select value={reminder.type} onChange={(event) => updateReminder('type', event.target.value)}>
                <option value="water">Water</option>
                <option value="exercise">Exercise</option>
                <option value="medicine">Medicine</option>
              </select>
            </label>
            <label>
              Repeat
              <select value={reminder.repeat} onChange={(event) => updateReminder('repeat', event.target.value)}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="full-span">
              Title
              <input required value={reminder.title} onChange={(event) => updateReminder('title', event.target.value)} />
            </label>
            <label className="full-span">
              Message
              <textarea required value={reminder.message} onChange={(event) => updateReminder('message', event.target.value)} />
            </label>
            <label className="full-span">
              Reminder time
              <input type="datetime-local" required value={reminder.reminderAt} onChange={(event) => updateReminder('reminderAt', event.target.value)} />
            </label>
            <button className="primary-button full-span" type="submit">
              <Plus size={16} />
              Save reminder
            </button>
          </form>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Schedule</p>
              <h2>Appointment</h2>
            </div>
            <CalendarPlus size={20} />
          </div>
          <form className="compact-form" onSubmit={createAppointment}>
            <label>
              Doctor
              <input required value={appointment.doctorName} onChange={(event) => updateAppointment('doctorName', event.target.value)} />
            </label>
            <label>
              Specialty
              <input value={appointment.specialty} onChange={(event) => updateAppointment('specialty', event.target.value)} />
            </label>
            <label className="full-span">
              Date and time
              <input type="datetime-local" required value={appointment.dateTime} onChange={(event) => updateAppointment('dateTime', event.target.value)} />
            </label>
            <label>
              Location
              <input value={appointment.location} onChange={(event) => updateAppointment('location', event.target.value)} />
            </label>
            <label>
              Reason
              <input value={appointment.reason} onChange={(event) => updateAppointment('reason', event.target.value)} />
            </label>
            <button className="primary-button full-span" type="submit">
              <CalendarPlus size={16} />
              Save appointment
            </button>
          </form>
        </section>
      </div>

      <div className="two-column lower-grid">
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inbox</p>
              <h2>Notifications</h2>
            </div>
          </div>
          <div className="report-list">
            {notifications.length ? (
              notifications.map((notification) => (
                <article className={`report-row ${notification.read ? 'read' : ''}`} key={notification._id}>
                  <div>
                    <strong>{notification.title}</strong>
                    <span>{notification.type} - {localDateTime(notification.reminderAt)} - {notification.repeat}</span>
                    <p>{notification.message}</p>
                  </div>
                  <div className="row-actions">
                    {!notification.read ? (
                      <button className="icon-button" type="button" onClick={() => markRead(notification)} title="Mark read">
                        <Check size={17} />
                      </button>
                    ) : null}
                    <button className="icon-button danger" type="button" onClick={() => removeNotification(notification)} title="Delete">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="muted-card">No notifications yet.</div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Upcoming</p>
              <h2>Appointments</h2>
            </div>
          </div>
          <div className="report-list">
            {appointments.length ? (
              appointments.map((item) => (
                <article className="report-row" key={item._id}>
                  <div>
                    <strong>{item.doctorName}</strong>
                    <span>{item.specialty} - {localDateTime(item.dateTime)}</span>
                    {item.reason ? <p>{item.reason}</p> : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="muted-card">No appointments scheduled.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
