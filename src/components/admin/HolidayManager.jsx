import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Calendar, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles,
  Clock, Check, X, Bookmark, Edit3
} from 'lucide-react';

export default function HolidayManager({ user }) {
  const [holidays, setHolidays] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    holiday_type: 'festival',
    description: '',
  });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const [list, up] = await Promise.all([
        api.getHolidays(),
        api.getUpcomingHoliday().catch(() => null),
      ]);
      setHolidays(list || []);
      setUpcoming(up);
    } catch (err) {
      setError(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingHolidayId(null);
    setForm({ name: '', start_date: '', end_date: '', holiday_type: 'festival', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (h) => {
    setEditingHolidayId(h.id);
    setForm({
      name: h.name,
      start_date: h.start_date,
      end_date: h.end_date || '',
      holiday_type: h.holiday_type || 'festival',
      description: h.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingHolidayId) {
        await api.updateHoliday(editingHolidayId, form);
        setMessage(`Holiday "${form.name}" updated successfully.`);
      } else {
        await api.createHoliday(form);
        setMessage(`Holiday "${form.name}" added to school calendar.`);
      }
      setShowModal(false);
      setForm({ name: '', start_date: '', end_date: '', holiday_type: 'festival', description: '' });
      setEditingHolidayId(null);
      loadHolidays();
    } catch (err) {
      setError(err.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete holiday "${name}"?`)) return;
    try {
      await api.deleteHoliday(id);
      setMessage('Holiday deleted.');
      loadHolidays();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const loadPresets = async () => {
    const curYear = new Date().getFullYear();
    const sampleHolidays = [
      { name: 'Independence Day', start_date: `${curYear}-08-15`, end_date: `${curYear}-08-15`, holiday_type: 'national', description: 'National flag hoisting and patriotic assemblies.' },
      { name: 'Gandhi Jayanti', start_date: `${curYear}-10-02`, end_date: `${curYear}-10-02`, holiday_type: 'national', description: 'Mahatma Gandhi Birthday observance.' },
      { name: 'Diwali & Festival Break', start_date: `${curYear}-11-08`, end_date: `${curYear}-11-12`, holiday_type: 'festival', description: 'Deepavali festival holidays for staff and students.' },
      { name: 'Christmas & Winter Break', start_date: `${curYear}-12-24`, end_date: `${curYear + 1}-01-02`, holiday_type: 'school_break', description: 'Annual winter recess.' },
    ];
    for (const h of sampleHolidays) {
      await api.createHoliday(h).catch(() => {});
    }
    setMessage('Standard academic presets loaded.');
    loadHolidays();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Institutional Holiday Calendar</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Configure gazetted, festival, and vacation holidays displayed to guardians.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {holidays.length === 0 && (
            <button onClick={loadPresets} className="btn-secondary" style={{ fontSize: '13px' }}>
              <Bookmark size={14} /> Load Presets
            </button>
          )}
          <button onClick={handleOpenAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Holiday
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Upcoming Highlight Card */}
      {upcoming?.has_upcoming && (
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: '14px',
          padding: '20px 24px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.85, fontWeight: 700 }}>
              Next Upcoming Holiday
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 2px 0' }}>
              {upcoming.name}
            </h3>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              {upcoming.start_date} {upcoming.start_date !== upcoming.end_date ? `to ${upcoming.end_date}` : ''}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '12px 20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>{upcoming.days_left}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Days Away</div>
          </div>
        </div>
      )}

      {/* Holiday Table */}
      <div className="tech-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '14px 18px' }}>Holiday Name</th>
              <th style={{ padding: '14px 18px' }}>Type</th>
              <th style={{ padding: '14px 18px' }}>Date Range</th>
              <th style={{ padding: '14px 18px' }}>Duration</th>
              <th style={{ padding: '14px 18px' }}>Description</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {holidays.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  No holidays entered yet.
                </td>
              </tr>
            ) : (
              holidays.map((h) => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {h.name}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: h.holiday_type === 'national' ? '#fee2e2' : h.holiday_type === 'festival' ? '#fef3c7' : '#e0e7ff',
                      color: h.holiday_type === 'national' ? '#b91c1c' : h.holiday_type === 'festival' ? '#b45309' : '#4338ca',
                      textTransform: 'capitalize'
                    }}>
                      {h.holiday_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#475569' }}>
                    {h.start_date} {h.start_date !== h.end_date ? `— ${h.end_date}` : ''}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b' }}>
                    {h.duration_days} day{h.duration_days > 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b' }}>
                    {h.description || '-'}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenEdit(h)}
                        title="Edit Holiday"
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(h.id, h.name)}
                        title="Delete Holiday"
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD/EDIT HOLIDAY MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '460px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                {editingHolidayId ? 'Edit School Holiday' : 'Add School Holiday'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali / Deepavali"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Holiday Type</label>
                <select
                  value={form.holiday_type}
                  onChange={(e) => setForm({ ...form, holiday_type: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                >
                  <option value="festival">Festival Holiday</option>
                  <option value="national">National Holiday</option>
                  <option value="school_break">Vacation / Term Break</option>
                  <option value="restricted">Restricted / Optional</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Description / Remarks</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Adding...' : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
