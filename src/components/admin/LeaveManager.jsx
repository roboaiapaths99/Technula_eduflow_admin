import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { FileCheck, CheckCircle2, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';

export default function LeaveManager({ schoolId }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.getPendingLeaves(schoolId);
      setLeaves(res || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load pending leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadLeaves();
  }, [schoolId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingLeave) return;
    try {
      const res = await api.reviewLeave(reviewingLeave.id, {
        status: reviewStatus,
        remarks: reviewRemarks,
      });
      setMessage(res.message);
      setReviewingLeave(null);
      setReviewRemarks('');
      loadLeaves();
    } catch (err) {
      setError(err.message || 'Failed to review leave application');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        padding: '18px 24px',
        background: 'var(--card-bg, #fff)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Digital Leave Application Inbox ({leaves.length} Pending)
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Approving student leave automatically updates their attendance register to 'Approved Leave' and protects risk metrics.
          </p>
        </div>
      </div>

      {message && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="tech-card" style={{ padding: '24px' }}>
        {leaves.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {leaves.map((l) => (
              <div
                key={l.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                      {l.student_name}
                    </span>
                    <span className="pill pill-primary" style={{ fontSize: '11px' }}>
                      Class {l.grade}-{l.section}
                    </span>
                    <span className="pill pill-warning" style={{ fontSize: '11px' }}>
                      {l.leave_type}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px' }}>
                    <strong>Dates: </strong>{l.from_date} to {l.to_date} ({l.days_count} {l.days_count === 1 ? 'day' : 'days'})
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <strong>Reason: </strong>"{l.reason}"
                  </div>

                  {l.attachment_url && (
                    <div style={{ marginTop: '6px' }}>
                      <a
                        href={l.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileText size={13} /> View Attached Medical Certificate / Note
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setReviewingLeave(l); setReviewStatus('APPROVED'); }}
                    className="btn-primary"
                    style={{ background: '#16a34a', borderColor: '#16a34a', padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <CheckCircle2 size={14} /> Approve Leave
                  </button>
                  <button
                    onClick={() => { setReviewingLeave(l); setReviewStatus('REJECTED'); }}
                    className="btn-secondary"
                    style={{ color: '#dc2626', padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No pending leave applications. All student and faculty requests have been processed.
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingLeave && (
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
            maxWidth: '440px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>
              {reviewStatus === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              For <strong>{reviewingLeave.student_name}</strong> (Class {reviewingLeave.grade}-{reviewingLeave.section})
              from {reviewingLeave.from_date} to {reviewingLeave.to_date}.
            </p>

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Decision Remarks / Notes</label>
                <textarea
                  placeholder={reviewStatus === 'APPROVED' ? 'e.g. Approved. Please complete missed homework.' : 'Reason for rejection'}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', background: reviewStatus === 'APPROVED' ? '#16a34a' : '#dc2626' }}
                >
                  Confirm {reviewStatus === 'APPROVED' ? 'Approval & Sync Attendance' : 'Rejection'}
                </button>
                <button type="button" onClick={() => setReviewingLeave(null)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
