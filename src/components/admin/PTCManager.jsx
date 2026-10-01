import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Calendar, Clock, User, CheckCircle2, Plus, Users,
  MapPin, MessageSquare, RefreshCw
} from 'lucide-react';

export default function PTCManager({ user }) {
  const schoolId = user?.school_id;
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // New Event Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Term 2 Board Readiness Parent-Teacher Conference',
    description: '1-on-1 Academic Consultation & Board Preparation Discussion',
    event_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '12:00',
    slot_duration_mins: 15,
    room_or_link: 'Academic Block - Room 102',
    grade: '10'
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.listPTCEvents(schoolId);
      setEvents(res || []);
      if (res && res.length > 0) {
        setSelectedEventId(res[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadEvents();
  }, [schoolId]);

  const loadSlots = async (evId) => {
    if (!evId) return;
    setLoadingSlots(true);
    try {
      const res = await api.getPTCSlots(evId);
      setSlots(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadSlots(selectedEventId);
    }
  }, [selectedEventId]);

  const handleCreateEvent = async () => {
    setCreating(true);
    try {
      await api.createPTCEvent({
        school_id: schoolId,
        ...formData,
      });
      alert('✓ Parent-Teacher Conference Event created with 15-minute slots generated!');
      setShowCreateModal(false);
      loadEvents();
    } catch (e) {
      alert(e.message || 'Failed to create conference');
    } finally {
      setCreating(false);
    }
  };

  const bookedSlots = slots.filter((s) => s.is_booked);
  const availableSlots = slots.filter((s) => !s.is_booked);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill pill-indigo">Educator & Parent Collaboration</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>15-Min Slot Self-Booking</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, marginTop: '6px', color: 'var(--text-primary)' }}>
            Parent-Teacher Conference (PTC) Manager
          </h2>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Announce Conference
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="tech-card">
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL SESSIONS GENERATED</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px', color: 'var(--primary)' }}>
            {slots.length} Slots
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>15-minute consultations</div>
        </div>

        <div className="tech-card">
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-emerald)' }}>BOOKED BY PARENTS</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px', color: 'var(--accent-emerald)' }}>
            {bookedSlots.length} Booked
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {slots.length > 0 ? `${((bookedSlots.length / slots.length) * 100).toFixed(0)}% utilization` : '0%'}
          </div>
        </div>

        <div className="tech-card">
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>AVAILABLE OPEN SLOTS</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px', color: '#64748B' }}>
            {availableSlots.length} Open
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ready for parent selection</div>
        </div>
      </div>

      {/* Conference Selector */}
      <div className="tech-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Select Active Conference Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="tech-input"
              style={{ minWidth: '320px', fontWeight: 700 }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.event_date}) — Class {ev.grade}
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => loadSlots(selectedEventId)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh Schedule
          </button>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="tech-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Appointment Slot Matrix & Live Status
        </h3>

        {loadingSlots ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading slots...</div>
        ) : slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No slots found for this conference.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {slots.map((slot) => {
              const isBooked = slot.is_booked;
              return (
                <div
                  key={slot.slot_id}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: isBooked ? '1px solid #A7F3D0' : '1px solid var(--border-color)',
                    background: isBooked ? '#ECFDF5' : '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {slot.start_time} - {slot.end_time}
                    </span>
                    <span className={`pill ${isBooked ? 'pill-emerald' : 'pill-indigo'}`} style={{ fontSize: '10px' }}>
                      {isBooked ? '✓ Booked' : 'Open'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Educator: <strong>{slot.teacher_name}</strong>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    📍 {slot.room_or_link}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '26px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>
              Announce Parent-Teacher Conference
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              System will automatically partition the conference hours into 15-minute booking slots.
            </p>

            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Conference Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="tech-input"
              style={{ width: '100%', marginBottom: '12px' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="tech-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Target Grade
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="tech-input"
                  placeholder="e.g. 10"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="tech-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="tech-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Venue / Consultation Room
            </label>
            <input
              type="text"
              value={formData.room_or_link}
              onChange={(e) => setFormData({ ...formData, room_or_link: e.target.value })}
              className="tech-input"
              style={{ width: '100%', marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleCreateEvent} disabled={creating} className="btn-primary" style={{ flex: 2 }}>
                {creating ? 'Creating Slots...' : 'Publish & Generate Slots →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
