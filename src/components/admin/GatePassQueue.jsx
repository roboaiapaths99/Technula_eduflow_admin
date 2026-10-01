import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  ShieldCheck, Search, CheckCircle2, AlertCircle, Clock,
  ArrowUpRight, ArrowDownLeft, RefreshCw, X, Filter, Check, User
} from 'lucide-react';

export default function GatePassQueue({ user }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Reject modal state
  const [rejectingPassId, setRejectingPassId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPasses(true);
    const interval = setInterval(() => {
      loadPasses(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadPasses = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await api.getAdminGatePassQueue({
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setPasses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load gate passes.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleApprove = async (passId, passCode) => {
    try {
      await api.approveGatePass(passId);
      setMessage(`Gate pass ${passCode} APPROVED. Parent notified via WhatsApp/In-App.`);
      loadPasses();
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to approve pass.');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingPassId) return;
    try {
      await api.rejectGatePass(rejectingPassId, rejectionReason);
      setMessage(`Gate pass rejected. Parent notified.`);
      setRejectingPassId(null);
      setRejectionReason('');
      loadPasses();
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to reject pass.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controls & Status Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'requested', label: 'Pending Approval' },
            { id: 'approved', label: 'Approved (Awaiting Exit)' },
            { id: 'out', label: 'Currently Out' },
            { id: 'returned', label: 'Safely Returned' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                background: statusFilter === tab.id ? 'var(--primary, #635bff)' : '#fff',
                color: statusFilter === tab.id ? '#fff' : 'var(--text-secondary, #475569)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by student or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadPasses()}
              style={{
                padding: '8px 12px 8px 32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                width: '200px'
              }}
            />
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          </div>
          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#dcfce7', padding: '6px 10px', borderRadius: '6px' }}>
            ● Live Sync (12s)
          </span>
          <button
            onClick={() => loadPasses(true)}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
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

      {/* Passes Table */}
      <div className="tech-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '14px 18px' }}>Pass Code</th>
              <th style={{ padding: '14px 18px' }}>Student</th>
              <th style={{ padding: '14px 18px' }}>Accompanied By</th>
              <th style={{ padding: '14px 18px' }}>Reason & Timings</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {passes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No gate pass records found matching filter "{statusFilter}".
                </td>
              </tr>
            ) : (
              passes.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--primary, #635bff)' }}>
                    {p.pass_code}
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.student_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Class {p.student_grade}-{p.student_section} • Adm #{p.student_admission_no}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{p.accompanied_by_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Relation: {p.accompanied_by_relation} • Phone: {p.parent_phone || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', maxWidth: '280px' }}>
                    <div style={{ color: '#334155', fontWeight: 500 }}>{p.reason}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Expected Out: <strong>{new Date(p.expected_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      {p.expected_return_time && (
                        <span> • Return: <strong>{new Date(p.expected_return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background:
                        p.status === 'requested' ? '#fef3c7' :
                        p.status === 'approved' ? '#dcfce7' :
                        p.status === 'out' ? '#fed7aa' :
                        p.status === 'returned' ? '#e0e7ff' :
                        p.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                      color:
                        p.status === 'requested' ? '#b45309' :
                        p.status === 'approved' ? '#15803d' :
                        p.status === 'out' ? '#c2410c' :
                        p.status === 'returned' ? '#4338ca' :
                        p.status === 'rejected' ? '#b91c1c' : '#475569',
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {p.status === 'requested' ? (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleApprove(p.id, p.pass_code)}
                          style={{
                            background: '#10b981', color: '#fff', border: 'none',
                            borderRadius: '6px', padding: '6px 12px', fontWeight: 700,
                            fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectingPassId(p.id)}
                          style={{
                            background: '#ef4444', color: '#fff', border: 'none',
                            borderRadius: '6px', padding: '6px 12px', fontWeight: 700,
                            fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Processed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── REJECTION REASON MODAL ── */}
      {rejectingPassId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 800 }}>Decline Gate Pass</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
              Please specify the administrative reason. This will be sent directly to the guardian's notification inbox and WhatsApp.
            </p>
            <form onSubmit={handleReject}>
              <textarea
                required
                rows={3}
                placeholder="Reason for declining pass (e.g., scheduled exam in session, unauthorized guardian)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setRejectingPassId(null)}
                  className="btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
