import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  BookOpen, Plus, Trash2, FileText, Upload, CheckCircle2,
  AlertCircle, Calendar, Clock, Download, X
} from 'lucide-react';

export default function AlmanacManager({ user }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: '',
    category: 'general',
    target_grade: 'ALL',
    academic_year: '2025-26',
    file_url: '',
    file_size: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminAlmanac();
      setDocs(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load almanac documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setForm(prev => ({
        ...prev,
        file_url: res.url,
        file_size: res.size || file.size,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
      setMessage('Document uploaded successfully.');
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file_url) {
      setError('Please upload a document file.');
      return;
    }
    setSaving(true);
    try {
      await api.createAlmanacDoc(form);
      setMessage(`Document "${form.title}" published to Almanac.`);
      setShowModal(false);
      setForm({
        title: '',
        category: 'general',
        target_grade: 'ALL',
        academic_year: '2025-26',
        file_url: '',
        file_size: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      });
      loadDocs();
    } catch (err) {
      setError(err.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}" from Almanac?`)) return;
    try {
      await api.deleteAlmanacDoc(id);
      setMessage('Document removed.');
      loadDocs();
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>School Almanac & Official Documents</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Publish student handbooks, rules, curriculum syllabi, and calendars with validity date windows.
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Upload Document
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

      {/* Documents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {docs.length === 0 ? (
          <div className="tech-card" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
            No documents in Almanac yet. Click "Upload Document" above.
          </div>
        ) : (
          docs.map((d) => (
            <div key={d.id} className="tech-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="pill" style={{
                    background: d.validity_status === 'active' ? '#dcfce7' : d.validity_status === 'upcoming' ? '#e0e7ff' : '#fee2e2',
                    color: d.validity_status === 'active' ? '#15803d' : d.validity_status === 'upcoming' ? '#4338ca' : '#b91c1c',
                    textTransform: 'uppercase',
                    fontSize: '11px',
                    fontWeight: 800
                  }}>
                    {d.validity_status}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>v{d.version}</span>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '12px 0 6px 0', color: 'var(--text-primary)' }}>
                  {d.title}
                </h4>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Category: <strong>{d.category.replace('_', ' ')}</strong> • Target: <strong>Class {d.target_grade}</strong>
                </div>

                <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  Validity: <strong>{d.valid_from}</strong> to <strong>{d.valid_to}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <a
                  href={d.file_url.startsWith('http') ? d.file_url : `${API_BASE || 'http://localhost:8000'}${d.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <Download size={13} /> View File
                </a>

                <button
                  onClick={() => handleDelete(d.id, d.title)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── UPLOAD DOCUMENT MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Publish Document to Almanac</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student Code of Conduct & Almanac 2025-26"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="rules">School Rules & Handbook</option>
                    <option value="syllabus">Curriculum & Syllabus</option>
                    <option value="holiday_list">Holiday Calendar</option>
                    <option value="event_calendar">Annual Event Schedule</option>
                    <option value="general">General Policy / Circular</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Target Class</label>
                  <input
                    type="text"
                    placeholder="ALL, 10, 9"
                    value={form.target_grade}
                    onChange={(e) => setForm({ ...form, target_grade: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Valid From *</label>
                  <input
                    type="date"
                    required
                    value={form.valid_from}
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Valid Until *</label>
                  <input
                    type="date"
                    required
                    value={form.valid_to}
                    onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Select File (PDF, DOCX) *</label>
                <input
                  type="file"
                  required={!form.file_url}
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: 'block', marginTop: '4px', fontSize: '13px' }}
                />
                {uploading && <span style={{ fontSize: '11px', color: '#635bff' }}>Uploading...</span>}
                {form.file_url && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ File Uploaded & Attached</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving || uploading} className="btn-primary">
                  {saving ? 'Publishing...' : 'Publish to Almanac'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
