import React, { useState, useEffect } from 'react';
import { api, setToken, setUser } from '../../api';
import {
  Building2, Users, Shield, AlertTriangle, CheckCircle, XCircle, Search,
  Plus, Edit3, Trash2, LogIn, RefreshCw, Activity, ArrowUpRight, Lock,
  FileText, Clock, Key, Eye, EyeOff, Filter, BarChart3, Settings, CreditCard
} from 'lucide-react';

export default function SuperAdminDashboard({ user, onImpersonateSuccess }) {
  const [activeTab, setActiveTab] = useState('schools'); // schools | subscriptions | audit_logs
  const [stats, setStats] = useState(null);
  const [schools, setSchools] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // New School Form State
  const [newSchool, setNewSchool] = useState({
    name: '',
    board: 'CBSE',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });

  // Edit School Limits Form State
  const [editForm, setEditForm] = useState({
    name: '',
    board: '',
    city: '',
    state: '',
    phone: '',
    max_students: 500,
    max_teachers: 50,
    subscription_plan: 'starter',
  });

  const showToast = (msg, isError = false) => {
    setToastMsg({ text: msg, isError });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, schoolsRes] = await Promise.all([
        api.getSuperAdminStats().catch(() => null),
        api.listSuperAdminSchools({ search: searchTerm, status: statusFilter }).catch(() => []),
      ]);
      if (statsRes) setStats(statsRes);
      if (schoolsRes) setSchools(schoolsRes);

      if (activeTab === 'audit_logs') {
        const logsRes = await api.getSuperAdminAuditLogs().catch(() => []);
        setAuditLogs(logsRes);
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleImpersonate = async (school) => {
    if (!window.confirm(`Are you sure you want to impersonate ${school.name}? You will enter their admin command center.`)) return;
    try {
      setActionLoading(true);
      const res = await api.impersonateSchool(school.id);
      setToken(res.access_token);
      setUser(res.user);
      showToast(`Impersonating ${school.name} as ${res.user.full_name}`);
      if (onImpersonateSuccess) {
        onImpersonateSuccess(res.user);
      } else {
        window.location.reload();
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!selectedSchool) return;
    try {
      setActionLoading(true);
      if (selectedSchool.is_suspended) {
        await api.activateSchool(selectedSchool.id);
        showToast(`School '${selectedSchool.name}' reactivated successfully`);
      } else {
        await api.suspendSchool(selectedSchool.id, suspendReason || 'Administrative suspension');
        showToast(`School '${selectedSchool.name}' suspended`, true);
      }
      setIsSuspendModalOpen(false);
      setSuspendReason('');
      setSelectedSchool(null);
      loadData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProvisionSchool = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.registerSchool(newSchool);
      showToast(`School '${newSchool.name}' onboarded successfully!`);
      setIsProvisionModalOpen(false);
      setNewSchool({
        name: '',
        board: 'CBSE',
        address: '',
        city: '',
        state: '',
        phone: '',
        email: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
      });
      loadData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedSchool) return;
    try {
      setActionLoading(true);
      await api.updateSuperAdminSchool(selectedSchool.id, editForm);
      if (editForm.subscription_plan) {
        await api.overrideSchoolPlan(selectedSchool.id, { plan_tier: editForm.subscription_plan }).catch(() => {});
      }
      showToast(`School '${selectedSchool.name}' limits & subscription plan updated`);
      setIsEditModalOpen(false);
      setSelectedSchool(null);
      loadData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toastMsg.isError ? '#ef4444' : '#10b981', color: '#fff',
          padding: '12px 20px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toastMsg.isError ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {toastMsg.text}
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: '16px', padding: '28px 32px', color: '#fff', marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        boxShadow: '0 12px 32px rgba(49, 46, 129, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '8px' }}>
              <Shield size={24} color="#a5b4fc" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#c7d2fe' }}>
              SaaS Platform Owner Command Center
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 4px', color: '#fff' }}>
            Multi-School Enterprise Management
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#e0e7ff', opacity: 0.9 }}>
            Secure multi-tenant isolation, cross-school analytics, suspension guards, and parent security governance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => loadData()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
              borderRadius: '8px', background: 'rgba(255,255,255,0.12)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
            }}
          >
            <RefreshCw size={15} /> Refresh Data
          </button>
          <button
            onClick={() => setIsProvisionModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
              borderRadius: '8px', background: '#38bdf8', color: '#0f172a',
              border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)'
            }}
          >
            <Plus size={16} /> Onboard New School
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Total Schools</span>
              <div style={{ background: '#e0e7ff', padding: '8px', borderRadius: '8px', color: '#4338ca' }}><Building2 size={18} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>{stats.total_schools || 0}</div>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '4px' }}>
              {stats.active_schools || 0} Active • {stats.suspended_schools || 0} Suspended
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Total Students</span>
              <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '8px', color: '#15803d' }}><Users size={18} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>{stats.total_students || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Enrolled across all tenants</div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Teachers & Staff</span>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#b45309' }}><Activity size={18} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>{stats.total_teachers || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Active faculty members</div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Active Subscriptions</span>
              <div style={{ background: '#eef2ff', padding: '8px', borderRadius: '8px', color: '#4338ca' }}><CreditCard size={18} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>{stats.active_schools || schools.filter(s => s.is_active).length || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Institutional licenses active</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('schools')}
          style={{
            padding: '12px 20px', border: 'none', background: 'transparent',
            fontWeight: activeTab === 'schools' ? '700' : '600',
            color: activeTab === 'schools' ? '#4338ca' : 'var(--text-muted)',
            borderBottom: activeTab === 'schools' ? '3px solid #4338ca' : '3px solid transparent',
            cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <Building2 size={17} /> School Tenants ({schools.length})
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          style={{
            padding: '12px 20px', border: 'none', background: 'transparent',
            fontWeight: activeTab === 'subscriptions' ? '700' : '600',
            color: activeTab === 'subscriptions' ? '#4338ca' : 'var(--text-muted)',
            borderBottom: activeTab === 'subscriptions' ? '3px solid #4338ca' : '3px solid transparent',
            cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <CreditCard size={17} /> SaaS Subscriptions & Billing
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          style={{
            padding: '12px 20px', border: 'none', background: 'transparent',
            fontWeight: activeTab === 'audit_logs' ? '700' : '600',
            color: activeTab === 'audit_logs' ? '#4338ca' : 'var(--text-muted)',
            borderBottom: activeTab === 'audit_logs' ? '3px solid #4338ca' : '3px solid transparent',
            cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <FileText size={17} /> Platform Audit Trail
        </button>
      </div>

      {/* Tab 1: School Tenants */}
      {activeTab === 'schools' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by school name, city, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                    fontSize: '13px', color: 'var(--text-main)'
                  }}
                />
              </div>
              <button type="submit" style={{ padding: '10px 16px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                Search
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)', fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer'
                }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* Schools Table */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: '600' }}>School Details</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Board & Location</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Enrolled Students</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Faculty</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No schools found matching your search.
                    </td>
                  </tr>
                ) : (
                  schools.map((school) => (
                    <tr key={school.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '8px',
                            background: school.logo_url ? `url(${school.logo_url}) center/cover` : '#e0e7ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#4338ca', fontWeight: '800', fontSize: '15px'
                          }}>
                            {!school.logo_url && (school.name ? school.name.charAt(0).toUpperCase() : 'S')}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>{school.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{school.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{school.board || 'CBSE'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {[school.city, school.state].filter(Boolean).join(', ') || 'India'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          {school.student_count || 0} / {school.max_students || 500}
                        </div>
                        <div style={{ width: '80px', height: '5px', background: '#e2e8f0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, ((school.student_count || 0) / (school.max_students || 500)) * 100)}%`,
                            height: '100%', background: '#4338ca'
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {school.teacher_count || 0} / {school.max_teachers || 50}
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        {school.is_suspended ? (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> Suspended
                          </span>
                        ) : (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            title="Impersonate School Admin"
                            onClick={() => handleImpersonate(school)}
                            disabled={actionLoading || school.is_suspended}
                            style={{
                              padding: '7px 12px', background: school.is_suspended ? '#cbd5e1' : '#4338ca',
                              color: '#fff', border: 'none', borderRadius: '6px', cursor: school.is_suspended ? 'not-allowed' : 'pointer',
                              fontWeight: '600', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <LogIn size={13} /> Impersonate
                          </button>

                          <button
                            title="Edit Limits & Quotas"
                            onClick={() => {
                              setSelectedSchool(school);
                              setEditForm({
                                name: school.name,
                                board: school.board || 'CBSE',
                                city: school.city || '',
                                state: school.state || '',
                                phone: school.phone || '',
                                max_students: school.max_students || 500,
                                max_teachers: school.max_teachers || 50,
                                subscription_plan: school.subscription_plan || 'starter',
                              });
                              setIsEditModalOpen(true);
                            }}
                            style={{
                              padding: '7px 10px', background: 'var(--bg-main)',
                              color: 'var(--text-main)', border: '1px solid var(--border-color)',
                              borderRadius: '6px', cursor: 'pointer'
                            }}
                          >
                            <Settings size={14} />
                          </button>

                          <button
                            title={school.is_suspended ? "Reactivate School" : "Suspend School"}
                            onClick={() => {
                              setSelectedSchool(school);
                              setIsSuspendModalOpen(true);
                            }}
                            style={{
                              padding: '7px 10px', background: school.is_suspended ? '#dcfce7' : '#fee2e2',
                              color: school.is_suspended ? '#15803d' : '#b91c1c',
                              border: 'none', borderRadius: '6px', cursor: 'pointer'
                            }}
                          >
                            {school.is_suspended ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: SaaS Subscriptions & Billing */}
      {activeTab === 'subscriptions' && (
        <div>
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <CreditCard size={22} color="#4338ca" />
            <div style={{ fontSize: '13px', color: '#312e81' }}>
              <strong>Multi-Tenant Institutional Subscriptions:</strong> Monitor active plans, student capacity quotas, billing cycles, and license compliance across all connected school institutions.
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>
                  Institutional License & Subscription Roster
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                  ({schools.length} total institutions)
                </span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 20px' }}>Institution</th>
                  <th style={{ padding: '12px 16px' }}>Current Plan</th>
                  <th style={{ padding: '12px 16px' }}>Student Quota</th>
                  <th style={{ padding: '12px 16px' }}>Faculty Quota</th>
                  <th style={{ padding: '12px 16px' }}>Billing Status</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No school institutions registered yet.
                    </td>
                  </tr>
                ) : (
                  schools.map((sch) => {
                    const plan = sch.subscription_plan || 'starter';
                    const isEnterprise = plan === 'enterprise';
                    const isGrowth = plan === 'growth';
                    return (
                      <tr key={sch.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{sch.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Code: {sch.code} • {sch.board || 'CBSE'}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            background: isEnterprise ? 'rgba(168, 85, 247, 0.12)' : isGrowth ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                            color: isEnterprise ? '#7e22ce' : isGrowth ? '#2563eb' : '#475569',
                            border: `1px solid ${isEnterprise ? 'rgba(168, 85, 247, 0.3)' : isGrowth ? 'rgba(59, 130, 246, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                          }}>
                            {plan}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                            {sch.student_count || 0} / {isEnterprise ? 'Unlimited' : isGrowth ? '1,500' : '400'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enrolled Students</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                            {sch.teacher_count || 0} / {isEnterprise ? 'Unlimited' : isGrowth ? '75' : '20'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Faculty Members</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: sch.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: sch.is_active ? '#059669' : '#dc2626'
                          }}>
                            {sch.is_active ? '● Active License' : '○ Suspended'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenEdit(sch)}
                            style={{
                              padding: '6px 14px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '12px',
                              color: '#334155'
                            }}
                          >
                            Modify Plan
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Platform Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>
            Real-Time SaaS Audit Trail & Security Events
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 20px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Action & Resource</th>
                <th style={{ padding: '12px 16px' }}>Actor User</th>
                <th style={{ padding: '12px 16px' }}>School Tenant</th>
                <th style={{ padding: '12px 20px' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: log.action.includes('IMPERSONATE') ? '#fef3c7' : (log.action.includes('DELETE') ? '#fee2e2' : '#e0e7ff'),
                        color: log.action.includes('IMPERSONATE') ? '#b45309' : (log.action.includes('DELETE') ? '#b91c1c' : '#4338ca'),
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700'
                      }}>
                        {log.action}
                      </span>
                      <span style={{ marginLeft: '8px', color: 'var(--text-main)' }}>{log.resource_type}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main)' }}>
                      {log.user_email || 'System'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {log.school_id || 'Platform'}
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision School Modal */}
      {isProvisionModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', padding: '28px', border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 16px', color: 'var(--text-main)' }}>
              Onboard New School Tenant
            </h2>
            <form onSubmit={handleProvisionSchool}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>School Name *</label>
                  <input
                    required
                    type="text"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                    placeholder="e.g. Cambridge International School"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Education Board *</label>
                  <select
                    value={newSchool.board}
                    onChange={(e) => setNewSchool({ ...newSchool, board: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State Board">State Board</option>
                    <option value="IB">IB / International</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Official School Email *</label>
                  <input
                    required
                    type="email"
                    value={newSchool.email}
                    onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                    placeholder="admin@cambridge.edu"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>City</label>
                  <input
                    type="text"
                    value={newSchool.city}
                    onChange={(e) => setNewSchool({ ...newSchool, city: e.target.value })}
                    placeholder="e.g. New Delhi"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>State</label>
                  <input
                    type="text"
                    value={newSchool.state}
                    onChange={(e) => setNewSchool({ ...newSchool, state: e.target.value })}
                    placeholder="e.g. Delhi"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-main)' }}>Principal / Admin Credentials</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Principal Name *</label>
                    <input
                      required
                      type="text"
                      value={newSchool.admin_name}
                      onChange={(e) => setNewSchool({ ...newSchool, admin_name: e.target.value })}
                      placeholder="Dr. Rajesh Sharma"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Admin Login Email *</label>
                    <input
                      required
                      type="email"
                      value={newSchool.admin_email}
                      onChange={(e) => setNewSchool({ ...newSchool, admin_email: e.target.value })}
                      placeholder="principal@cambridge.edu"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Admin Password *</label>
                    <input
                      required
                      type="password"
                      value={newSchool.admin_password}
                      onChange={(e) => setNewSchool({ ...newSchool, admin_password: e.target.value })}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '10px 22px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                >
                  {actionLoading ? 'Creating...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit School Quotas Modal */}
      {isEditModalOpen && selectedSchool && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '500px',
            padding: '28px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px', color: 'var(--text-main)' }}>
              Configure Limits: {selectedSchool.name}
            </h2>
            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Max Students Quota</label>
                  <input
                    type="number"
                    value={editForm.max_students}
                    onChange={(e) => setEditForm({ ...editForm, max_students: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Max Faculty Quota</label>
                  <input
                    type="number"
                    value={editForm.max_teachers}
                    onChange={(e) => setEditForm({ ...editForm, max_teachers: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  SaaS Subscription Plan Tier Override
                </label>
                <select
                  value={editForm.subscription_plan || 'starter'}
                  onChange={(e) => setEditForm({ ...editForm, subscription_plan: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '13px' }}
                >
                  <option value="starter">Starter Tier (Trial / Free / Basic Features)</option>
                  <option value="growth">Growth Tier (₹1,999/mo - Fees, Leave, PTC, Bulk Upload)</option>
                  <option value="enterprise">Enterprise Tier (₹4,999/mo - All Features, Advanced Risk Engine, OCR)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '10px 22px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      {isSuspendModalOpen && selectedSchool && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '480px',
            padding: '28px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: selectedSchool.is_suspended ? '#dcfce7' : '#fee2e2', padding: '10px', borderRadius: '10px' }}>
                {selectedSchool.is_suspended ? <CheckCircle size={24} color="#15803d" /> : <AlertTriangle size={24} color="#b91c1c" />}
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                  {selectedSchool.is_suspended ? 'Reactivate School Account' : 'Suspend School Tenant'}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedSchool.name}</div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 16px' }}>
              {selectedSchool.is_suspended
                ? 'Reactivating this school will immediately restore dashboard and mobile app access for all faculty, students, and parents.'
                : 'Suspending this school will immediately block all logins from teachers, admins, and parents for this school.'}
            </p>

            {!selectedSchool.is_suspended && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Suspension Reason</label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Subscription expired, non-payment, compliance review"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '13px' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsSuspendModalOpen(false)}
                style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspendToggle}
                disabled={actionLoading}
                style={{
                  padding: '10px 22px',
                  background: selectedSchool.is_suspended ? '#10b981' : '#ef4444',
                  color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700'
                }}
              >
                {selectedSchool.is_suspended ? 'Confirm Reactivation' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
