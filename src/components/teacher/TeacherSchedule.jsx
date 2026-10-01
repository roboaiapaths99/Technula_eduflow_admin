import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Clock, Calendar, BookOpen, User, Sparkles, CheckCircle, ArrowRight, Layers } from 'lucide-react';

export default function TeacherSchedule({ schoolId, grade = '10', section = 'A', user, onSelectLecture }) {
  const [viewMode, setViewMode] = useState('my_lectures'); // 'my_lectures' | 'class_schedule'
  const [myLecturesData, setMyLecturesData] = useState(null);
  const [classScheduleData, setClassScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load teacher's personal lectures & assigned classes
  useEffect(() => {
    setLoading(true);
    api.getMyTeacherLectures()
      .then(setMyLecturesData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load selected class timetable
  useEffect(() => {
    if (schoolId && grade && section) {
      api.getTodaySchedule(schoolId, grade, section)
        .then(setClassScheduleData)
        .catch(console.error);
    }
  }, [schoolId, grade, section]);

  const isSunday = myLecturesData?.is_sunday || classScheduleData?.is_sunday;

  if (isSunday) {
    return (
      <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Sunday — School Closed</h3>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>Enjoy your weekend! Teaching schedule resumes on Monday.</p>
      </div>
    );
  }

  const assignedClasses = myLecturesData?.assigned_classes || user?.assignments || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner & Mode Toggle */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {viewMode === 'my_lectures' ? "My Teaching Lectures" : `Class ${grade}-${section} Schedule`}
            </h3>
            <span className="pill pill-primary" style={{ fontSize: '11px' }}>
              {myLecturesData?.day_name || classScheduleData?.day || 'Today'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {viewMode === 'my_lectures'
              ? `Personal daily timetable for ${user?.full_name || 'Faculty Member'}`
              : `Period allocations and room assignments for Class ${grade}-${section}`}
          </p>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('my_lectures')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: viewMode === 'my_lectures' ? '#fff' : 'transparent',
              color: viewMode === 'my_lectures' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: viewMode === 'my_lectures' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            My Lectures ({myLecturesData?.today_lectures?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('class_schedule')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: viewMode === 'class_schedule' ? '#fff' : 'transparent',
              color: viewMode === 'class_schedule' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: viewMode === 'class_schedule' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Class {grade}-{section} Timetable
          </button>
        </div>
      </div>

      {/* Official Assigned Classes Badges */}
      {assignedClasses.length > 0 && (
        <div style={{
          background: 'rgba(99, 91, 255, 0.04)',
          border: '1px solid rgba(99, 91, 255, 0.15)',
          borderRadius: '10px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          fontSize: '12px',
        }}>
          <span style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={14} /> My Assigned Portfolios:
          </span>
          {assignedClasses.map((ac, idx) => (
            <button
              key={ac.id || idx}
              type="button"
              onClick={() => onSelectLecture && onSelectLecture(ac.grade, ac.section)}
              style={{
                background: (ac.grade === grade && ac.section === section) ? 'var(--primary)' : '#fff',
                color: (ac.grade === grade && ac.section === section) ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Class {ac.grade}-{ac.section}</span>
              <span style={{
                opacity: 0.85,
                fontSize: '10px',
                background: (ac.grade === grade && ac.section === section) ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                padding: '1px 5px',
                borderRadius: '4px',
              }}>
                {ac.role_type === 'ClassTeacher' ? 'Class Teacher' : (ac.subject_name || 'Subject')}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* VIEW 1: MY LECTURES TODAY */}
      {viewMode === 'my_lectures' && (
        <>
          {myLecturesData?.today_lectures && myLecturesData.today_lectures.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {myLecturesData.today_lectures.map((lec) => (
                <div
                  key={lec.id || lec.period}
                  className="tech-card"
                  style={{
                    padding: '18px',
                    borderLeft: '4px solid var(--primary)',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '12px',
                        background: 'rgba(99, 91, 255, 0.1)',
                        color: 'var(--primary)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}>
                        Period {lec.period}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {lec.time}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {lec.subject}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 700 }}>Class {lec.grade}-{lec.section}</span>
                      <span>•</span>
                      <span>{lec.room ? `Room ${lec.room}` : 'Classroom'}</span>
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => onSelectLecture && onSelectLecture(lec.grade, lec.section, 'attendance')}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '5px 8px', fontSize: '11px', justifyContent: 'center' }}
                    >
                      Attendance
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectLecture && onSelectLecture(lec.grade, lec.section, 'homework')}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '5px 8px', fontSize: '11px', justifyContent: 'center' }}
                    >
                      Homework
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectLecture && onSelectLecture(lec.grade, lec.section, 'marks')}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '5px 8px', fontSize: '11px', justifyContent: 'center' }}
                    >
                      Marks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <h4 style={{ fontWeight: 700, fontSize: '15px' }}>No Lectures Scheduled For Today</h4>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>You have no periods assigned for this day, or master timetable periods have not yet been published.</p>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: FULL CLASS SCHEDULE */}
      {viewMode === 'class_schedule' && (
        <>
          {classScheduleData?.periods && classScheduleData.periods.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {classScheduleData.periods.map((p) => {
                const isBreak = p.type !== 'CLASS';
                return (
                  <div
                    key={p.period}
                    className="tech-card"
                    style={{
                      padding: '16px',
                      borderLeft: `4px solid ${isBreak ? '#94a3b8' : 'var(--primary)'}`,
                      background: isBreak ? '#f8fafc' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Period {p.period}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {p.time}
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '15px', color: isBreak ? '#64748b' : 'var(--text-primary)' }}>
                      {p.subject}
                    </div>

                    {!isBreak && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>{p.teacher || 'Assigned Instructor'}</span>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          {p.room || 'Room'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No periods scheduled for Class {grade}-{section} today. Check master timetable in Admin Command Center.
            </div>
          )}
        </>
      )}
    </div>
  );
}

