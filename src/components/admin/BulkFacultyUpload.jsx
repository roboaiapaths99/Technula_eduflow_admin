import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  KeyRound,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react';
import { api } from '../../api';

export default function BulkFacultyUpload({ schoolId, onClose = () => {}, onSuccess = () => {} }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a standard CSV file (.csv format).');
      return;
    }
    setError(null);
    setResult(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setError('CSV file is empty or missing data rows.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const cells = line.split(',').map((c) => c.trim());
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cells[idx] || '';
        });
        return rowObj;
      });

      // Submit to backend dry-run preview endpoint
      setValidating(true);
      try {
        const previewRes = await api.previewFacultyBulk({ rows });
        setPreviewData(previewRes);
      } catch (err) {
        setError(err.message || 'Validation failed for the uploaded CSV.');
      } finally {
        setValidating(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.valid_rows || previewData.valid_rows.length === 0) return;
    setCommitting(true);
    setError(null);
    try {
      const commitRes = await api.commitFacultyBulk({ rows: previewData.valid_rows });
      setResult(commitRes);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to commit faculty batch to database.');
    } finally {
      setCommitting(false);
    }
  };

  const handleCopyCredentials = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="tech-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.02) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Bulk Faculty & Staff Ingestion
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Batch register teachers, class leads, and staff with full contacts and class assignments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ borderRadius: '8px', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div
              style={{
                padding: '14px 18px',
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
              <AlertCircle size={18} color="#EF4444" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Step 1: Upload or Download Template */}
          {!result && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  1. Download CSV Template or Upload Completed Roster
                </span>
                <a
                  href={api.downloadFacultyCsvTemplate()}
                  download="faculty_upload_template.csv"
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Download Sample Template
                </a>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: '14px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: dragActive ? 'rgba(99,102,241,0.04)' : '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <UploadCloud
                  size={42}
                  style={{ color: dragActive ? 'var(--primary)' : '#94A3B8', margin: '0 auto 12px auto' }}
                />
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {file ? file.name : 'Click to browse or drop Faculty CSV file here'}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports CSV with full_name, email, phone, role, assigned_grade, assigned_section, subject_name
                </p>
              </div>
            </div>
          )}

          {/* 2. Validation Preview Section */}
          {validating && (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Validating faculty roster & checking staff quota...</div>
            </div>
          )}

          {previewData && !result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>TOTAL ROWS</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                    {previewData.total_rows}
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>VALID FACULTY</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#065F46', marginTop: '2px' }}>
                    {previewData.valid_count}
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '10px', background: previewData.error_count > 0 ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${previewData.error_count > 0 ? '#FECACA' : '#E2E8F0'}` }}>
                  <div style={{ fontSize: '11px', color: previewData.error_count > 0 ? '#B91C1C' : '#64748B', fontWeight: 700 }}>ERRORS / INVALID</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: previewData.error_count > 0 ? '#991B1B' : '#1E293B', marginTop: '2px' }}>
                    {previewData.error_count}
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                  <div style={{ fontSize: '11px', color: '#4338CA', fontWeight: 700 }}>STAFF QUOTA</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#3730A3', marginTop: '4px' }}>
                    {previewData.current_staff}/{previewData.max_staff} Active
                  </div>
                </div>
              </div>

              {/* Error messages if any */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div style={{ padding: '14px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', marginBottom: '6px' }}>
                    ⚠️ {previewData.errors.length} Rows Have Errors (will be skipped during import):
                  </div>
                  <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewData.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: '11.5px', color: '#B45309' }}>
                        Row {err.row} ({err.name}): {err.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                  Valid Faculty Roster to be Created ({previewData.valid_rows.length}):
                </span>
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Educator Name</th>
                        <th style={{ padding: '10px 12px' }}>Official Email</th>
                        <th style={{ padding: '10px 12px' }}>Contact</th>
                        <th style={{ padding: '10px 12px' }}>Role</th>
                        <th style={{ padding: '10px 12px' }}>Class Lead</th>
                        <th style={{ padding: '10px 12px' }}>Subject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.valid_rows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{row.full_name}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{row.email}</td>
                          <td style={{ padding: '8px 12px' }}>{row.phone || '—'}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span className="pill pill-primary" style={{ fontSize: '10px' }}>
                              {row.role}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {row.assigned_grade ? `Class ${row.assigned_grade}-${row.assigned_section || 'A'}` : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{row.subject_name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => { setFile(null); setPreviewData(null); }}
                  className="btn-secondary"
                  disabled={committing}
                >
                  Clear & Re-upload
                </button>
                <button
                  onClick={handleCommit}
                  className="btn-primary"
                  disabled={committing || previewData.valid_rows.length === 0 || previewData.exceeds_quota}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {committing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Enrolling Faculty...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirm & Enroll {previewData.valid_rows.length} Faculty
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. Success / Completed View */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  padding: '24px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                  border: '1px solid #A7F3D0',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '27px',
                    background: '#10B981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    boxShadow: '0 8px 16px rgba(16,185,129,0.3)',
                  }}
                >
                  <Check size={28} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#065F46', margin: 0 }}>
                  Faculty Enrollment Complete! 🎉
                </h4>
                <p style={{ fontSize: '13px', color: '#047857', marginTop: '6px' }}>
                  {result.message}
                </p>
              </div>

              {/* Initial Credentials List */}
              {result.credentials && result.credentials.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Initial Access Credentials (Default Password: <code style={{ color: 'var(--primary)' }}>Faculty@123</code>):
                    </span>
                    <button
                      onClick={() => {
                        const summary = result.credentials
                          .map((c) => `${c.name} | Email: ${c.email} | Phone: ${c.phone} | Role: ${c.role} | Password: ${c.initial_password}`)
                          .join('\n');
                        handleCopyCredentials(summary, 'all');
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedIndex === 'all' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedIndex === 'all' ? 'Copied All!' : 'Copy All Credentials'}
                    </button>
                  </div>

                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Educator</th>
                          <th style={{ padding: '8px 12px' }}>Email</th>
                          <th style={{ padding: '8px 12px' }}>Mobile</th>
                          <th style={{ padding: '8px 12px' }}>Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.credentials.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700 }}>{c.name}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{c.email}</td>
                            <td style={{ padding: '8px 12px' }}>{c.phone}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>
                              {c.initial_password}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={onClose}
                  className="btn-primary"
                  style={{ padding: '8px 24px' }}
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
