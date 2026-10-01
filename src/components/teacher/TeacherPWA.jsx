import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import TeacherSchedule from './TeacherSchedule';
import TeacherHomework from './TeacherHomework';
import TeacherDatesheet from './TeacherDatesheet';
import TeacherActivities from './TeacherActivities';
import TeacherGallery from './TeacherGallery';
import TeacherGatePass from './TeacherGatePass';
import LeaveManager from '../admin/LeaveManager';
import ChatDrawer from '../communication/ChatDrawer';
import {
  Calendar, Check, X, Clock, Save, Sparkles, UserCheck,
  FileText, ArrowRight, Award, MessageSquare, AlertCircle,
  CheckCircle2, BookOpen, RefreshCw, BarChart3, Edit3,
  CalendarDays, FileCheck, Camera, ShieldAlert
} from 'lucide-react';

export default function TeacherPWA({ user, onOpenReportCard, initialSubTab = 'attendance' }) {
  const schoolId = user?.school_id;
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'attendance' | 'schedule' | 'homework' | 'leaves' | 'marks' | 'feedback' | 'messages'
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Exams list for marks & feedback
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');

  // Attendance state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const assignedClasses = user?.assignments || [];
  const [grade, setGrade] = useState(() => user?.primary_class?.grade || user?.assignments?.[0]?.grade || '');
  const [section, setSection] = useState(() => user?.primary_class?.section || user?.assignments?.[0]?.section || '');

  const [roster, setRoster] = useState([]);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [savingAtt, setSavingAtt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [quickFlipMode, setQuickFlipMode] = useState(false);
  const [templateMsg, setTemplateMsg] = useState(null);

  // Class Diary state (Feature 7)
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loadingDiary, setLoadingDiary] = useState(false);
  const [selectedDiaryStudentId, setSelectedDiaryStudentId] = useState('');
  const [diaryCategory, setDiaryCategory] = useState('APPRECIATION');
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryRemark, setDiaryRemark] = useState('');
  const [diaryActionRequired, setDiaryActionRequired] = useState(false);
  const [savingDiary, setSavingDiary] = useState(false);
  const [diarySuccess, setDiarySuccess] = useState(null);

  // Class Insights state (Feature 8)
  const [insightsData, setInsightsData] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Marks Matrix state
  const [matrixData, setMatrixData] = useState({ subjects: [], roster: [] });
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksSuccess, setMarksSuccess] = useState(false);

  // Feedback state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [strengths, setStrengths] = useState('');
  const [needsWork, setNeedsWork] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Load exams
  useEffect(() => {
    api.adminListExams().then(data => {
      setExams(data || []);
      if (data && data.length > 0) {
        setSelectedExamId(data[0].id);
      }
    }).catch(console.error);
  }, [schoolId]);

  // Load Attendance sheet
  const loadAttendance = async () => {
    setLoadingAtt(true);
    setSaveSuccess(false);
    try {
      const data = await api.getClassAttendance(schoolId, grade, section, selectedDate);
      const initialRoster = (data.students || []).map(s => ({
        ...s,
        status: s.status || 'Present',
      }));
      setRoster(initialRoster);
    } catch (e) {
      console.error('Failed to load attendance roster', e);
    } finally {
      setLoadingAtt(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, grade, section]);

  // Load Marks Matrix
  const loadMarksMatrix = async () => {
    if (!selectedExamId) return;
    setLoadingMatrix(true);
    setMarksSuccess(false);
    try {
      const data = await api.getMarksMatrix(schoolId, selectedExamId, grade, section);
      setMatrixData(data || { subjects: [], roster: [] });
    } catch (e) {
      console.error('Failed to load marks matrix', e);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'marks' && selectedExamId) {
      loadMarksMatrix();
    }
  }, [activeSubTab, selectedExamId, grade, section]);

  const handleStatusChange = (studentId, newStatus) => {
    setRoster(prev => prev.map(s => s.student_id === studentId ? { ...s, status: newStatus } : s));
  };

  const handleMarkAllPresent = () => {
    setRoster(prev => prev.map(s => ({ ...s, status: 'Present' })));
  };

  const handleSaveAttendance = async () => {
    setSavingAtt(true);
    setSaveSuccess(false);
    try {
      await api.markBatchAttendance({
        school_id: schoolId,
        date: selectedDate,
        records: roster.map(r => ({
          student_id: r.student_id,
          status: r.status,
          reason: r.reason || null,
        })),
        marked_by: user?.id,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Failed to save attendance');
    } finally {
      setSavingAtt(false);
    }
  };

  // Feature 3: Carry forward yesterday's attendance template
  const handleCarryForwardYesterday = async () => {
    try {
      const res = await api.getPreviousSessionAttendance(schoolId, grade, section, selectedDate);
      if (res && res.found && res.records?.length > 0) {
        const statusMap = {};
        res.records.forEach(r => { statusMap[r.student_id] = r; });
        setRoster(prev => prev.map(s => {
          const match = statusMap[s.student_id];
          return match ? { ...s, status: match.status, reason: match.reason } : s;
        }));
        setTemplateMsg(`Attendance template copied from session: ${res.session_date}`);
        setTimeout(() => setTemplateMsg(null), 4000);
      } else {
        alert(`No previous attendance session found prior to ${selectedDate}`);
      }
    } catch (e) {
      console.error('Failed to carry forward attendance', e);
      alert('Could not fetch previous session');
    }
  };

  // Feature 7: Class Diary Handlers
  const loadClassDiary = async () => {
    setLoadingDiary(true);
    try {
      const data = await api.getClassDiaryEntries(schoolId, grade, section);
      setDiaryEntries(data || []);
    } catch (e) {
      console.error('Failed to load class diary entries', e);
    } finally {
      setLoadingDiary(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'diary') {
      loadClassDiary();
    }
  }, [activeSubTab, grade, section]);

  const handleCreateDiaryEntry = async (e) => {
    e?.preventDefault();
    if (!selectedDiaryStudentId || !diaryRemark.trim()) {
      alert('Please select a student and write a remark');
      return;
    }
    setSavingDiary(true);
    try {
      await api.createDiaryEntry({
        school_id: schoolId,
        student_id: selectedDiaryStudentId,
        teacher_user_id: user?.id,
        category: diaryCategory,
        title: diaryTitle.trim() || undefined,
        remark: diaryRemark.trim(),
        action_required: diaryActionRequired,
        is_parent_visible: true,
      });
      setDiaryRemark('');
      setDiaryTitle('');
      setDiarySuccess('Diary remark logged and broadcasted successfully!');
      setTimeout(() => setDiarySuccess(null), 3500);
      loadClassDiary();
    } catch (err) {
      console.error('Failed to create diary entry', err);
      alert('Failed to publish diary entry');
    } finally {
      setSavingDiary(false);
    }
  };

  const handleDeleteDiary = async (entryId) => {
    if (!confirm('Are you sure you want to delete this diary remark?')) return;
    try {
      await api.deleteDiaryEntry(entryId);
      loadClassDiary();
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  // Feature 8: Class Insights Handlers
  const loadClassInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await api.getTeacherClassInsights(schoolId, grade, section, selectedExamId);
      setInsightsData(data || null);
    } catch (e) {
      console.error('Failed to load class insights', e);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'insights') {
      loadClassInsights();
    }
  }, [activeSubTab, grade, section, selectedExamId]);

  // Marks editing
  const handleScoreChange = (studentId, subjectId, newScore) => {
    const parsed = Math.max(0, Math.min(100, parseFloat(newScore) || 0));
    setMatrixData(prev => {
      const updatedRoster = prev.roster.map(st => {
        if (st.student_id === studentId) {
          const updatedMarks = {
            ...st.marks,
            [subjectId]: {
              ...(st.marks[subjectId] || {}),
              obtained: parsed,
              max: 100,
            }
          };
          return { ...st, marks: updatedMarks };
        }
        return st;
      });
      return { ...prev, roster: updatedRoster };
    });
  };

  const handleSaveMarksMatrix = async () => {
    if (!selectedExamId) return;
    setSavingMarks(true);
    setMarksSuccess(false);

    try {
      const markEntries = [];
      matrixData.roster.forEach(st => {
        Object.entries(st.marks || {}).forEach(([subId, m]) => {
          markEntries.push({
            student_id: st.student_id,
            subject_id: subId,
            marks_obtained: parseFloat(m.obtained) || 0,
            max_marks: parseFloat(m.max) || 100,
          });
        });
      });

      await api.saveBatchMarks({
        school_id: schoolId,
        exam_id: selectedExamId,
        marks: markEntries,
      });

      setMarksSuccess(true);
      setTimeout(() => setMarksSuccess(false), 3000);
    } catch (e) {
      alert('Failed to sync marks');
    } finally {
      setSavingMarks(false);
    }
  };

  // Feedback management
  const handleSelectStudentForFeedback = async (student) => {
    setSelectedStudent(student);
    setFeedbackSuccess(false);

    // Try loading existing feedback from backend
    if (selectedExamId) {
      try {
        const existing = await api.getFeedback(student.student_id, selectedExamId);
        if (existing && existing.exists) {
          setFeedbackText(existing.feedback || '');
          setStrengths(existing.strengths || '');
          setNeedsWork(existing.needs_work || '');
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    // Default template if not saved yet
    setFeedbackText(`${student.name} is making steady progress and actively contributes to classroom discussions.`);
    setStrengths('Class Participation, Punctuality');
    setNeedsWork('Regular revision in core subject topics');
  };

  const handleSynthesizeAiRemarks = async () => {
    if (!selectedStudent || !selectedExamId) return;
    setGeneratingAi(true);
    try {
      const res = await api.generateAiFeedback({
        student_id: selectedStudent.student_id,
        exam_id: selectedExamId,
        school_id: schoolId,
      });

      setStrengths(res.strengths || '');
      setNeedsWork(res.needs_work || '');
      setFeedbackText(res.feedback || '');
    } catch (e) {
      alert('Could not generate remarks. Please enter evaluation remarks manually.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!selectedStudent || !selectedExamId) return;
    setSavingFeedback(true);
    try {
      await api.saveFeedback({
        student_id: selectedStudent.student_id,
        exam_id: selectedExamId,
        school_id: schoolId,
        feedback: feedbackText,
        strengths: strengths,
        needs_work: needsWork,
      });
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3500);
    } catch (e) {
      alert('Failed to save remarks');
    } finally {
      setSavingFeedback(false);
    }
  };

  const presentCount = roster.filter(r => r.status === 'Present').length;
  const absentCount = roster.filter(r => r.status === 'Absent').length;
  const lateCount = roster.filter(r => r.status === 'Late').length;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Mobile-First PWA Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A2540 0%, #1e3a8a 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(10, 37, 64, 0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="pill" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '11px' }}>
                Teacher Companion PWA
              </span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>Class 10-A Session Lead</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              {user?.full_name || 'Educator'} • Workspace
            </h2>
            <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>
              {user?.school_name || 'Technula EduFlow School'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowChatDrawer(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.18)', color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)', fontSize: '12px',
                padding: '6px 12px', cursor: 'pointer', borderRadius: '8px',
                fontWeight: 600
              }}
            >
              <MessageSquare size={14} /> Messages
            </button>
            <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              ● Live Sync Connected
            </span>
          </div>
        </div>

        {/* 6 Core Educator Workflows */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '8px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}>
          {[
            { id: 'attendance', label: 'Daily Attendance', icon: <Calendar size={15} /> },
            { id: 'diary', label: 'Class Diary', icon: <Edit3 size={15} /> },
            { id: 'insights', label: 'Class Insights', icon: <BarChart3 size={15} /> },
            { id: 'datesheet', label: 'Datesheet', icon: <CalendarDays size={15} /> },
            { id: 'activities', label: 'Activities', icon: <Sparkles size={15} /> },
            { id: 'gallery', label: 'School Gallery', icon: <Camera size={15} /> },
            { id: 'gatepass', label: 'Class Gate Pass', icon: <ShieldAlert size={15} /> },
            { id: 'schedule', label: "Today's Schedule", icon: <Clock size={15} /> },
            { id: 'homework', label: 'Homework Diary', icon: <BookOpen size={15} /> },
            { id: 'leaves', label: 'Leave Requests', icon: <FileCheck size={15} /> },
            { id: 'marks', label: 'Gradebook & Marks', icon: <BarChart3 size={15} /> },
            { id: 'feedback', label: 'Evaluation Remarks', icon: <Award size={15} /> },
            { id: 'messages', label: 'Parent Messages', icon: <MessageSquare size={15} /> },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: isActive ? '#ffffff' : 'rgba(255,255,255,0.12)',
                  color: isActive ? 'var(--primary)' : '#ffffff',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PWA TAB 1: ATTENDANCE
      ══════════════════════════════════════════ */}
      {activeSubTab === 'attendance' && (
        <div>
          {/* Controls Bar */}
          <div className="tech-card" style={{
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}>
            {assignedClasses.length > 0 && (
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
                  Assigned Classes:
                </span>
                {assignedClasses.map((ac, idx) => {
                  const isSelected = ac.grade === grade && ac.section === section;
                  return (
                    <button
                      key={ac.id || idx}
                      type="button"
                      onClick={() => { setGrade(ac.grade); setSection(ac.section); }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(99, 91, 255, 0.08)' : '#fff',
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span>Class {ac.grade}-{ac.section}</span>
                      <span style={{
                        fontSize: '10px',
                        background: isSelected ? 'var(--primary)' : '#f1f5f9',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}>
                        {ac.role_type === 'ClassTeacher' ? 'Class Teacher' : (ac.subject_name || 'Subject')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  CLASS / GRADE
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="form-input"
                  style={{ width: '95px', height: '36px', fontSize: '13px', fontWeight: 700 }}
                >
                  {['6', '7', '8', '9', '10', '11', '12'].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  SECTION
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="form-input"
                  style={{ width: '75px', height: '36px', fontSize: '13px', fontWeight: 700 }}
                >
                  {['A', 'B', 'C', 'D'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  SESSION DATE
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-input"
                  style={{ width: '150px', height: '36px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <span className="pill pill-emerald" style={{ fontSize: '12px' }}>
                  ✓ {presentCount} Present
                </span>
                <span className="pill pill-rose" style={{ fontSize: '12px' }}>
                  ✗ {absentCount} Absent
                </span>
                {lateCount > 0 && (
                  <span className="pill pill-amber" style={{ fontSize: '12px' }}>
                    ⏱ {lateCount} Late
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCarryForwardYesterday}
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Pre-fill roster with statuses from the most recent prior session"
              >
                <RefreshCw size={13} /> Carry Forward Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuickFlipMode(prev => !prev)}
                className="btn-secondary"
                style={{
                  fontSize: '12.5px',
                  padding: '7px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: quickFlipMode ? 'var(--primary)' : undefined,
                  color: quickFlipMode ? '#ffffff' : undefined,
                  border: quickFlipMode ? '1px solid var(--primary)' : undefined,
                }}
                title="Enable 1-tap touch flip between Present and Absent"
              >
                <CheckCircle2 size={13} /> Quick-Flip Mode {quickFlipMode ? '(ON)' : ''}
              </button>
              <button
                onClick={handleMarkAllPresent}
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 12px' }}
              >
                Mark All Present
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={savingAtt}
                className="btn-primary"
                style={{ fontSize: '12.5px', padding: '7px 16px' }}
              >
                <Save size={14} />
                {savingAtt ? 'Saving...' : 'Sync Attendance'}
              </button>
            </div>
          </div>

          {templateMsg && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <RefreshCw size={15} /> {templateMsg}
            </div>
          )}

          {saveSuccess && (
            <div style={{
              background: 'var(--accent-emerald-light)',
              color: 'var(--accent-emerald)',
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 size={18} /> Attendance synced successfully! Live WhatsApp alerts dispatched to absentees' parents.
            </div>
          )}

          {/* Touch Roster */}
          <div className="tech-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roster.map((s, idx) => {
                const isPresent = s.status === 'Present';
                const isAbsent = s.status === 'Absent';
                const isLate = s.status === 'Late';

                return (
                  <div
                    key={s.student_id}
                    onClick={() => {
                      if (quickFlipMode) {
                        handleStatusChange(s.student_id, isPresent ? 'Absent' : 'Present');
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: isAbsent ? '#fef2f2' : (isLate ? '#fffbeb' : '#ffffff'),
                      border: `1px solid ${isAbsent ? '#fecaca' : (isLate ? '#fde68a' : '#e2e8f0')}`,
                      borderRadius: '10px',
                      flexWrap: 'wrap',
                      gap: '10px',
                      cursor: quickFlipMode ? 'pointer' : 'default',
                      userSelect: quickFlipMode ? 'none' : 'auto',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)'
                      }}>
                        {s.roll_no || idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {s.admission_no} • Grade 10-A
                        </div>
                      </div>
                    </div>

                    {/* Quick 3-State Toggle */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(s.student_id, 'Present')}
                        style={{
                          border: 'none',
                          background: isPresent ? 'var(--accent-emerald)' : '#f1f5f9',
                          color: isPresent ? '#ffffff' : 'var(--text-secondary)',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Check size={14} /> Present
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(s.student_id, 'Absent')}
                        style={{
                          border: 'none',
                          background: isAbsent ? 'var(--accent-rose)' : '#f1f5f9',
                          color: isAbsent ? '#ffffff' : 'var(--text-secondary)',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <X size={14} /> Absent
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(s.student_id, 'Late')}
                        style={{
                          border: 'none',
                          background: isLate ? 'var(--accent-amber)' : '#f1f5f9',
                          color: isLate ? '#ffffff' : 'var(--text-secondary)',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={14} /> Late
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PWA TAB 2: MARKS MATRIX
      ══════════════════════════════════════════ */}
      {activeSubTab === 'marks' && (
        <div className="tech-card" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Grade 10-A Examination Marks Grid
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Real-time gradebook entry with live letter-grade calculation and risk synchronization.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="form-input"
                  style={{ height: '38px', fontSize: '13px', fontWeight: 600 }}
                >
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name} ({ex.term})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveMarksMatrix}
                disabled={savingMarks}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '9px 18px' }}
              >
                <Save size={15} />
                {savingMarks ? 'Saving...' : 'Sync & Publish Marks'}
              </button>
            </div>
          </div>

          {marksSuccess && (
            <div style={{
              background: 'var(--accent-emerald-light)',
              color: 'var(--accent-emerald)',
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 size={18} /> Marks synchronized across databases and updated on Student Report Cards!
            </div>
          )}

          {/* Marks Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>Roll</th>
                  <th style={{ width: '20%' }}>Student Name</th>
                  {matrixData.subjects.map(sub => (
                    <th key={sub.id} style={{ textAlign: 'center', minWidth: '85px' }}>
                      {sub.name.split(' ')[0]}
                    </th>
                  ))}
                  <th style={{ width: '10%', textAlign: 'center' }}>Total %</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.roster.map((st) => {
                  let totalObt = 0;
                  let totalMax = 0;
                  matrixData.subjects.forEach(sub => {
                    const m = st.marks?.[sub.id];
                    if (m) {
                      totalObt += parseFloat(m.obtained) || 0;
                      totalMax += parseFloat(m.max) || 100;
                    }
                  });
                  const overallPct = totalMax > 0 ? (totalObt / totalMax * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={st.student_id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{st.roll_no}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {st.admission_no}
                        </div>
                      </td>

                      {matrixData.subjects.map(sub => {
                        const m = st.marks?.[sub.id] || { obtained: 0, max: 100 };
                        return (
                          <td key={sub.id} style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={m.obtained}
                              onChange={(e) => handleScoreChange(st.student_id, sub.id, e.target.value)}
                              className="form-input"
                              style={{
                                width: '65px',
                                textAlign: 'center',
                                padding: '4px 6px',
                                fontSize: '13px',
                                fontWeight: 700,
                                margin: '0 auto',
                              }}
                            />
                          </td>
                        );
                      })}

                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`pill ${parseFloat(overallPct) >= 75 ? 'pill-emerald' : (parseFloat(overallPct) >= 50 ? 'pill-primary' : 'pill-rose')}`}
                          style={{ fontWeight: 800 }}
                        >
                          {overallPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PWA TAB 3: AI REMARKS SYNTHESIZER
      ══════════════════════════════════════════ */}
      {activeSubTab === 'feedback' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Student Selector */}
          <div className="tech-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Select Student for Evaluation
              </h3>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="form-input"
                style={{ height: '32px', fontSize: '12px' }}
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roster.map((s) => {
                const isSelected = selectedStudent?.student_id === s.student_id;
                return (
                  <div
                    key={s.student_id}
                    onClick={() => handleSelectStudentForFeedback(s)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--primary-light)' : '#ffffff',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Roll #{s.roll_no} • {s.admission_no}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReportCard(s.student_id, s.name);
                      }}
                      className="btn-secondary"
                      style={{ padding: '5px 8px', fontSize: '12px', gap: '4px' }}
                    >
                      <FileText size={13} color="var(--primary)" /> Card
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Feedback Form */}
          <div className="tech-card" style={{ padding: '24px' }}>
            {selectedStudent ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Report Card Remarks for {selectedStudent.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Grade 10-A • Formal Academic Record</p>
                  </div>

                  <button
                    onClick={handleSynthesizeAiRemarks}
                    disabled={generatingAi}
                    className="btn-secondary"
                    style={{ borderColor: 'var(--primary-border)', color: 'var(--primary)', fontWeight: 700, fontSize: '12px' }}
                  >
                    <Sparkles size={14} className={generatingAi ? 'animate-spin' : ''} />
                    {generatingAi ? 'Generating...' : 'Auto-Generate Remarks'}
                  </button>
                </div>

                {feedbackSuccess && (
                  <div style={{
                    background: 'var(--accent-emerald-light)',
                    color: 'var(--accent-emerald)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}>
                    ✓ Remarks saved and synced to Report Card!
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Key Strengths
                  </label>
                  <input
                    type="text"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Conceptual Clarity, Math Problem Solving"
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Areas for Growth
                  </label>
                  <input
                    type="text"
                    value={needsWork}
                    onChange={(e) => setNeedsWork(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Descriptive writing speed, Regular attendance"
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Teacher Narrative Evaluation
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="form-input"
                    placeholder="Constructive evaluation notes that will appear on the final report card..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => onOpenReportCard(selectedStudent.student_id, selectedStudent.name)}
                    className="btn-secondary"
                    style={{ fontSize: '13px' }}
                  >
                    <FileText size={15} /> Preview Report Card
                  </button>

                  <button
                    onClick={handleSaveFeedback}
                    disabled={savingFeedback}
                    className="btn-primary"
                    style={{ fontSize: '13px' }}
                  >
                    <Save size={15} />
                    {savingFeedback ? 'Saving...' : 'Save & Sync Remarks'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No Student Selected</h4>
                <p style={{ fontSize: '13px' }}>Click on a student from the left roster to edit evaluation remarks.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PWA TAB: CLASS DIARY (Feature 7)
      ══════════════════════════════════════════ */}
      {activeSubTab === 'diary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 1.5fr', gap: '20px' }}>
          {/* Create Entry Form */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="var(--primary)" /> Log Student Diary Remark
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Record official observations, appreciations, and concerns visible to parents.
            </p>

            {diarySuccess && (
              <div style={{
                background: 'var(--accent-emerald-light)',
                color: 'var(--accent-emerald)',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                fontWeight: 700,
              }}>
                ✓ {diarySuccess}
              </div>
            )}

            <form onSubmit={handleCreateDiaryEntry}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  SELECT STUDENT
                </label>
                <select
                  value={selectedDiaryStudentId}
                  onChange={(e) => setSelectedDiaryStudentId(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">-- Choose Student ({roster.length} in class) --</option>
                  {roster.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.roll_no ? `#${s.roll_no} ` : ''}{s.name} ({s.admission_no})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  CATEGORY
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { id: 'APPRECIATION', label: '🌟 Appreciation', color: '#10b981', bg: '#ecfdf5' },
                    { id: 'NEEDS_ATTENTION', label: '⚠️ Needs Attention', color: '#ef4444', bg: '#fef2f2' },
                    { id: 'ACADEMIC', label: '📚 Academic', color: '#3b82f6', bg: '#eff6ff' },
                    { id: 'HEALTH', label: '🏥 Health', color: '#8b5cf6', bg: '#f5f3ff' },
                    { id: 'DISCIPLINE', label: '📋 Discipline', color: '#f59e0b', bg: '#fffbeb' },
                  ].map(cat => {
                    const isSel = diaryCategory === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setDiaryCategory(cat.id)}
                        style={{
                          padding: '5px 11px',
                          borderRadius: '16px',
                          border: `1.5px solid ${isSel ? cat.color : '#e2e8f0'}`,
                          background: isSel ? cat.bg : '#ffffff',
                          color: isSel ? cat.color : 'var(--text-secondary)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  TITLE / SUBJECT (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={diaryTitle}
                  onChange={(e) => setDiaryTitle(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Outstanding Science Project, Incomplete Notes"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  REMARK & OBSERVATION *
                </label>
                <textarea
                  value={diaryRemark}
                  onChange={(e) => setDiaryRemark(e.target.value)}
                  className="form-input"
                  rows={4}
                  placeholder="Describe your observation, recommendation, or note for the parent..."
                  required
                />
              </div>

              <div style={{ marginBottom: '18px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={diaryActionRequired}
                    onChange={(e) => setDiaryActionRequired(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span>Requires Parent Acknowledgement & Instant WhatsApp Alert</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={savingDiary}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Save size={15} />
                {savingDiary ? 'Publishing Entry...' : 'Publish Diary Entry'}
              </button>
            </form>
          </div>

          {/* Diary Feed */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Class Diary Feed — Grade {grade}-{section}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {diaryEntries.length} remarks published this term
                </p>
              </div>
              <button
                type="button"
                onClick={loadClassDiary}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <RefreshCw size={13} className={loadingDiary ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loadingDiary ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading diary entries...</div>
            ) : diaryEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Edit3 size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px' }}>No diary remarks recorded yet for Grade {grade}-{section}. Use the form on the left to publish remarks.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                {diaryEntries.map(entry => {
                  const catColors = {
                    APPRECIATION: { color: '#10b981', bg: '#ecfdf5', label: '🌟 Appreciation' },
                    NEEDS_ATTENTION: { color: '#ef4444', bg: '#fef2f2', label: '⚠️ Needs Attention' },
                    ACADEMIC: { color: '#3b82f6', bg: '#eff6ff', label: '📚 Academic' },
                    HEALTH: { color: '#8b5cf6', bg: '#f5f3ff', label: '🏥 Health' },
                    DISCIPLINE: { color: '#f59e0b', bg: '#fffbeb', label: '📋 Discipline' },
                  };
                  const cInfo = catColors[entry.category] || catColors.APPRECIATION;

                  return (
                    <div
                      key={entry.id}
                      style={{
                        padding: '14px 16px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {entry.student_name}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            (Roll #{entry.roll_no})
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: cInfo.bg,
                            color: cInfo.color,
                          }}>
                            {cInfo.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            📅 {entry.entry_date}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteDiary(entry.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '2px 6px',
                            }}
                            title="Delete entry"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {entry.title && (
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {entry.title}
                        </div>
                      )}

                      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                        {entry.remark}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        <span>Logged by: <strong>{entry.teacher_name}</strong></span>
                        {entry.action_required ? (
                          entry.acknowledged_by_parent ? (
                            <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Acknowledged by Parent</span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>⏳ Awaiting Parent Acknowledgment</span>
                          )
                        ) : (
                          <span style={{ color: '#64748b' }}>Informational Note</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PWA TAB: CLASS INSIGHTS (Feature 8)
      ══════════════════════════════════════════ */}
      {activeSubTab === 'insights' && (
        <div>
          {/* Exam Filter Header */}
          <div className="tech-card" style={{
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Subject Performance Heatmap & Outlier Detection
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Grade {grade}-{section} • Real-time Class Scorecard & Benchmark Analysis
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="form-input"
                style={{ height: '36px', fontSize: '13px' }}
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={loadClassInsights}
                className="btn-secondary"
                style={{ height: '36px', padding: '0 14px' }}
              >
                <RefreshCw size={14} className={loadingInsights ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {loadingInsights ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading class insights...</div>
          ) : !insightsData || (!insightsData.subjects?.length && !insightsData.students_needing_attention?.length) ? (
            <div className="tech-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <BarChart3 size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Marks Data Available</h4>
              <p style={{ fontSize: '13px' }}>No marks entered yet for Grade {grade}-{section} for the selected examination.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Subject Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}>
                {insightsData.subjects.map(sub => {
                  const isAboveSchool = sub.class_avg_pct >= sub.school_avg_pct;
                  return (
                    <div
                      key={sub.subject_id}
                      className="tech-card"
                      style={{ padding: '18px', borderTop: `4px solid ${sub.class_avg_pct >= 60 ? '#10b981' : '#f59e0b'}` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {sub.subject_name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            School Benchmark: {sub.school_avg_pct}%
                          </div>
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color: sub.class_avg_pct >= 60 ? '#10b981' : '#f59e0b',
                        }}>
                          {sub.class_avg_pct}%
                        </div>
                      </div>

                      {/* Metric pills */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        <span className="pill pill-emerald" style={{ fontSize: '11px' }}>
                          Pass: {sub.pass_pct}%
                        </span>
                        <span className="pill pill-indigo" style={{ fontSize: '11px' }}>
                          Distinction: {sub.distinction_pct}%
                        </span>
                        <span className={`pill ${isAboveSchool ? 'pill-emerald' : 'pill-rose'}`} style={{ fontSize: '11px' }}>
                          {isAboveSchool ? `+${(sub.class_avg_pct - sub.school_avg_pct).toFixed(1)}% vs School` : `${(sub.class_avg_pct - sub.school_avg_pct).toFixed(1)}% vs School`}
                        </span>
                      </div>

                      {/* Top & lowest */}
                      <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div>🥇 Top: <strong>{sub.top_student}</strong> ({sub.top_score}%)</div>
                        <div>🔻 Lowest: <strong>{sub.lowest_student}</strong> ({sub.lowest_score}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Parallel Sections Comparison */}
              {insightsData.section_comparison && insightsData.section_comparison.length > 1 && (
                <div className="tech-card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Section Benchmark Comparison (Grade {grade})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {insightsData.section_comparison.map(sec => (
                      <div
                        key={sec.section}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: sec.is_current ? 'var(--primary-light)' : '#f8fafc',
                          border: `1.5px solid ${sec.is_current ? 'var(--primary)' : '#e2e8f0'}`,
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: sec.is_current ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {sec.class_label} {sec.is_current ? '(Your Class)' : ''}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {sec.average_percentage}%
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {sec.student_count} Enrolled Students
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students Needing Attention */}
              <div className="tech-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#ef4444', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} color="#ef4444" /> Students Needing Immediate Remedial Attention ({insightsData.students_needing_attention.length})
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Students scoring in the bottom quartile or under 40% in key subjects.
                </p>

                {insightsData.students_needing_attention.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    🎉 No students currently in the critical intervention zone! All students scoring above 45%.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px' }}>Roll</th>
                          <th style={{ padding: '8px' }}>Student Name</th>
                          <th style={{ padding: '8px' }}>Overall %</th>
                          <th style={{ padding: '8px' }}>Weak Subjects</th>
                          <th style={{ padding: '8px' }}>Recommended Intervention</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insightsData.students_needing_attention.map(st => (
                          <tr key={st.student_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 700 }}>{st.roll_no}</td>
                            <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>{st.student_name}</td>
                            <td style={{ padding: '10px 8px', fontWeight: 800, color: '#ef4444' }}>{st.overall_percentage}%</td>
                            <td style={{ padding: '10px 8px' }}>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {st.weak_subjects.map((sub, i) => (
                                  <span key={i} className="pill pill-rose" style={{ fontSize: '10.5px' }}>{sub}</span>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                              {st.recommended_intervention}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          PWA TAB: CLASS DATESHEET
      ══════════════════════════════════════════ */}
      {activeSubTab === 'datesheet' && (
        <TeacherDatesheet schoolId={schoolId} user={user} grade={grade} section={section} />
      )}

      {/* ══════════════════════════════════════════
          PWA TAB: ACTIVITIES TIMELINE
      ══════════════════════════════════════════ */}
      {activeSubTab === 'activities' && (
        <TeacherActivities schoolId={schoolId} user={user} grade={grade} section={section} />
      )}

      {/* ══════════════════════════════════════════
          PWA TAB: PHOTO GALLERY
      ══════════════════════════════════════════ */}
      {activeSubTab === 'gallery' && (
        <TeacherGallery schoolId={schoolId} user={user} />
      )}

      {/* ══════════════════════════════════════════
          PWA TAB: CLASS GATE PASS MONITOR
      ══════════════════════════════════════════ */}
      {activeSubTab === 'gatepass' && (
        <TeacherGatePass schoolId={schoolId} user={user} grade={grade} section={section} />
      )}

      {/* ══════════════════════════════════════════
          PWA TAB 4: TODAY'S CLASS SCHEDULE
      ══════════════════════════════════════════ */}
      {activeSubTab === 'schedule' && (
        <TeacherSchedule
          schoolId={schoolId}
          grade={grade}
          section={section}
          user={user}
          onSelectLecture={(g, s, tab) => {
            setGrade(g);
            setSection(s);
            if (tab) setActiveSubTab(tab);
          }}
        />
      )}


      {/* ══════════════════════════════════════════
          PWA TAB 5: HOMEWORK DIARY
      ══════════════════════════════════════════ */}
      {activeSubTab === 'homework' && (
        <TeacherHomework schoolId={schoolId} user={user} grade={grade} section={section} />
      )}

      {/* ══════════════════════════════════════════
          PWA TAB 6: STUDENT LEAVE REQUESTS
      ══════════════════════════════════════════ */}
      {activeSubTab === 'leaves' && (
        <LeaveManager schoolId={schoolId} />
      )}

      {/* ══════════════════════════════════════════
          PWA TAB 7: PARENT MESSAGING
      ══════════════════════════════════════════ */}
      {activeSubTab === 'messages' && (
        <div className="tech-card" style={{ padding: '32px', textAlign: 'center' }}>
          <MessageSquare size={44} color="var(--primary)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Parent-Teacher Direct Messages
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 16px' }}>
            Communicate with parents of students in your class. Send announcements, upload homework sheets, voice notes, and photos.
          </p>
          <button
            onClick={() => setShowChatDrawer(true)}
            className="btn-primary"
            style={{ margin: '0 auto' }}
          >
            <MessageSquare size={16} /> Launch Conversations Drawer
          </button>
        </div>
      )}

      {/* Slide-out Chat Drawer */}
      {(showChatDrawer || activeSubTab === 'messages') && (
        <ChatDrawer
          user={user}
          onClose={() => {
            setShowChatDrawer(false);
            if (activeSubTab === 'messages') setActiveSubTab('attendance');
          }}
        />
      )}
    </div>
  );
}
