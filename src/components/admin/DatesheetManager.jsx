import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  Calendar, Plus, Trash2, Edit2, CheckCircle2, AlertCircle,
  FileText, Upload, Eye, EyeOff, Save, X, Clock, MapPin,
  Sparkles, UploadCloud, RefreshCw, Check
} from 'lucide-react';

export default function DatesheetManager({ user }) {
  const [datesheets, setDatesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // AI Document Parser State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiFile, setAiFile] = useState(null);
  const [aiGrade, setAiGrade] = useState('10');
  const [parsingAi, setParsingAi] = useState(false);
  const [parsedDatesheet, setParsedDatesheet] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [creatingFromAi, setCreatingFromAi] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleAiDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleAiDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectAiFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectAiFile = (selectedFile) => {
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.png') && !ext.endsWith('.jpg') && !ext.endsWith('.jpeg')) {
      setAiError('Please upload an examination schedule PDF (.pdf) or image (.png, .jpg).');
      return;
    }
    setAiFile(selectedFile);
    setAiError(null);
  };

  const handleRunAiParse = async () => {
    if (!aiFile) {
      setAiError('Please choose or drop an exam datesheet document first.');
      return;
    }
    setParsingAi(true);
    setAiError(null);
    try {
      const res = await api.aiParseDatesheetDocument(aiFile, aiGrade, form.academic_year, false);
      setParsedDatesheet(res);
    } catch (err) {
      setAiError(err.message || 'Failed to parse datesheet document');
    } finally {
      setParsingAi(false);
    }
  };

  const handleCommitAiDatesheet = async () => {
    if (!parsedDatesheet) return;
    setCreatingFromAi(true);
    setAiError(null);
    try {
      await api.createDatesheet({
        title: parsedDatesheet.title,
        grade: parsedDatesheet.grade,
        section: parsedDatesheet.section || 'ALL',
        academic_year: parsedDatesheet.academic_year || form.academic_year,
        pdf_url: parsedDatesheet.pdf_url,
        entries: parsedDatesheet.entries,
      });
      setMessage(`Datesheet "${parsedDatesheet.title}" published successfully!`);
      setShowAiModal(false);
      setParsedDatesheet(null);
      setAiFile(null);
      loadDatesheets();
    } catch (err) {
      setAiError(err.message || 'Failed to create datesheet from parsed schedule');
    } finally {
      setCreatingFromAi(false);
    }
  };

  const [form, setForm] = useState({
    title: '',
    grade: '10',
    section: 'ALL',
    academic_year: '2025-26',
    pdf_url: '',
    entries: [
      { subject_name: 'Mathematics', subject_code: '041', exam_date: '', start_time: '09:30 AM', end_time: '12:30 PM', venue: 'Exam Hall 1', syllabus_remarks: '' },
      { subject_name: 'Science', subject_code: '086', exam_date: '', start_time: '09:30 AM', end_time: '12:30 PM', venue: 'Exam Hall 1', syllabus_remarks: '' },
    ]
  });

  useEffect(() => {
    loadDatesheets();
  }, []);

  const loadDatesheets = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDatesheets();
      setDatesheets(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load datesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    setForm(prev => ({
      ...prev,
      entries: [
        ...prev.entries,
        { subject_name: '', subject_code: '', exam_date: '', start_time: '09:30 AM', end_time: '12:30 PM', venue: 'Exam Hall', syllabus_remarks: '' }
      ]
    }));
  };

  const handleRemoveEntry = (idx) => {
    setForm(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== idx)
    }));
  };

  const handleEntryChange = (idx, field, value) => {
    setForm(prev => {
      const copy = [...prev.entries];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, entries: copy };
    });
  };

  const handleUploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const res = await api.uploadFile(file);
      setForm(prev => ({ ...prev, pdf_url: res.url }));
      setMessage('PDF Schedule attached successfully.');
    } catch (err) {
      setError(err.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createDatesheet(form);
      setMessage(`Datesheet "${form.title}" saved.`);
      setShowModal(false);
      setForm({
        title: '',
        grade: '10',
        section: 'ALL',
        academic_year: '2025-26',
        pdf_url: '',
        entries: [
          { subject_name: 'Mathematics', subject_code: '041', exam_date: '', start_time: '09:30 AM', end_time: '12:30 PM', venue: 'Exam Hall 1', syllabus_remarks: '' },
        ]
      });
      loadDatesheets();
    } catch (err) {
      setError(err.message || 'Failed to save datesheet');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const res = await api.togglePublishDatesheet(id);
      setMessage(res.message);
      loadDatesheets();
    } catch (err) {
      setError(err.message || 'Failed to toggle publish');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete datesheet "${title}"?`)) return;
    try {
      await api.deleteDatesheet(id);
      setMessage('Datesheet deleted.');
      loadDatesheets();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & New Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Examination Datesheets</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Publish structured subject-wise exam timetables and official schedules to parents.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => {
              setShowAiModal(true);
              setAiError(null);
              setParsedDatesheet(null);
              setAiFile(null);
            }}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            }}
          >
            <Sparkles size={15} /> AI Parse PDF / Image Datesheet
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Create Datesheet
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Datesheets Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {datesheets.length === 0 ? (
          <div className="tech-card" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
            No exam datesheets created yet. Click "Create Datesheet" above.
          </div>
        ) : (
          datesheets.map((d) => (
            <div key={d.id} className="tech-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="pill" style={{ background: d.is_published ? '#dcfce7' : '#fef3c7', color: d.is_published ? '#15803d' : '#b45309' }}>
                    {d.is_published ? 'Published to Parents' : 'Draft Mode'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Class {d.grade}-{d.section}
                  </span>
                </div>

                <h4 style={{ fontSize: '17px', fontWeight: 800, margin: '12px 0 6px 0', color: 'var(--text-primary)' }}>
                  {d.title}
                </h4>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Academic Session: <strong>{d.academic_year}</strong> • {d.entries_count} Papers
                </div>

                {/* Next 3 papers quick preview */}
                <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  {d.entries.slice(0, 3).map((e, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', color: '#475569' }}>
                      <span style={{ fontWeight: 600 }}>{e.subject_name}</span>
                      <span>{e.exam_date} ({e.start_time})</span>
                    </div>
                  ))}
                  {d.entries.length > 3 && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      + {d.entries.length - 3} more subjects
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button
                  onClick={() => handleTogglePublish(d.id)}
                  style={{
                    background: d.is_published ? '#f1f5f9' : '#10b981',
                    color: d.is_published ? '#475569' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {d.is_published ? <EyeOff size={13} /> : <Eye size={13} />}
                  {d.is_published ? 'Unpublish' : 'Publish'}
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {d.pdf_url && (
                    <a
                      href={d.pdf_url.startsWith('http') ? d.pdf_url : `${API_BASE || 'http://localhost:8000'}${d.pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    >
                      <FileText size={13} /> PDF
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(d.id, d.title)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── CREATE DATESHEET MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Create Examination Datesheet</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Term 1 Mid-Term Examination 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Grade / Class *</label>
                  <input
                    type="text"
                    required
                    placeholder="10, 9, etc."
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Section</label>
                  <input
                    type="text"
                    placeholder="ALL, A, B"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Academic Year</label>
                  <input
                    type="text"
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Attach Official PDF (Optional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadPdf}
                  style={{ display: 'block', marginTop: '4px', fontSize: '13px' }}
                />
                {form.pdf_url && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ PDF Attached</span>}
              </div>

              {/* Subject Schedule Rows */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Subjects & Timetable</label>
                  <button
                    type="button"
                    onClick={handleAddEntry}
                    style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Subject
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {form.entries.map((entry, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr auto', gap: '6px', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
                      <input
                        type="text"
                        placeholder="Subject Name"
                        required
                        value={entry.subject_name}
                        onChange={(e) => handleEntryChange(idx, 'subject_name', e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Code"
                        value={entry.subject_code}
                        onChange={(e) => handleEntryChange(idx, 'subject_code', e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <input
                        type="date"
                        required
                        value={entry.exam_date}
                        onChange={(e) => handleEntryChange(idx, 'exam_date', e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Start"
                        value={entry.start_time}
                        onChange={(e) => handleEntryChange(idx, 'start_time', e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="End"
                        value={entry.end_time}
                        onChange={(e) => handleEntryChange(idx, 'end_time', e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      {form.entries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEntry(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Datesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AI DATESHEET DOCUMENT PARSER MODAL ── */}
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
              maxWidth: '840px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              background: '#fff',
            }}
          >
            {/* Modal Header */}
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
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    AI Parse Examination Datesheet (PDF / Image)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Upload an exam routine or timetable document. Gemini AI automatically detects subjects, exam dates, and timings.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {aiError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={18} color="#EF4444" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Class Target & Academic Year Selector */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Target Class:</label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    {['6', '7', '8', '9', '10', '11', '12', 'ALL'].map((g) => (
                      <option key={g} value={g}>Class {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Dropzone */}
              {!parsedDatesheet && (
                <div
                  onDragEnter={handleAiDrag}
                  onDragOver={handleAiDrag}
                  onDragLeave={handleAiDrag}
                  onDrop={handleAiDrop}
                  style={{
                    border: `2px dashed ${dragActive ? '#6366F1' : '#cbd5e1'}`,
                    borderRadius: '12px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: dragActive ? 'rgba(99,102,241,0.04)' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => document.getElementById('aiDatesheetInput')?.click()}
                >
                  <input
                    id="aiDatesheetInput"
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelectAiFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(99,102,241,0.1)',
                      color: '#6366F1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto',
                    }}
                  >
                    <UploadCloud size={24} />
                  </div>
                  {aiFile ? (
                    <div>
                      <div style={{ fontWeight: 700, color: '#10B981', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Check size={16} /> {aiFile.name} ({(aiFile.size / 1024).toFixed(1)} KB)
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Ready to extract! Click "Run AI Schedule Extraction" below.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>
                        Click to browse or drop Datesheet PDF / Image here
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Supports official PDF schedules, circulars, or scanned timetable images
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extraction Progress Indicator */}
              {parsingAi && (
                <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#6366F1' }} />
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                    Gemini AI is parsing examination dates and papers...
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Extracting subject codes, dates, timings, and venues
                  </div>
                </div>
              )}

              {/* Parsed Schedule Preview */}
              {parsedDatesheet && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>
                        {parsedDatesheet.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Target: Class {parsedDatesheet.grade} • {parsedDatesheet.entries.length} Examination Papers Detected
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setParsedDatesheet(null)}
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      Re-upload
                    </button>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>Subject</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>Code</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>Exam Date</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>Time</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>Venue / Hall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedDatesheet.entries.map((entry, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px 14px', fontWeight: 600, color: '#1e293b' }}>
                              {entry.subject_name}
                            </td>
                            <td style={{ padding: '8px 14px', color: '#64748b' }}>
                              {entry.subject_code || '--'}
                            </td>
                            <td style={{ padding: '8px 14px', fontWeight: 600, color: '#4F46E5' }}>
                              {entry.exam_date}
                            </td>
                            <td style={{ padding: '8px 14px', color: '#475569' }}>
                              {entry.start_time} - {entry.end_time}
                            </td>
                            <td style={{ padding: '8px 14px', color: '#64748b' }}>
                              {entry.venue || 'Exam Hall'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>

              {!parsedDatesheet ? (
                <button
                  type="button"
                  onClick={handleRunAiParse}
                  disabled={!aiFile || parsingAi}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={14} /> Run AI Schedule Extraction
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCommitAiDatesheet}
                  disabled={creatingFromAi}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#10B981',
                    fontWeight: 700,
                  }}
                >
                  <Check size={14} /> {creatingFromAi ? 'Publishing...' : 'Publish Extracted Datesheet'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
