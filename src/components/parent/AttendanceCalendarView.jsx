import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import TrendLine from '../analytics/TrendLine';
import CircularAttendanceGauge from '../analytics/CircularAttendanceGauge';
import {
  Calendar as CalendarIcon, TrendingUp, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';

export default function AttendanceCalendarView({ user, studentId, studentInfo }) {
  const [mode, setMode] = useState('calendar'); // 'calendar' | 'trend'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const [selectedDay, setSelectedDay] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (studentId) loadSummary();
  }, [studentId, selectedYear, selectedMonth]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getMonthlyAttendanceSummary(studentId, selectedYear, selectedMonth);
      setData(res);
      setSelectedDay(null);
    } catch (err) {
      console.error('Failed to load attendance summary', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setSelectedDay(null);
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Attendance Record & Term Analytics</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Daily attendance status, leave records, and term-wide percentage progression.
          </p>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => setMode('calendar')}
            style={{
              background: mode === 'calendar' ? '#fff' : 'transparent',
              color: mode === 'calendar' ? 'var(--primary, #635bff)' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CalendarIcon size={14} /> Monthly Calendar
          </button>
          <button
            onClick={() => setMode('trend')}
            style={{
              background: mode === 'trend' ? '#fff' : 'transparent',
              color: mode === 'trend' ? 'var(--primary, #635bff)' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrendingUp size={14} /> Term Trend Chart
          </button>
        </div>
      </div>

      {/* 📊 Circular Attendance Gauge & Metrics */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <CircularAttendanceGauge
            percentage={data.attendance_percentage}
            presentDays={data.present_days}
            absentDays={data.absent_days}
            totalDays={data.total_working_days}
            studentName={studentInfo?.name || 'Student'}
            size={140}
            strokeWidth={12}
            showBreakdown={true}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="tech-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Current Regularity</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: data.attendance_percentage >= 85 ? '#10b981' : data.attendance_percentage >= 75 ? '#f59e0b' : '#ef4444', marginTop: '4px' }}>
                {data.attendance_percentage >= 85 ? 'Excellent' : data.attendance_percentage >= 75 ? 'Satisfactory' : 'Needs Action'}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {data.attendance_percentage >= 75 ? 'Above CBSE 75% rule' : 'Deficit below 75% rule'}
              </span>
            </div>

            <div className="tech-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Working Sessions</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', marginTop: '4px' }}>
                {data.total_working_days} Days
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {data.present_days} attended / {data.absent_days} absent
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 1: CALENDAR VIEW ── */}
      {mode === 'calendar' && (
        <div className="tech-card" style={{ padding: '24px' }}>
          {/* Month Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={handlePrevMonth} className="btn-secondary" style={{ padding: '6px 12px' }}>
              <ChevronLeft size={16} /> Prev
            </button>

            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>

            <button onClick={handleNextMonth} className="btn-secondary" style={{ padding: '6px 12px' }}>
              Next <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
            {weekdays.map((w) => (
              <div key={w} style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading calendar...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {/* Offset for first day */}
              {data && Array.from({ length: (data.days[0]?.weekday ?? 0) }).map((_, idx) => (
                <div key={`offset-${idx}`} style={{ minHeight: '60px', background: '#fafafa', borderRadius: '8px', opacity: 0.3 }} />
              ))}

              {data?.days.map((d) => {
                const isPres = d.status === 'Present';
                const isAbs = d.status === 'Absent';
                const isLate = d.status === 'Late';
                const isHol = d.status === 'Holiday';
                const isWknd = d.status === 'Weekend';
                const isUp = d.status === 'Upcoming';

                return (
                  <div
                    key={d.day}
                    onClick={() => setSelectedDay(d)}
                    style={{
                      minHeight: '65px',
                      borderRadius: '10px',
                      padding: '8px',
                      cursor: 'pointer',
                      outline: selectedDay?.date === d.date ? '2px solid var(--primary, #635bff)' : 'none',
                      outlineOffset: '1px',
                      background:
                        isPres ? '#f0fdf4' :
                        isAbs ? '#fef2f2' :
                        isLate ? '#fffbeb' :
                        isHol ? '#eff6ff' :
                        isWknd ? '#f8fafc' : '#ffffff',
                      border: `1px solid ${
                        isPres ? '#bbf7d0' :
                        isAbs ? '#fecaca' :
                        isLate ? '#fde68a' :
                        isHol ? '#bfdbfe' : '#e2e8f0'
                      }`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: isAbs ? '#b91c1c' : '#1e293b' }}>
                        {d.day}
                      </span>
                      {isPres && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />}
                      {isAbs && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />}
                      {isLate && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />}
                    </div>

                    <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', color:
                      isPres ? '#15803d' :
                      isAbs ? '#b91c1c' :
                      isLate ? '#b45309' :
                      isHol ? '#2563eb' : '#94a3b8'
                    }}>
                      {d.remark || d.status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap', fontSize: '12px', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> Present
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} /> Absent
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} /> Late Arrival
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} /> School Holiday
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#cbd5e1' }} /> Weekend
            </div>
          </div>

          {/* Selected Day Inspector Panel */}
          {selectedDay ? (
            <div
              style={{
                marginTop: '16px',
                padding: '14px 18px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                  📅 Session Record: {selectedDay.date}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {selectedDay.remark ? `Official Note: "${selectedDay.remark}"` : 'Regular curriculum session marked'}
                </div>
              </div>

              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontWeight: 800,
                  fontSize: '12px',
                  background:
                    selectedDay.status === 'Present' ? '#ecfdf5' :
                    selectedDay.status === 'Absent' ? '#fef2f2' :
                    selectedDay.status === 'Late' ? '#fffbeb' : '#f1f5f9',
                  color:
                    selectedDay.status === 'Present' ? '#047857' :
                    selectedDay.status === 'Absent' ? '#b91c1c' :
                    selectedDay.status === 'Late' ? '#b45309' : '#475569'
                }}
              >
                ● {selectedDay.status}
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: '14px',
                padding: '10px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1'
              }}
            >
              💡 Click any calendar day above to inspect daily session logs and official teacher remarks.
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: TERM TREND GRAPH ── */}
      {mode === 'trend' && (
        <div className="tech-card" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800 }}>
            Academic Session Attendance Percentage Trajectory
          </h4>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
            Monthly consistency progression tracked across the academic year.
          </p>

          {data?.term_trend ? (
            <TrendLine
              data={data.term_trend.map(t => ({ label: t.month, score: t.percentage }))}
              height={260}
              color="var(--primary, #635bff)"
            />
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No trend data recorded.</div>
          )}
        </div>
      )}
    </div>
  );
}
