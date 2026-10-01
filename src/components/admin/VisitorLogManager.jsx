import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Users, Plus, Search, CheckCircle2, AlertCircle, RefreshCw,
  Clock, ArrowUpRight, ArrowDownLeft, X, Filter
} from 'lucide-react';

export default function VisitorLogManager({ user }) {
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [logging, setLogging] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    visitor_name: '',
    visitor_phone: '',
    purpose: 'guest_meeting',
    person_to_meet: '',
    id_proof_type: 'Aadhaar',
    id_proof_number: '',
    gate_name: 'Main Gate',
    notes: '',
  });

  useEffect(() => {
    loadVisitors();
  }, [statusFilter]);

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const [logs, statData] = await Promise.all([
        api.getVisitorLogs({ status: statusFilter, search: search.trim() || undefined }),
        api.getVisitorStats().catch(() => null),
      ]);
      setVisitors(logs || []);
      setStats(statData);
    } catch (err) {
      setError(err.message || 'Failed to load visitors.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLogging(true);
    try {
      await api.logVisitor(form);
      setMessage(`Visitor ${form.visitor_name} checked in successfully.`);
      setShowModal(false);
      setForm({
        visitor_name: '',
        visitor_phone: '',
        purpose: 'guest_meeting',
        person_to_meet: '',
        id_proof_type: 'Aadhaar',
        id_proof_number: '',
        gate_name: 'Main Gate',
        notes: '',
      });
      loadVisitors();
    } catch (err) {
      setError(err.message || 'Check-in failed');
    } finally {
      setLogging(false);
    }
  };

  const handleCheckout = async (id, name) => {
    try {
      await api.checkoutVisitor(id);
      setMessage(`Visitor ${name} marked as departed.`);
      loadVisitors();
    } catch (err) {
      setError(err.message || 'Checkout failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controls & KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="tech-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Currently On Campus</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
            {stats?.currently_on_campus ?? 0}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Active badge holders</span>
        </div>

        <div className="tech-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Visitors Today</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#1e293b', marginTop: '4px' }}>
            {stats?.total_visitors_today ?? 0}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Walk-ins & scheduled meets</span>
        </div>

        <div className="tech-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Checked Out</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#64748b', marginTop: '4px' }}>
            {stats?.checked_out_today ?? 0}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Safely departed campus</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Today' },
            { id: 'checked_in', label: 'Currently On Campus' },
            { id: 'checked_out', label: 'Departed' },
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
                color: statusFilter === tab.id ? '#fff' : '#475569',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search visitor or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadVisitors()}
              style={{ padding: '8px 12px 8px 30px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '200px' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          </div>

          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Log Visitor
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

      {/* Visitor Roster Table */}
      <div className="tech-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '14px 18px' }}>Visitor</th>
              <th style={{ padding: '14px 18px' }}>Contact</th>
              <th style={{ padding: '14px 18px' }}>Purpose</th>
              <th style={{ padding: '14px 18px' }}>Meeting With</th>
              <th style={{ padding: '14px 18px' }}>Check-In</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  No visitor records found.
                </td>
              </tr>
            ) : (
              visitors.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                    {v.visitor_name}
                    {v.id_proof_type && (
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>
                        {v.id_proof_type}: {v.id_proof_number || 'Verified'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#475569' }}>
                    {v.visitor_phone}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#334155' }}>
                      {v.purpose.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#334155' }}>
                    {v.person_to_meet || (v.student_name ? `${v.student_name} (${v.student_grade})` : '-')}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b' }}>
                    {new Date(v.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                      background: v.status === 'checked_in' ? '#dcfce7' : '#f1f5f9',
                      color: v.status === 'checked_in' ? '#15803d' : '#64748b'
                    }}>
                      {v.status === 'checked_in' ? 'ON CAMPUS' : 'DEPARTED'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {v.status === 'checked_in' && (
                      <button
                        onClick={() => handleCheckout(v.id, v.visitor_name)}
                        style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Check-Out
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── LOG VISITOR MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Check In Visitor</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.visitor_name}
                  onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={form.visitor_phone}
                  onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Purpose</label>
                  <select
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="guest_meeting">Parent / Teacher Meet</option>
                    <option value="admissions">Admission Inquiry</option>
                    <option value="vendor_delivery">Vendor / Delivery</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="parent_pickup">Child Pickup</option>
                    <option value="other">Official Guest</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Person to Meet</label>
                  <input
                    type="text"
                    placeholder="e.g. Principal"
                    value={form.person_to_meet}
                    onChange={(e) => setForm({ ...form, person_to_meet: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>ID Proof Type</label>
                  <select
                    value={form.id_proof_type}
                    onChange={(e) => setForm({ ...form, id_proof_type: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Company ID">Company ID</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>ID Number</label>
                  <input
                    type="text"
                    value={form.id_proof_number}
                    onChange={(e) => setForm({ ...form, id_proof_number: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={logging} className="btn-primary">
                  {logging ? 'Registering...' : 'Register Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
