import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Calendar, Clock, AlertCircle, CheckCircle2, Sparkles, Bookmark
} from 'lucide-react';

export default function HolidayCalendarView({ user }) {
  const [holidays, setHolidays] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);

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
      console.error('Failed to load holiday calendar', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading holiday schedule...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Upcoming Holiday Countdown Card */}
      {upcoming?.has_upcoming && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: '#fff',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.2)'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#93c5fd' }}>
              Next Scheduled School Holiday
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '6px 0 2px 0' }}>
              {upcoming.name}
            </h2>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {new Date(upcoming.start_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              {upcoming.start_date !== upcoming.end_date && (
                <span> to {new Date(upcoming.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              )}
            </div>
            {upcoming.description && (
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '6px' }}>
                {upcoming.description}
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.18)',
            padding: '16px 24px',
            borderRadius: '14px',
            textAlign: 'center',
            minWidth: '100px'
          }}>
            <div style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1 }}>{upcoming.days_left}</div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>
              Days Remaining
            </div>
          </div>
        </div>
      )}

      {/* Holidays List */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Academic Session Holiday Calendar
        </h4>

        <div className="tech-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '14px 18px' }}>Holiday</th>
                <th style={{ padding: '14px 18px' }}>Category</th>
                <th style={{ padding: '14px 18px' }}>Date</th>
                <th style={{ padding: '14px 18px' }}>Duration</th>
                <th style={{ padding: '14px 18px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No holidays listed.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9', background: h.is_today ? '#eff6ff' : 'transparent' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {h.name}
                      {h.is_today && (
                        <span style={{ marginLeft: '8px', fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                          TODAY
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        background: h.holiday_type === 'national' ? '#fee2e2' : h.holiday_type === 'festival' ? '#fef3c7' : '#e0e7ff',
                        color: h.holiday_type === 'national' ? '#b91c1c' : h.holiday_type === 'festival' ? '#b45309' : '#4338ca',
                      }}>
                        {h.holiday_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#334155', fontWeight: 600 }}>
                      {h.start_date} {h.start_date !== h.end_date ? `— ${h.end_date}` : ''}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b' }}>
                      {h.duration_days} day{h.duration_days > 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b' }}>
                      {h.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
