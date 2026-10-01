import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  UserCheck, CheckCircle2, AlertCircle, Check, X, RefreshCw, Smartphone,
  Key, Shield, Users, Copy, Plus, Send, Search
} from 'lucide-react';

export default function PendingProfileQueue({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('link_requests'); // 'link_requests' | 'profile_edits' | 'link_codes'
  
  // Link Requests State
  const [linkRequests, setLinkRequests] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  
  // Profile Edits State
  const [profileRequests, setProfileRequests] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Link Codes State
  const [parentCodes, setParentCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [generatingCodes, setGeneratingCodes] = useState(false);

  // Status message
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadAllQueues();
  }, []);

  const loadAllQueues = () => {
    loadLinkRequests();
    loadProfileRequests();
    loadCodes();
  };

  const loadLinkRequests = async () => {
    setLoadingLinks(true);
    try {
      const data = await api.getPendingLinkRequests();
      setLinkRequests(data || []);
    } catch (err) {
      console.error('Failed to load pending link requests', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const loadProfileRequests = async () => {
    setLoadingProfiles(true);
    try {
      const data = await api.getAdminProfileChangeRequests();
      setProfileRequests(data || []);
    } catch (err) {
      console.error('Failed to load profile requests', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadCodes = async () => {
    setLoadingCodes(true);
    try {
      const data = await api.listParentCodes({ grade: selectedGrade, section: selectedSection });
      setParentCodes(data || []);
    } catch (err) {
      console.error('Failed to load codes', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'link_codes') {
      loadCodes();
    }
  }, [selectedGrade, selectedSection, activeSubTab]);

  // Handle Link Approval & Rejection
  const handleApproveLink = async (id, studentName) => {
    try {
      const res = await api.approveParentLinkRequest(id);
      setMessage(res.message || `Parent link approved for ${studentName}`);
      setError(null);
      loadLinkRequests();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Link approval failed');
    }
  };

  const handleRejectLink = async (id) => {
    const reason = window.prompt('Specify reason for declining this link request:', 'Unverified parent identity');
    if (reason === null) return;
    try {
      const res = await api.rejectParentLinkRequest(id, reason);
      setMessage(res.message || 'Parent link request declined');
      setError(null);
      loadLinkRequests();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Link rejection failed');
    }
  };

  // Handle Profile Edits Approval & Rejection
  const handleApproveProfile = async (id) => {
    try {
      const res = await api.approveProfileChange(id);
      setMessage(res.message || 'Profile change approved');
      setError(null);
      loadProfileRequests();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Approval failed');
    }
  };

  const handleRejectProfile = async (id) => {
    const reason = window.prompt('Specify reason for declining this profile change:', 'Unverified contact detail');
    if (reason === null) return;
    try {
      const res = await api.rejectProfileChange(id, reason);
      setMessage(res.message || 'Profile change declined');
      setError(null);
      loadProfileRequests();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Rejection failed');
    }
  };

  // Handle Batch Code Generation
  const handleGenerateClassCodes = async () => {
    setGeneratingCodes(true);
    try {
      const res = await api.generateClassParentCodes({ grade: selectedGrade, section: selectedSection });
      setMessage(`Generated link codes for ${res.total || 0} students in Class ${selectedGrade}-${selectedSection}`);
      setError(null);
      loadCodes();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to generate codes');
    } finally {
      setGeneratingCodes(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px', background: 'var(--bg-card)', padding: '20px',
        borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Parent Verification & Security Hub
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Manage student-parent security linkages, approve profile modifications, and issue parental link codes for your school.
            </p>
          </div>
        </div>

        <button
          onClick={loadAllQueues}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
        >
          <RefreshCw size={14} className={loadingLinks || loadingProfiles ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Global Alerts */}
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

      {/* Internal Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveSubTab('link_requests')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            fontWeight: 700, fontSize: '13.5px', cursor: 'pointer',
            color: activeSubTab === 'link_requests' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 'link_requests' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-2px'
          }}
        >
          <UserCheck size={16} />
          Pending Parent Links
          {linkRequests.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 800 }}>
              {linkRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('profile_edits')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            fontWeight: 700, fontSize: '13.5px', cursor: 'pointer',
            color: activeSubTab === 'profile_edits' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 'profile_edits' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-2px'
          }}
        >
          <Smartphone size={16} />
          Guardian Profile Changes
          {profileRequests.length > 0 && (
            <span style={{ background: '#f59e0b', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 800 }}>
              {profileRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('link_codes')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            fontWeight: 700, fontSize: '13.5px', cursor: 'pointer',
            color: activeSubTab === 'link_codes' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 'link_codes' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-2px'
          }}
        >
          <Key size={16} />
          Issue Parent Link Codes
        </button>
      </div>

      {/* ── Sub-Tab 1: Pending Parent-Student Links ── */}
      {activeSubTab === 'link_requests' && (
        <div className="tech-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                Unverified Parent Link Queue ({linkRequests.length})
              </strong>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Parents who attempted to connect to a student without a link code or whose mobile number didn't match the student record.
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '14px 18px' }}>Parent User</th>
                <th style={{ padding: '14px 18px' }}>Target Student</th>
                <th style={{ padding: '14px 18px' }}>Claimed Relation</th>
                <th style={{ padding: '14px 18px' }}>Requested At</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {linkRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    ✓ All parent connections for your school are verified. No unverified link requests pending.
                  </td>
                </tr>
              ) : (
                linkRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.parent_name || 'Parent User'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{req.parent_email}</div>
                      <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>Ph: {req.parent_phone}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.student_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Adm No: {req.admission_no} • Class {req.grade}-{req.section}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                        {req.relation || 'Guardian'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '12px' }}>
                      {req.created_at ? new Date(req.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleApproveLink(req.id, req.student_name)}
                          style={{
                            background: '#10b981', color: '#fff', border: 'none',
                            borderRadius: '6px', padding: '6px 14px', fontWeight: 700,
                            fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <Check size={14} /> Approve Link
                        </button>
                        <button
                          onClick={() => handleRejectLink(req.id)}
                          style={{
                            background: '#ef4444', color: '#fff', border: 'none',
                            borderRadius: '6px', padding: '6px 14px', fontWeight: 700,
                            fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sub-Tab 2: Guardian Profile Changes ── */}
      {activeSubTab === 'profile_edits' && (
        <div className="tech-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              Guardian Profile Modification Requests ({profileRequests.length})
            </strong>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Changes requested by parents to emergency contacts, residential address, or primary phone numbers.
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '14px 18px' }}>Student</th>
                <th style={{ padding: '14px 18px' }}>Guardian</th>
                <th style={{ padding: '14px 18px' }}>Field</th>
                <th style={{ padding: '14px 18px' }}>Current Value</th>
                <th style={{ padding: '14px 18px' }}>Requested New Value</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {profileRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No pending profile change requests. All records are up to date!
                  </td>
                </tr>
              ) : (
                profileRequests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {r.student_name}
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Class {r.grade}-{r.section}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#334155' }}>
                      {r.parent_name}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {r.field_name === 'primary_phone' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '11px', border: '1px solid #fde68a' }}>
                          <Smartphone size={12} /> Primary Mobile
                        </span>
                      ) : (
                        <span style={{ fontWeight: 600, color: 'var(--primary, #635bff)' }}>
                          {r.field_name.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#ef4444', textDecoration: 'line-through', fontFamily: r.field_name === 'primary_phone' ? 'monospace' : 'inherit' }}>
                      {r.old_value || 'None'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#15803d', fontWeight: 700, fontFamily: r.field_name === 'primary_phone' ? 'monospace' : 'inherit' }}>
                      {r.field_name === 'primary_phone' ? `+91 ${r.new_value}` : r.new_value}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleApproveProfile(r.id)}
                          style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectProfile(r.id)}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sub-Tab 3: Issue Parent Link Codes ── */}
      {activeSubTab === 'link_codes' && (
        <div className="tech-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Class Parent Link Codes
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Share these 6-character alphanumeric link codes with parents during orientation or via SMS for instant auto-verification.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>Grade:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="form-input"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  {['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>Section:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="form-input"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  {['A', 'B', 'C', 'D'].map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateClassCodes}
                disabled={generatingCodes}
                className="btn-primary"
                style={{ fontSize: '12.5px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              >
                <Plus size={14} />
                {generatingCodes ? 'Generating...' : 'Generate Missing Codes'}
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 18px' }}>Student Name</th>
                  <th style={{ padding: '12px 18px' }}>Admission No</th>
                  <th style={{ padding: '12px 18px' }}>Class / Sec</th>
                  <th style={{ padding: '12px 18px' }}>Parent Link Code</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Copy Code</th>
                </tr>
              </thead>
              <tbody>
                {loadingCodes ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      Loading class link codes...
                    </td>
                  </tr>
                ) : parentCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No link codes found for Class {selectedGrade}-{selectedSection}. Click "Generate Missing Codes" above to issue codes.
                    </td>
                  </tr>
                ) : (
                  parentCodes.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {c.student_name}
                      </td>
                      <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: '#475569' }}>
                        {c.admission_no}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#64748b' }}>
                        Class {c.grade}-{c.section}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          fontFamily: 'monospace', fontWeight: 800, fontSize: '14px',
                          background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px',
                          color: '#4338ca', letterSpacing: '1px', border: '1px solid #cbd5e1'
                        }}>
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {c.is_used ? (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            Linked ({c.relation || 'Parent'})
                          </span>
                        ) : (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            Unused / Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleCopyCode(c.code)}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Copy Link Code to clipboard"
                        >
                          <Copy size={13} />
                          {copiedCode === c.code ? 'Copied!' : 'Copy'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
