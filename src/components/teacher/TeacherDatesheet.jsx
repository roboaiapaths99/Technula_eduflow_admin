import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  CalendarDays, Plus, Trash2, CheckCircle2, AlertCircle, FileText,
  Upload, X, Check, Eye, Clock, MapPin, Send
} from 'lucide-react';

export default function TeacherDatesheet({ user, grade, section }) {
  const [datesheets, setDatesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [form, setForm] = useState({
    title: '',
    grade: grade || '',
    section: section || '',
    academic_year: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
    pdf_url: '',
    entries: [
      { subject_name: 'Mathematics', subject_code: 'MTH-101', exam_date: '', start_time: '09:30 AM', end_time: '12:30 PM', venue: 'Room 101', syllabus_remarks: 'Units 1 to 5' }
    ]
  });

  useEffect(() => {
    setForm(prev => ({ ...prev, grade, section }));
    loadDatesheets();
  }, [grade, section]);

  const loadDatesheets = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDatesheets();
      // Filter for current teacher's grade
      const filtered = (data || []).filter(
        d => (d.grade === grade || d.grade === 'ALL') && (d.section === section || d.section === 'ALL')
      );
      setDatesheets(filtered);
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
        { subject_name: '', subject_code: '', exam_date: '', start_time: '09:30 AM', end_time: '12:30 PM', venue: `Room ${grade}01`, syllabus_remarks: '' }
      ]
    }));
  };

  const handleRemoveEntry = (index) => {
    setForm(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index)
    }));
  };

  const handleEntryChange = (index, field, value) => {
    setForm(prev => {
      const copy = [...prev.entries];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, entries: copy };
    });
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const res = await api.uploadFile(file);
      setForm(prev => ({ ...prev, pdf_url: res.file_url }));
    } catch (err) {
      alert('Failed to upload PDF: ' + err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSave = async (publishImmediately = false) => {
    if (!form.title.trim()) {
      alert('Please enter examination title');
      return;
    }
    setSaving(true);
    try {
      const res = await api.createDatesheet({
        ...form,
        grade,
        section,
      });

      if (publishImmediately && res.datesheet_id) {
        await api.togglePublishDatesheet(res.datesheet_id);
        setMessage(`Datesheet "${form.title}" saved, PUBLISHED, and broadcasted to Class ${grade}-${section} parents!`);
      } else {
        setMessage(`Datesheet "${form.title}" saved in draft mode.`);
      }

      setShowModal(false);
      loadDatesheets();
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to save datesheet');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (ds) => {
    try {
      const res = await api.togglePublishDatesheet(ds.id);
      setMessage(res.message);
      loadDatesheets();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete datesheet "${title}"?`)) return;
    try {
      await api.deleteDatesheet(id);
      setMessage('Datesheet deleted.');
      loadDatesheets();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="tech-card" style={{
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Exam Datesheets & Timetables
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Author and publish official exam schedules for <strong>Class {grade}-{section}</strong> students.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({
              title: '',
              grade,
              section,
              academic_year: '2025-26',
              pdf_url: '',
              entries: [
                { subject_name: 'Mathematics', subject_code: 'MTH-101', exam_date: new Date().toISOString().split('T')[0], start_time: '09:30 AM', end_time: '12:30 PM', venue: `Room ${grade}01`, syllabus_remarks: 'Complete Term Syllabus' }
              ]
            });
            setShowModal(true);
          }}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Create Class Datesheet
        </button>
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

      {/* Datesheets List */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading datesheets...</div>
      ) : datesheets.length === 0 ? (
        <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <CalendarDays size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Datesheets Created for Class {grade}-{section}</h4>
          <p style={{ margin: 0, fontSize: '13px' }}>Click "Create Class Datesheet" to build an exam timetable or upload a PDF schedule.</p>
        </div>
      ) : (
        datesheets.map((ds) => (
          <div key={ds.id} className="tech-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {ds.title}
                  </h4>
                  <span className={`pill ${ds.is_published ? 'pill-emerald' : 'pill-amber'}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                    {ds.is_published ? '● Published to Parents' : '○ Draft Mode'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Class {ds.grade}-{ds.section} • Academic Year {ds.academic_year} • {ds.entries_count} Subject Exam(s)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {ds.pdf_url && (
                  <a
                    href={ds.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <FileText size={13} /> View Attached PDF
                  </a>
                )}
                <button
                  onClick={() => handleTogglePublish(ds)}
                  className={ds.is_published ? 'btn-secondary' : 'btn-primary'}
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Send size={13} /> {ds.is_published ? 'Unpublish' : 'Publish to Parents'}
                </button>
                <button
                  onClick={() => handleDelete(ds.id, ds.title)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Entries Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Subject</th>
                    <th style={{ padding: '8px 12px' }}>Date</th>
                    <th style={{ padding: '8px 12px' }}>Timing</th>
                    <th style={{ padding: '8px 12px' }}>Venue</th>
                    <th style={{ padding: '8px 12px' }}>Syllabus / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {ds.entries.map((e, idx) => (
                    <tr key={e.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {e.subject_name} {e.subject_code ? `(${e.subject_code})` : ''}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>
                        {e.exam_date}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {e.start_time} - {e.end_time}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {e.venue || '-'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {e.syllabus_remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* ── CREATE DATESHEET MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Create Exam Datesheet (Class {grade}-{section})</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Exam Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Term 1 Mid-Term Examination 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Attach Official PDF (Optional)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                  <input type="file" accept=".pdf,image/*" onChange={handlePdfUpload} style={{ fontSize: '12px' }} />
                  {uploadingPdf && <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Uploading...</span>}
                  {form.pdf_url && <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓ Attached</span>}
                </div>
              </div>

              {/* Entries builder */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Subject Examination Schedule</label>
                  <button type="button" onClick={handleAddEntry} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                    + Add Subject
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {form.entries.map((entry, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Subject Name (e.g. Science)"
                          value={entry.subject_name}
                          onChange={(e) => handleEntryChange(idx, 'subject_name', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '12px' }}
                        />
                        <input
                          type="text"
                          placeholder="Code"
                          value={entry.subject_code}
                          onChange={(e) => handleEntryChange(idx, 'subject_code', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '12px' }}
                        />
                        <input
                          type="date"
                          value={entry.exam_date}
                          onChange={(e) => handleEntryChange(idx, 'exam_date', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '12px' }}
                        />
                        <button type="button" onClick={() => handleRemoveEntry(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Start (09:30 AM)"
                          value={entry.start_time}
                          onChange={(e) => handleEntryChange(idx, 'start_time', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '11px' }}
                        />
                        <input
                          type="text"
                          placeholder="End (12:30 PM)"
                          value={entry.end_time}
                          onChange={(e) => handleEntryChange(idx, 'end_time', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '11px' }}
                        />
                        <input
                          type="text"
                          placeholder="Venue / Room"
                          value={entry.venue}
                          onChange={(e) => handleEntryChange(idx, 'venue', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '11px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="btn-primary"
                  style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} /> {saving ? 'Publishing...' : 'Publish & Broadcast to Parents'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
