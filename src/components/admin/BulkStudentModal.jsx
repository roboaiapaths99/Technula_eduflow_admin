import React, { useState } from 'react';
import { api } from '../../api';
import { Upload, CheckCircle2, AlertCircle, X, FileText, ArrowRight } from 'lucide-react';

const SAMPLE_CSV = `name,admission_no,grade,section,roll_no,gender,father_name,parent_phone,blood_group,address
Kavita Sen,ADM-2026-051,10,A,11,Female,Vikram Sen,9876543210,B+,42 MG Road Bengaluru
Deepak Joshi,ADM-2026-052,10,A,12,Male,Sunil Joshi,9876543211,O+,15 Indiranagar Bengaluru
Meera Nair,ADM-2026-053,10,B,1,Female,Ramesh Nair,9876543212,A+,88 Koramangala Bengaluru
Arjun Mehta,ADM-2026-054,10,B,2,Male,Rajesh Mehta,9876543213,AB+,24 Whitefield Bengaluru`;

export default function BulkStudentModal({ schoolId, onClose, onSuccess }) {
  const [stage, setStage] = useState(1); // 1 = input & validate, 2 = review & commit
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);

  const parseCsvToObjects = (text) => {
    const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map((v) => v.trim());
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = vals[idx] || '';
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    setError(null);
    setValidating(true);
    try {
      const rows = parseCsvToObjects(csvText);
      if (rows.length === 0) {
        throw new Error('Please enter valid CSV with at least one data row.');
      }
      const res = await api.validateBulkStudents({ rows });
      setValidationResult(res);
      setStage(2);
    } catch (err) {
      setError(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleCommit = async () => {
    if (!validationResult || !validationResult.valid_rows || validationResult.valid_rows.length === 0) {
      setError('No valid rows available to import.');
      return;
    }
    setCommitting(true);
    setError(null);
    try {
      const res = await api.commitBulkStudents({ rows: validationResult.valid_rows });
      onSuccess(res.message);
      onClose();
    } catch (err) {
      setError(err.message || 'Commit failed');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
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
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              2-Stage Smart Student Bulk Onboarding
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Stage {stage} of 2: {stage === 1 ? 'Data Ingestion & Dry-Run Validation' : 'Review & Transactional Commit'}
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* STAGE 1: INPUT & VALIDATE */}
        {stage === 1 && (
          <form onSubmit={handleValidate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>Paste CSV Data or Sample</label>
                <button
                  type="button"
                  onClick={() => setCsvText(SAMPLE_CSV)}
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  Load Sample Roster
                </button>
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="input-field"
                style={{ width: '100%', minHeight: '180px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.4' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Required headers: <code>name,admission_no,grade,section</code>. Optional: <code>roll_no,gender,father_name,parent_phone,blood_group,address</code>.
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
              <strong>Automatic Parent Account Provisioning:</strong> Any row containing a valid 10-digit <code>parent_phone</code> will automatically provision a parent account linked to that student.
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={validating}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {validating ? 'Running Dry-Run Validation...' : 'Validate Roster (Dry Run)'} <ArrowRight size={16} />
              </button>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '12px 18px' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* STAGE 2: REVIEW & TRANSACTIONAL COMMIT */}
        {stage === 2 && validationResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} color="#16a34a" />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#166534' }}>{validationResult.valid_count} Ready</div>
                  <div style={{ fontSize: '11px', color: '#166534' }}>Valid students ready for enrollment</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: validationResult.error_count > 0 ? '#fef2f2' : '#f8fafc', border: `1px solid ${validationResult.error_count > 0 ? '#fecaca' : '#e2e8f0'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={24} color={validationResult.error_count > 0 ? '#dc2626' : '#94a3b8'} />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: validationResult.error_count > 0 ? '#991b1b' : '#64748b' }}>{validationResult.error_count} Issues</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Duplicate or malformed rows</div>
                </div>
              </div>
            </div>

            {/* Error Table if any */}
            {validationResult.errors && validationResult.errors.length > 0 && (
              <div style={{ border: '1px solid #fecaca', background: '#fff5f5', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#991b1b', marginBottom: '8px' }}>
                  Action Required on Invalid Rows:
                </div>
                <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', color: '#7f1d1d' }}>
                  {validationResult.errors.map((e, idx) => (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                      Row {e.row} ({e.admission_no}): {e.errors.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid Rows Preview */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>
                Valid Rows to Commit ({validationResult.valid_count} Students):
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '6px 10px' }}>Name</th>
                      <th style={{ padding: '6px 10px' }}>Adm No</th>
                      <th style={{ padding: '6px 10px' }}>Class</th>
                      <th style={{ padding: '6px 10px' }}>Parent Phone</th>
                      <th style={{ padding: '6px 10px' }}>Blood Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.valid_rows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.name}</td>
                        <td style={{ padding: '6px 10px', color: 'var(--primary)' }}>{r.admission_no}</td>
                        <td style={{ padding: '6px 10px' }}>Class {r.grade}-{r.section}</td>
                        <td style={{ padding: '6px 10px' }}>{r.father_phone || 'None'}</td>
                        <td style={{ padding: '6px 10px' }}>{r.blood_group || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stage 2 Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleCommit}
                disabled={committing || validationResult.valid_count === 0}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 800 }}
              >
                {committing ? 'Committing to Live Database...' : `Confirm & Commit ${validationResult.valid_count} Students`}
              </button>
              <button
                type="button"
                onClick={() => setStage(1)}
                className="btn-secondary"
                style={{ padding: '12px 18px' }}
              >
                Back to Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
