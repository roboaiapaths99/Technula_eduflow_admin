import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  ShieldCheck, QrCode, Plus, Clock, CheckCircle2, AlertCircle,
  X, User, ArrowUpRight, ArrowDownLeft, Printer, Download, RefreshCw
} from 'lucide-react';

export default function GatePassCenter({ user, studentId, studentInfo }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPassForQr, setSelectedPassForQr] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    pass_type: 'early_leave',
    accompanied_by_name: '',
    accompanied_by_relation: 'Mother',
    visitor_photo_url: '',
    reason: '',
    expected_out_time: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16),
    expected_return_time: '',
  });

  useEffect(() => {
    if (studentId) loadPasses();
  }, [studentId]);

  const loadPasses = async () => {
    setLoading(true);
    try {
      const data = await api.getParentGatePasses(studentId);
      setPasses(data || []);
      // Check for active pass
      const active = (data || []).find(p => ['requested', 'approved', 'out'].includes(p.status));
      if (active) setSelectedPassForQr(active);
    } catch (err) {
      setError(err.message || 'Failed to load gate passes.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await api.uploadFile(file);
      setForm(prev => ({ ...prev, visitor_photo_url: res.url }));
      setMessage('Visitor photo attached.');
    } catch (err) {
      setError(err.message || 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        student_id: studentId,
        ...form,
        expected_out_time: new Date(form.expected_out_time).toISOString(),
        expected_return_time: form.expected_return_time ? new Date(form.expected_return_time).toISOString() : undefined,
      };
      const res = await api.requestGatePass(payload);
      setMessage(res.message);
      setShowRequestModal(false);
      setForm({
        pass_type: 'early_leave',
        accompanied_by_name: '',
        accompanied_by_relation: 'Mother',
        visitor_photo_url: '',
        reason: '',
        expected_out_time: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16),
        expected_return_time: '',
      });
      loadPasses();
    } catch (err) {
      setError(err.message || 'Failed to submit gate pass request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPass = async (passId) => {
    if (!window.confirm('Cancel this pending gate pass request?')) return;
    try {
      await api.cancelGatePass(passId);
      setMessage('Pass request cancelled.');
      loadPasses();
    } catch (err) {
      setError(err.message || 'Failed to cancel pass');
    }
  };

  const activePass = passes.find(p => ['requested', 'approved', 'out'].includes(p.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with New Request action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Digital Campus Gate Pass</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Request early departure or authorized visitor pickup with one-time verified QR tokens.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Request New Gate Pass
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

      {/* ── ACTIVE PASS HERO CARD ── */}
      {activePass ? (
        <div className="tech-card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pill" style={{
                background:
                  activePass.status === 'approved' ? '#10b981' :
                  activePass.status === 'out' ? '#f59e0b' : '#635bff',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                {activePass.status === 'approved' ? '✓ APPROVED & READY FOR EXIT' :
                 activePass.status === 'out' ? '● CURRENTLY OFF CAMPUS' : 'PENDING ADMIN APPROVAL'}
              </span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>Code: {activePass.pass_code}</span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '10px 0 4px 0' }}>
              {activePass.student_name}
            </h2>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              Accompanied By: <strong>{activePass.accompanied_by_name}</strong> ({activePass.accompanied_by_relation})
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '6px' }}>
              Expected Departure: <strong>{new Date(activePass.expected_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              {activePass.expected_return_time && (
                <span> • Expected Return: <strong>{new Date(activePass.expected_return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
              )}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              {activePass.status === 'approved' && (
                <button
                  onClick={() => setSelectedPassForQr(activePass)}
                  style={{
                    background: '#fff',
                    color: '#1e1b4b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <QrCode size={16} /> View Gate QR Pass
                </button>
              )}

              {activePass.status === 'requested' && (
                <button
                  onClick={() => handleCancelPass(activePass.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel Request
                </button>
              )}
            </div>
          </div>

          {/* Quick QR Preview Box */}
          {activePass.status === 'approved' && (
            <div style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#000',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                background: '#f8fafc',
                border: '2px dashed #635bff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                margin: '0 auto',
                padding: '4px'
              }}>
                <QrCode size={70} color="#0f172a" />
                <span style={{ fontSize: '9px', fontWeight: 800, marginTop: '4px', letterSpacing: '0.5px' }}>
                  {activePass.pass_code}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                Present at Gate Scanner
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tech-card" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          No active gate passes currently in progress for this student.
        </div>
      )}

      {/* ── PASS HISTORY LIST ── */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800 }}>Gate Pass History</h4>
        <div className="tech-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 16px' }}>Code</th>
                <th style={{ padding: '12px 16px' }}>Accompanied By</th>
                <th style={{ padding: '12px 16px' }}>Reason</th>
                <th style={{ padding: '12px 16px' }}>Out Time</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>QR Pass</th>
              </tr>
            </thead>
            <tbody>
              {passes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No previous gate pass history.
                  </td>
                </tr>
              ) : (
                passes.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary, #635bff)' }}>
                      {p.pass_code}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {p.accompanied_by_name} ({p.accompanied_by_relation})
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '200px' }}>
                      {p.reason}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {p.actual_out_time ? new Date(p.actual_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(p.expected_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background:
                          p.status === 'requested' ? '#fef3c7' :
                          p.status === 'approved' ? '#dcfce7' :
                          p.status === 'out' ? '#fed7aa' :
                          p.status === 'returned' ? '#e0e7ff' : '#fee2e2',
                        color:
                          p.status === 'requested' ? '#b45309' :
                          p.status === 'approved' ? '#15803d' :
                          p.status === 'out' ? '#c2410c' :
                          p.status === 'returned' ? '#4338ca' : '#b91c1c',
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {p.status === 'approved' && (
                        <button
                          onClick={() => setSelectedPassForQr(p)}
                          style={{
                            background: 'var(--primary-light, #e0e7ff)',
                            color: 'var(--primary, #635bff)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View QR
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── QR PASS MODAL ── */}
      {selectedPassForQr && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            maxWidth: '380px',
            width: '100%',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedPassForQr(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', marginBottom: '8px' }}>
              <ShieldCheck size={28} />
            </div>

            <h3 style={{ margin: '4px 0 2px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Verified Campus Gate Pass
            </h3>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{user?.school_name || 'Technula EduFlow'}</div>

            {/* QR Code Container */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '20px',
              margin: '20px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <QrCode size={160} color="#1e1b4b" />
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary, #635bff)', marginTop: '12px', letterSpacing: '1px' }}>
                {selectedPassForQr.pass_code}
              </div>
            </div>

            <div style={{ textAlign: 'left', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', color: '#475569' }}>
              <div>Student: <strong>{selectedPassForQr.student_name}</strong></div>
              <div style={{ marginTop: '3px' }}>Accompanied: <strong>{selectedPassForQr.accompanied_by_name} ({selectedPassForQr.accompanied_by_relation})</strong></div>
              <div style={{ marginTop: '3px' }}>Expected Exit: <strong>{new Date(selectedPassForQr.expected_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
            </div>

            <button
              onClick={() => window.print()}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Print / Save Pass
            </button>
          </div>
        </div>
      )}

      {/* ── REQUEST PASS MODAL ── */}
      {showRequestModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Request Gate Pass</h3>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Pass Type</label>
                <select
                  value={form.pass_type}
                  onChange={(e) => setForm({ ...form, pass_type: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                >
                  <option value="early_leave">Early Departure / Pickup</option>
                  <option value="visitor_pickup">Authorized Visitor / Driver Pickup</option>
                  <option value="outing">School Outing / Competition</option>
                  <option value="medical_emergency">Medical Emergency</option>
                  <option value="other">Other Official Reason</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Accompanied By (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={form.accompanied_by_name}
                    onChange={(e) => setForm({ ...form, accompanied_by_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Relationship *</label>
                  <select
                    value={form.accompanied_by_relation}
                    onChange={(e) => setForm({ ...form, accompanied_by_relation: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Driver">Authorized Driver</option>
                    <option value="Relative">Grandparent / Relative</option>
                    <option value="Self">Self (Senior Student)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Expected Exit Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.expected_out_time}
                    onChange={(e) => setForm({ ...form, expected_out_time: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Expected Return (Optional)</label>
                  <input
                    type="datetime-local"
                    value={form.expected_return_time}
                    onChange={(e) => setForm({ ...form, expected_return_time: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Reason for Gate Pass *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the reason (e.g. Doctor appointment, family function)..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Visitor Photo / ID Attachment (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  style={{ display: 'block', marginTop: '4px', fontSize: '13px' }}
                />
                {uploadingPhoto && <span style={{ fontSize: '11px', color: '#635bff' }}>Uploading...</span>}
                {form.visitor_photo_url && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ Photo Attached</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting || uploadingPhoto} className="btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Gate Pass Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
