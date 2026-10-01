import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle, Clock, BookOpen, AlertCircle,
  FileText, Award, Bell, ChevronRight, User, Sparkles
} from 'lucide-react';
import { api } from '../../api';

export default function StudentPortal({ user, onOpenReportCard }) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [homeworkList, setHomeworkList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [error, setError] = useState(null);

  const studentId = user?.student_id;
  const grade = user?.grade || '10';
  const section = user?.section || 'A';

  useEffect(() => {
    loadData();
  }, [studentId, grade, section]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [
        api.listAnnouncements ? api.listAnnouncements() : Promise.resolve([]),
      ];

      if (studentId) {
        promises.push(
          api.getParentStudentOverview(studentId).catch(() => null),
          api.getTimetableToday ? api.getTimetableToday(grade, section).catch(() => []) : Promise.resolve([]),
          api.listStudentHomework ? api.listStudentHomework(studentId).catch(() => []) : Promise.resolve([])
        );
      }

      const results = await Promise.all(promises);
      setAnnouncements(Array.isArray(results[0]) ? results[0] : (results[0]?.items || []));

      if (results[1]) {
        setOverview(results[1]);
      }
      if (results[2]) {
        setTimetable(Array.isArray(results[2]) ? results[2] : (results[2]?.slots || []));
      }
      if (results[3]) {
        setHomeworkList(Array.isArray(results[3]) ? results[3] : []);
      }
    } catch (err) {
      console.error('Failed to load student portal data:', err);
      setError('Could not load some student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const attRate = overview?.attendance_rate ?? 95.0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Student Welcome Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 800,
            border: '2px solid rgba(255, 255, 255, 0.4)'
          }}>
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Student" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              (user?.student_name || user?.full_name || 'S')[0].toUpperCase()
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Welcome back, {user?.student_name || user?.full_name || 'Student'}!
              </h1>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                Class {grade}-{section}
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              {user?.school_name || 'Academic Insights School'} • Admission No: <strong>{user?.admission_no || 'N/A'}</strong> • Roll No: <strong>{user?.roll_no || '-'}</strong>
            </p>
          </div>
        </div>

        {/* Quick KPI badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '12px 18px',
            textAlign: 'center',
            minWidth: '100px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{attRate}%</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>Attendance</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '12px 18px',
            textAlign: 'center',
            minWidth: '100px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{homeworkList.length}</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>Homework</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px'
      }}>
        {[
          { id: 'dashboard', label: 'Overview & Attendance', icon: BookOpen },
          { id: 'timetable', label: 'Class Schedule', icon: Calendar },
          { id: 'homework', label: 'Homework & Tasks', icon: CheckCircle },
          { id: 'announcements', label: 'School Notices', icon: Bell },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? '#4f46e5' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB CONTENT */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading your student profile and academic metrics...
        </div>
      ) : (
        <>
          {/* TAB 1: DASHBOARD & ATTENDANCE */}
          {activeSubTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Attendance Card */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Attendance Health
                  </h3>
                  <span className={`pill ${attRate >= 75 ? 'pill-success' : 'pill-danger'}`}>
                    {attRate >= 75 ? 'CBSE Compliant' : 'Low Attendance Alert'}
                  </span>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: attRate >= 75 ? '#10b981' : '#ef4444' }}>
                  {attRate}%
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                  Minimum 75% attendance is required for CBSE term exams. Keep up regular campus attendance!
                </p>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '12px' }}>
                  <div style={{ height: '100%', width: `${Math.min(attRate, 100)}%`, background: attRate >= 75 ? '#10b981' : '#ef4444', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Assessment Performance Card */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Assessment Gradebook
                  </h3>
                  <Award size={18} color="#6366f1" />
                </div>
                {overview?.subjects && overview.subjects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {overview.subjects.slice(0, 4).map((sub, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600 }}>{sub.name}</span>
                        <span className="pill pill-primary" style={{ fontSize: '12px' }}>{sub.percentage}% ({sub.grade || 'A'})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748b' }}>No exam marks published yet for this term.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TIMETABLE */}
          {activeSubTab === 'timetable' && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>
                Today's Lecture Schedule (Class {grade}-{section})
              </h3>
              {timetable.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No scheduled lectures registered for today.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {timetable.map((slot, i) => (
                    <div key={i} style={{
                      padding: '14px 16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                        <span>Period {slot.period_number}</span>
                        <span>{slot.start_time} - {slot.end_time}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                        {slot.subject_name || slot.slot_type || 'Lecture'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {slot.teacher_name ? `Teacher: ${slot.teacher_name}` : ''} {slot.room_number ? `• ${slot.room_number}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOMEWORK */}
          {activeSubTab === 'homework' && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>
                Active Assignments & Homework
              </h3>
              {homeworkList.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No pending assignments! You're completely caught up.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {homeworkList.map((hw, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{hw.title}</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{hw.description}</div>
                        <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '6px', fontWeight: 600 }}>
                          Due Date: {hw.due_date} • Priority: {hw.priority}
                        </div>
                      </div>
                      <span className="pill pill-warning" style={{ fontSize: '11px' }}>Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeSubTab === 'announcements' && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>
                School Notices & Circulars
              </h3>
              {announcements.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No active circulars posted at this time.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {announcements.map((a, i) => (
                    <div key={i} style={{
                      padding: '16px',
                      background: a.is_pinned ? '#f5f3ff' : '#f8fafc',
                      borderRadius: '12px',
                      border: a.is_pinned ? '1px solid #ddd6fe' : '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                          {a.is_pinned ? '📌 ' : ''}{a.title}
                        </h4>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                        {a.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
