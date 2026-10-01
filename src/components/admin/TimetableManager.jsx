import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import {
  Calendar,
  Clock,
  Edit2,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Sparkles,
  UploadCloud,
  FileText,
  Check,
  RefreshCw,
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetableManager({ schoolId, teachers = [], subjects = [] }) {
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);

  // AI Document / PDF Upload State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiFile, setAiFile] = useState(null);
  const [parsingAi, setParsingAi] = useState(false);
  const [parsedSchedule, setParsedSchedule] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [applyingSchedule, setApplyingSchedule] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const aiFileInputRef = useRef(null);

  // Edit Slot Modal
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({
    day_of_week: 0,
    period_number: 1,
    start_time: '08:30',
    end_time: '09:15',
    subject_id: '',
    teacher_id: '',
    room_number: '',
    slot_type: 'CLASS',
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.getClassTimetable(schoolId, selectedGrade, selectedSection);
      setTimetableData(res.schedule || {});
    } catch (e) {
      console.error(e);
      setError('Failed to load timetable schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadTimetable();
  }, [schoolId, selectedGrade, selectedSection]);

  const handleOpenEdit = (dayName, periodNum, existingSlot = null) => {
    const dayIdx = DAYS.indexOf(dayName);
    if (existingSlot) {
      setSlotForm({
        day_of_week: dayIdx,
        period_number: periodNum,
        start_time: existingSlot.start_time || '08:30',
        end_time: existingSlot.end_time || '09:15',
        subject_id: existingSlot.subject_id || '',
        teacher_id: existingSlot.teacher_id || '',
        room_number: existingSlot.room_number || '',
        slot_type: existingSlot.slot_type || 'CLASS',
      });
    } else {
      // Default times per period
      const startH = 8 + Math.floor((periodNum - 1) * 0.75);
      const startM = ((periodNum - 1) * 45) % 60;
      setSlotForm({
        day_of_week: dayIdx,
        period_number: periodNum,
        start_time: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        end_time: `${String(startH).padStart(2, '0')}:${String(startM + 45).padStart(2, '0')}`,
        subject_id: subjects[0]?.id || '',
        teacher_id: teachers[0]?.id || '',
        room_number: 'Room 101',
        slot_type: 'CLASS',
      });
    }
    setEditingSlot({ dayName, periodNum, id: existingSlot?.id });
  };

  const handleDeleteSlot = async () => {
    if (!editingSlot?.id) return;
    if (!window.confirm(`Clear and remove Period ${editingSlot.periodNum} for ${editingSlot.dayName}?`)) return;
    try {
      await api.deleteTimetableSlot(editingSlot.id);
      setMessage(`Period ${editingSlot.periodNum} cleared for ${editingSlot.dayName}`);
      setEditingSlot(null);
      loadTimetable();
    } catch (err) {
      setError(err.message || 'Failed to delete timetable slot');
    }
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      if (editingSlot?.id) {
        await api.updateTimetableSlot(editingSlot.id, slotForm);
      } else {
        await api.saveTimetableSlot({
          school_id: schoolId,
          grade: selectedGrade,
          section: selectedSection,
          ...slotForm,
        });
      }
      setMessage(`Period ${slotForm.period_number} updated for ${DAYS[slotForm.day_of_week]}`);
      setEditingSlot(null);
      loadTimetable();
    } catch (err) {
      setError(err.message || 'Failed to save timetable slot');
    }
  };

  // AI Timetable Parsing Handlers
  const handleAiFileSelect = async (file) => {
    if (!file) return;
    setAiFile(file);
    setAiError(null);
    setParsedSchedule(null);
    setParsingAi(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('grade', selectedGrade);
      formData.append('section', selectedSection);
      formData.append('academic_year', '2025-26');
      formData.append('auto_save', 'false');

      const res = await api.aiParseTimetableDocument(formData);
      setParsedSchedule(res);
    } catch (err) {
      setAiError(err.message || 'AI Document Parsing failed. Please ensure file contains a legible class schedule.');
    } finally {
      setParsingAi(false);
    }
  };

  const handleApplyAiSchedule = async () => {
    if (!parsedSchedule || !parsedSchedule.slots || parsedSchedule.slots.length === 0) return;
    setApplyingSchedule(true);
    setAiError(null);
    try {
      const res = await api.bulkApplyTimetableSlots({
        grade: selectedGrade,
        section: selectedSection,
        academic_year: '2025-26',
        slots: parsedSchedule.slots,
      });
      setMessage(res.message || `Successfully applied timetable schedule for Class ${selectedGrade}-${selectedSection}!`);
      setShowAiModal(false);
      setAiFile(null);
      setParsedSchedule(null);
      loadTimetable();
    } catch (err) {
      setAiError(err.message || 'Failed to apply parsed schedule to database.');
    } finally {
      setApplyingSchedule(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '18px 24px',
        background: 'var(--card-bg, #fff)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Weekly Master Class Schedule Builder
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Configure 6-day periods, subject allocations, and assigned instructors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Grade:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="input-field"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {['6', '7', '8', '9', '10', '11', '12'].map((g) => (
                <option key={g} value={g}>Class {g}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="input-field"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {['A', 'B', 'C', 'D'].map((s) => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setShowAiModal(true);
              setAiError(null);
            }}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} /> AI Parse PDF / Image Schedule
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Schedule Table Grid */}
      <div className="tech-card" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '850px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '12px', textAlign: 'left', width: '100px', fontWeight: 700 }}>Day</th>
              {PERIODS.map((p) => (
                <th key={p} style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                  Period {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const daySlots = timetableData?.[day] || [];
              return (
                <tr key={day} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {day}
                  </td>
                  {PERIODS.map((p) => {
                    const slot = daySlots.find((s) => s.period_number === p);
                    return (
                      <td
                        key={p}
                        onClick={() => handleOpenEdit(day, p, slot)}
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          verticalAlign: 'top',
                          cursor: 'pointer',
                          background: slot ? (slot.slot_type === 'CLASS' ? 'rgba(99, 102, 241, 0.04)' : '#f8fafc') : '#fff',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = slot ? (slot.slot_type === 'CLASS' ? 'rgba(99, 102, 241, 0.04)' : '#f8fafc') : '#fff'; }}
                      >
                        {slot ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 700, color: slot.slot_type === 'CLASS' ? 'var(--primary)' : '#64748b', fontSize: '12px' }}>
                              {slot.subject_name}
                            </span>
                            {slot.teacher_name && (
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {slot.teacher_name}
                              </span>
                            )}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {slot.start_time} • {slot.room_number || 'Room'}
                            </span>
                          </div>
                        ) : (
                          <div style={{ padding: '12px 0', color: '#cbd5e1' }}>
                            <Plus size={14} style={{ margin: '0 auto' }} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Slot Modal */}
      {editingSlot && (
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
            maxWidth: '460px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800 }}>
                Edit Slot: {editingSlot.dayName} • Period {editingSlot.periodNum} (Class {selectedGrade}-{selectedSection})
              </h4>
              <button onClick={() => setEditingSlot(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Slot Type</label>
                <select
                  value={slotForm.slot_type}
                  onChange={(e) => setSlotForm({ ...slotForm, slot_type: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <option value="CLASS">Academic Class</option>
                  <option value="BREAK">Recess / Short Break</option>
                  <option value="LUNCH">Lunch Period</option>
                  <option value="ASSEMBLY">Morning Assembly</option>
                </select>
              </div>

              {slotForm.slot_type === 'CLASS' && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Subject</label>
                    <select
                      value={slotForm.subject_id}
                      onChange={(e) => setSlotForm({ ...slotForm, subject_id: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', marginTop: '4px' }}
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Faculty / Teacher</label>
                    <select
                      value={slotForm.teacher_id}
                      onChange={(e) => setSlotForm({ ...slotForm, teacher_id: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', marginTop: '4px' }}
                      required
                    >
                      <option value="">-- Assign Instructor --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Room / Laboratory</label>
                    <input
                      type="text"
                      placeholder="e.g. Room 302 / Physics Lab"
                      value={slotForm.room_number}
                      onChange={(e) => setSlotForm({ ...slotForm, room_number: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Start Time</label>
                  <input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>End Time</label>
                  <input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                  Save Slot
                </button>
                {editingSlot?.id && (
                  <button
                    type="button"
                    onClick={handleDeleteSlot}
                    className="btn-secondary"
                    style={{ padding: '10px 14px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Clear this slot"
                  >
                    <Trash2 size={15} /> Clear Slot
                  </button>
                )}
                <button type="button" onClick={() => setEditingSlot(null)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Timetable Document Parser Modal */}
      {showAiModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAiModal(false);
          }}
        >
          <div
            className="tech-card"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.02) 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    AI Timetable Document Parser
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Upload a class schedule PDF, scan, or photo — Gemini AI automatically maps days, periods, times & teachers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setAiFile(null);
                  setParsedSchedule(null);
                  setAiError(null);
                }}
                className="btn-icon"
                style={{ padding: '6px', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {aiError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={16} color="#EF4444" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Target Class Indicator */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                }}
              >
                <span style={{ fontSize: '12.5px', color: '#3730A3', fontWeight: 700 }}>
                  Target: Class {selectedGrade}-{selectedSection} (Academic Year 2025-26)
                </span>
                <span style={{ fontSize: '11px', color: '#4338CA', fontWeight: 600 }}>
                  Powered by Gemini 2.5 Flash Vision
                </span>
              </div>

              {/* Upload Drop Zone */}
              {!parsedSchedule && !parsingAi && (
                <div
                  onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleAiFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => aiFileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: '14px',
                    padding: '38px 20px',
                    textAlign: 'center',
                    background: dragActive ? 'rgba(99,102,241,0.04)' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    ref={aiFileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAiFileSelect(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <UploadCloud
                    size={44}
                    style={{ color: dragActive ? 'var(--primary)' : '#94A3B8', margin: '0 auto 12px auto' }}
                  />
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {aiFile ? aiFile.name : 'Click to select or drop Class Timetable PDF / Image here'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Supports PDF schedules, scans, phone photos of printed timetables, or CSV exports
                  </p>
                </div>
              )}

              {/* Parsing Progress Animation */}
              {parsingAi && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 14px auto' }} />
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Scanning Timetable Document with Gemini AI...
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Extracting Monday–Saturday periods, times, subjects, and instructor allocations...
                  </p>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedSchedule && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>
                        ✨ {parsedSchedule.detected_title || `Class ${selectedGrade}-${selectedSection} Timetable`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                        {parsedSchedule.total_slots} periods successfully parsed across 6 days
                      </div>
                    </div>
                    <span className="pill pill-success" style={{ fontSize: '11px' }}>
                      Ready to Apply
                    </span>
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Day</th>
                          <th style={{ padding: '8px 12px' }}>Period</th>
                          <th style={{ padding: '8px 12px' }}>Time</th>
                          <th style={{ padding: '8px 12px' }}>Subject</th>
                          <th style={{ padding: '8px 12px' }}>Assigned Instructor</th>
                          <th style={{ padding: '8px 12px' }}>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedSchedule.slots.map((slot, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '7px 12px', fontWeight: 700 }}>{slot.day_name}</td>
                            <td style={{ padding: '7px 12px' }}>Period {slot.period_number}</td>
                            <td style={{ padding: '7px 12px', color: 'var(--text-muted)' }}>
                              {slot.start_time} - {slot.end_time}
                            </td>
                            <td style={{ padding: '7px 12px', fontWeight: 700, color: 'var(--primary)' }}>
                              {slot.subject_name}
                            </td>
                            <td style={{ padding: '7px 12px' }}>{slot.teacher_name || '—'}</td>
                            <td style={{ padding: '7px 12px', color: 'var(--text-muted)' }}>{slot.room_number || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      onClick={() => {
                        setAiFile(null);
                        setParsedSchedule(null);
                      }}
                      className="btn-secondary"
                      disabled={applyingSchedule}
                    >
                      Clear & Choose Another File
                    </button>
                    <button
                      onClick={handleApplyAiSchedule}
                      className="btn-primary"
                      disabled={applyingSchedule}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {applyingSchedule ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Applying Schedule...
                        </>
                      ) : (
                        <>
                          <Check size={16} /> Apply Schedule to Class {selectedGrade}-{selectedSection}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
