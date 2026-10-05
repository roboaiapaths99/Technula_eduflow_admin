import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  ShieldCheck, RefreshCw, Clock, User, Phone,
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

export default function TeacherGatePass({ user, grade, section }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPasses();
    const interval = setInterval(loadPasses, 12000); // 12-sec live sync
    return () => clearInterval(interval);
  }, [grade, section]);

  const loadPasses = async () => {
    try {
      const data = await api.getTeacherClassGatePasses?.(grade, section) ||
        await (async () => {
          const res = await fetch(`${api.API_BASE || 'http://localhost:8000'}/gate-passes/teacher/class?grade=${grade}&section=${section}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('technulaeduflow_token')}` }
          });
          return res.json();
        })();

      setPasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load class gate passes');
    } finally {
      setLoading(false);
    }
  };

  const filteredPasses = passes.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.student_name?.toLowerCase().includes(q) ||
        p.pass_code?.toLowerCase().includes(q) ||
        p.accompanied_by_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
        return <span className="pill pill-amber">⏳ Pending Admin Approval</span>;
      case 'approved':
        return <span className="pill pill-emerald">✓ Approved (At Gate)</span>;
      case 'out':
        return <span className="pill" style={{ background: '#fce7f3', color: '#be185d', fontWeight: 700 }}>🚶 Exited Campus</span>;
      case 'returned':
        return <span className="pill" style={{ background: '#e0e7ff', color: '#4338ca', fontWeight: 700 }}>↩ Safely Returned</span>;
      case 'rejected':
        return <span className="pill pill-rose">✗ Rejected</span>;
      case 'expired':
        return <span className="pill" style={{ background: '#f1f5f9', color: '#64748b' }}>⌛ Expired</span>;
      default:
        return <span className="pill">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
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
            Class {grade}-{section} Student Gate Pass Log
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time security exit tracking: know when your students are on campus, exited, or picked up.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Live 12s Auto-Sync
          </span>
          <button onClick={loadPasses} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'requested', label: 'Pending Approval' },
            { id: 'approved', label: 'Approved' },
            { id: 'out', label: 'Currently Out' },
            { id: 'returned', label: 'Returned' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={statusFilter === tab.id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search student or pass code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ width: '220px', fontSize: '12px' }}
        />
      </div>

      {/* Passes List */}
      {loading && passes.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Checking student passes...</div>
      ) : filteredPasses.length === 0 ? (
        <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <ShieldCheck size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Gate Passes Found</h4>
          <p style={{ margin: 0, fontSize: '13px' }}>No student departure or visitor pickup requests for Class {grade}-{section}.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredPasses.map(p => (
            <div key={p.id} className="tech-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>
                    {p.pass_code}
                  </span>
                  {getStatusBadge(p.status)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontWeight: 800, fontSize: '14px', overflow: 'hidden' }}>
                    {p.student_photo ? (
                      <img src={p.student_photo} alt={p.student_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      p.student_name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {p.student_name}
                    </h4>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Class {p.student_grade}-{p.student_section} • Parent: {p.parent_name}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <strong>Accompanied By:</strong> {p.accompanied_by_name} ({p.accompanied_by_relation})
                  </div>
                  <div>
                    <strong>Reason:</strong> {p.reason}
                  </div>
                  <div>
                    <strong>Expected Out:</strong> {new Date(p.expected_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {p.actual_out_time && (
                    <div style={{ color: '#be185d', fontWeight: 700 }}>
                      🚶 Left Campus At: {new Date(p.actual_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {p.actual_return_time && (
                    <div style={{ color: '#15803d', fontWeight: 700 }}>
                      ↩ Returned At: {new Date(p.actual_return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
                Requested {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
