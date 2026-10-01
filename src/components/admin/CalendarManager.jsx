import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Calendar, CalendarDays, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Sparkles, Sun } from 'lucide-react';

export default function CalendarManager({ schoolId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    event_type: 'HOLIDAY',
    is_holiday: true,
    affects_attendance: true,
    target_grades: 'ALL',
    description: '',
  });

  const [workingDaysData, setWorkingDaysData] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const curYear = new Date().getFullYear();
      const [evList, wd] = await Promise.all([
        api.getCalendarEvents(schoolId, curYear),
        api.getWorkingDays(schoolId, `${curYear}-04-01`, `${curYear + 1}-03-31`).catch(() => null),
      ]);
      setEvents(evList || []);
      setWorkingDaysData(wd);
    } catch (e) {
      console.error(e);
      setError('Failed to load school calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadCalendar();
  }, [schoolId]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      event_type: 'HOLIDAY',
      is_holiday: true,
      affects_attendance: true,
      target_grades: 'ALL',
      description: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title || '',
      start_date: ev.start_date || '',
      end_date: ev.end_date || '',
      event_type: ev.event_type || 'HOLIDAY',
      is_holiday: ev.is_holiday !== false,
      affects_attendance: ev.affects_attendance !== false,
      target_grades: ev.target_grades || 'ALL',
      description: ev.description || '',
    });
    setShowAddModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await api.updateCalendarEvent(editingEvent.id, eventForm);
        setMessage(`Calendar event '${eventForm.title}' updated successfully.`);
      } else {
        await api.createCalendarEvent({
          school_id: schoolId,
          ...eventForm,
        });
        setMessage(`Calendar event '${eventForm.title}' created successfully.`);
      }
      setShowAddModal(false);
      setEditingEvent(null);
      loadCalendar();
    } catch (err) {
      setError(err.message || 'Failed to save calendar event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this calendar event?')) return;
    try {
      await api.deleteCalendarEvent(id);
      loadCalendar();
    } catch (err) {
      setError('Failed to delete event');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Working Days Engine Box */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        <div className="tech-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '13px', fontWeight: 700 }}>
            <Sun size={18} /> Official School Holidays
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {events.filter((e) => e.is_holiday).length} Days
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Excluded from working days denominator</span>
        </div>

        <div className="tech-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontSize: '13px', fontWeight: 700 }}>
            <Calendar size={18} /> Academic Working Days
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {workingDaysData?.effective_working_days || 218} Days
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Effective working teaching schedule</span>
        </div>

        <div className="tech-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '13px', fontWeight: 700 }}>
            <CalendarDays size={18} /> Events & Examinations
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {events.filter((e) => !e.is_holiday).length} Events
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>PTMs, Exams, and Sports days</span>
        </div>
      </div>

      {message && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Events Directory */}
      <div className="tech-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Institutional Calendar & Attendance Rules
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Holidays declared here prevent false attendance penalties and automatically update risk thresholds.
            </p>
          </div>

          <button onClick={handleOpenAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Declare Holiday / Event
          </button>
        </div>

        {events.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Title</th>
                  <th style={{ padding: '10px' }}>Type</th>
                  <th style={{ padding: '10px' }}>Date Range</th>
                  <th style={{ padding: '10px' }}>Attendance Impact</th>
                  <th style={{ padding: '10px' }}>Target</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ev.title}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span className={ev.is_holiday ? 'pill pill-warning' : 'pill pill-primary'} style={{ fontSize: '11px' }}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                      {ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} to ${ev.end_date}`}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {ev.affects_attendance ? (
                        <span style={{ color: '#d97706', fontWeight: 600, fontSize: '12px' }}>
                          ✓ School Closed (No Attendance)
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: '12px' }}>
                          Working School Day
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      {ev.target_grades === 'ALL' ? 'All Classes' : `Grades ${ev.target_grades}`}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button onClick={() => handleOpenEdit(ev)} className="btn-secondary" style={{ padding: '4px 8px', color: 'var(--primary)' }} title="Edit Event">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDeleteEvent(ev.id)} className="btn-secondary" style={{ padding: '4px 8px', color: '#ef4444' }} title="Delete Event">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No calendar events or holidays declared yet. Click 'Declare Holiday / Event' to add one.
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>
              {editingEvent ? 'Edit School Holiday or Event' : 'Declare School Holiday or Event'}
            </h4>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Event / Holiday Title</label>
                <input
                  type="text"
                  placeholder="e.g. Gandhi Jayanti / Mid-Term Exams"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Start Date</label>
                  <input
                    type="date"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value, end_date: eventForm.end_date < e.target.value ? e.target.value : eventForm.end_date })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>End Date</label>
                  <input
                    type="date"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Event Type</label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => {
                      const isHol = e.target.value === 'HOLIDAY' || e.target.value === 'VACATION';
                      setEventForm({ ...eventForm, event_type: e.target.value, is_holiday: isHol, affects_attendance: isHol });
                    }}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="HOLIDAY">Gazetted Holiday</option>
                    <option value="VACATION">Vacation / Term Break</option>
                    <option value="EXAM">Examination Term</option>
                    <option value="PTM">Parent-Teacher Meeting</option>
                    <option value="SPORTS">Sports Day / Annual Day</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Target Classes</label>
                  <input
                    type="text"
                    placeholder="ALL or e.g. 10,11"
                    value={eventForm.target_grades}
                    onChange={(e) => setEventForm({ ...eventForm, target_grades: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                <input
                  type="checkbox"
                  id="affectsAttendance"
                  checked={eventForm.affects_attendance}
                  onChange={(e) => setEventForm({ ...eventForm, affects_attendance: e.target.checked })}
                />
                <label htmlFor="affectsAttendance" style={{ fontSize: '12px', cursor: 'pointer' }}>
                  <strong>School Closed</strong> (Exclude from student attendance denominator)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                  {editingEvent ? 'Update Event' : 'Save Event'}
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); setEditingEvent(null); }} className="btn-secondary" style={{ padding: '10px 16px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
