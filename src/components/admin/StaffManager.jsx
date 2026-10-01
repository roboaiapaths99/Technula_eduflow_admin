import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Lock,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  Filter,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api';

const DEFAULT_ROLES = [
  { id: 'teacher', label: 'Teacher / Faculty', color: '#2563eb', bg: '#eff6ff' },
  { id: 'staff', label: 'Staff / Office', color: '#4f46e5', bg: '#eef2ff' },
  { id: 'accountant', label: 'Accountant / Cashier', color: '#059669', bg: '#ecfdf5' },
  { id: 'principal', label: 'Principal', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'vice_principal', label: 'Vice Principal', color: '#9333ea', bg: '#faf5ff' },
  { id: 'librarian', label: 'Librarian', color: '#d97706', bg: '#fffbeb' },
  { id: 'counselor', label: 'Student Counselor', color: '#0891b2', bg: '#ecfeff' },
  { id: 'admin', label: 'School Admin', color: '#dc2626', bg: '#fef2f2' },
];

export const SYSTEM_MODULES = [
  { key: 'attendance', label: 'Attendance Management', category: 'Classroom', icon: '📋', desc: 'Take, mark, and edit daily student attendance sessions' },
  { key: 'marks', label: 'Exams & Marks Entry', category: 'Academics', icon: '📝', desc: 'Enter exam marks, grades, and generate student report cards' },
  { key: 'homework', label: 'Homework & Assignments', category: 'Classroom', icon: '📚', desc: 'Publish daily assignments and review student submissions' },
  { key: 'diary', label: 'Digital Student Diary', category: 'Classroom', icon: '📖', desc: 'Post daily circular notices, classroom remarks, and logs' },
  { key: 'timetable', label: 'Class Timetable Scheduling', category: 'Academics', icon: '🗓️', desc: 'View, assign, and modify master school periods & timetable' },
  { key: 'calendar', label: 'Calendar & Event Holidays', category: 'Campus', icon: '📅', desc: 'Manage school events, annual calendar, and official holidays' },
  { key: 'gallery', label: 'Campus Photo Gallery', category: 'Campus', icon: '🖼️', desc: 'Upload activity pictures and curate albums for parents' },
  { key: 'gate_pass', label: 'Campus Gate Pass Log', category: 'Operations', icon: '🚪', desc: 'Issue, authorize, and verify digital student exit passes' },
  { key: 'announcements', label: 'Broadcast Announcements', category: 'Communication', icon: '📢', desc: 'Send mass announcements & emergency alerts to community' },
  { key: 'certificates', label: 'Student Certificates & Bonafide', category: 'Office', icon: '🎓', desc: 'Issue and verify transfer and bonafide certificates' },
  { key: 'fees', label: 'Fee Structures & Cashier Billing', category: 'Finance', icon: '💰', desc: 'Access fee structures, cashier desk, and issue receipts' },
  { key: 'students', label: 'Student Enrollment & Records', category: 'Office', icon: '👥', desc: 'Manage student directory, parent contacts, profile data' },
  { key: 'reports', label: 'Academic & Class Reports', category: 'Academics', icon: '📊', desc: 'View class averages, toppers, and subject mark trends' },
  { key: 'analytics', label: 'Institution Performance Analytics', category: 'Management', icon: '📈', desc: 'Access macro KPIs, attendance rates, and fee graphs' },
  { key: 'settings', label: 'School Profile & Settings', category: 'Management', icon: '⚙️', desc: 'Configure school affiliation, branding, and fee gateway' },
];

export default function StaffManager({ schoolId, onUpgradeClick }) {
  const [staffList, setStaffList] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [availableRoles, setAvailableRoles] = useState(DEFAULT_ROLES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [resettingPasswordStaff, setResettingPasswordStaff] = useState(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);
  const [sendingCredentialsId, setSendingCredentialsId] = useState(null);

  // Permissions state
  const [managingPermissionsStaff, setManagingPermissionsStaff] = useState(null);
  const [staffPermissions, setStaffPermissions] = useState({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'teacher',
    is_custom_role: false,
    custom_role_name: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, subRes, rolesRes] = await Promise.allSettled([
        api.adminListUsers(),
        api.getCurrentSubscription(),
        api.getAvailableRoles(),
      ]);

      if (usersRes.status === 'fulfilled') {
        const val = usersRes.value || {};
        const users = Array.isArray(val) ? val : (val.items || val.users || []);
        // Exclude pure parent or student roles from staff view
        const staff = users.filter((u) => u.role !== 'parent' && u.role !== 'student');
        setStaffList(staff);
      }

      if (subRes.status === 'fulfilled') {
        setSubscription(subRes.value);
      }

      if (rolesRes.status === 'fulfilled' && rolesRes.value?.roles) {
        // Merge fetched roles
        const merged = [...DEFAULT_ROLES];
        rolesRes.value.roles.forEach((r) => {
          if (!merged.some((mr) => mr.id === r.id)) {
            merged.push({
              id: r.id,
              label: r.label || r.id,
              color: '#0284c7',
              bg: '#f0f9ff',
            });
          }
        });
        setAvailableRoles(merged);
      }
    } catch (err) {
      console.error('Failed to load staff data:', err);
      setError('Unable to load staff directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const finalRole = formData.is_custom_role
        ? 'staff'
        : formData.role;
      const customRole = formData.is_custom_role
        ? formData.custom_role_name.trim().toLowerCase().replace(/\s+/g, '_')
        : (formData.role !== 'teacher' && formData.role !== 'staff' && formData.role !== 'admin' ? formData.role : undefined);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password || 'Staff@123',
        phone: formData.phone.trim() || undefined,
        role: finalRole,
        custom_role: customRole,
      };

      await api.adminCreateUser(payload);
      setSuccessMsg(`Credentials created for ${formData.name}!`);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'teacher',
        is_custom_role: false,
        custom_role_name: '',
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setError(null);
    setSubmitting(true);

    try {
      await api.updateAdminUser(editingStaff.id, {
        name: editingStaff.name,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role,
        custom_role: editingStaff.custom_role,
        is_active: editingStaff.is_active,
      });
      setSuccessMsg(`Updated profile for ${editingStaff.name}`);
      setEditingStaff(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resettingPasswordStaff || !newPassword) return;
    setError(null);
    setSubmitting(true);

    try {
      await api.resetUserPassword(resettingPasswordStaff.id, newPassword);
      setSuccessMsg(`Password reset successfully for ${resettingPasswordStaff.name}!`);
      setResettingPasswordStaff(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPermissions = (staff) => {
    setManagingPermissionsStaff(staff);
    const existing = staff.permissions || {};
    const initial = {};
    SYSTEM_MODULES.forEach((m) => {
      if (existing[m.key] !== undefined) {
        initial[m.key] = Boolean(existing[m.key]);
      } else {
        initial[m.key] = ['attendance', 'marks', 'homework', 'diary'].includes(m.key);
      }
    });
    setStaffPermissions(initial);
  };

  const handleApplyPreset = (presetType) => {
    const updated = {};
    SYSTEM_MODULES.forEach((m) => {
      if (presetType === 'all') {
        updated[m.key] = true;
      } else if (presetType === 'none') {
        updated[m.key] = false;
      } else if (presetType === 'teacher') {
        updated[m.key] = ['attendance', 'marks', 'homework', 'diary', 'reports'].includes(m.key);
      } else if (presetType === 'accountant') {
        updated[m.key] = ['fees', 'students', 'reports', 'analytics'].includes(m.key);
      } else if (presetType === 'front_desk') {
        updated[m.key] = ['gate_pass', 'calendar', 'announcements', 'students', 'certificates'].includes(m.key);
      }
    });
    setStaffPermissions(updated);
  };

  const handleSavePermissions = async () => {
    if (!managingPermissionsStaff) return;
    setSavingPermissions(true);
    setError(null);
    try {
      await api.adminUpdateUser(managingPermissionsStaff.id, {
        permissions: staffPermissions,
      });
      setSuccessMsg(`Feature access & permissions updated successfully for ${managingPermissionsStaff.name || managingPermissionsStaff.email}!`);
      setManagingPermissionsStaff(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update permissions.');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleSendCredentials = async (staff) => {
    setSendingCredentialsId(staff.id);
    setError(null);
    try {
      const res = await api.adminSendCredentials(staff.id);
      setSuccessMsg(res.message || `Credentials dispatched to ${staff.email}!`);
    } catch (err) {
      setError(err.message || 'Failed to dispatch credentials email.');
    } finally {
      setSendingCredentialsId(null);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;
    setError(null);
    setSubmitting(true);

    try {
      await api.deleteAdminUser(deleteConfirmStaff.id);
      setSuccessMsg(`Staff account ${deleteConfirmStaff.name} deactivated.`);
      setDeleteConfirmStaff(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = search.toLowerCase();
      const matchQuery =
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.custom_role?.toLowerCase().includes(q);

      const matchRole =
        selectedRoleFilter === 'all' ||
        s.role === selectedRoleFilter ||
        s.custom_role === selectedRoleFilter;

      return matchQuery && matchRole;
    });
  }, [staffList, search, selectedRoleFilter]);

  // Quota computations
  const teacherCount = staffList.filter((s) => s.role === 'teacher' || s.custom_role?.includes('teach')).length;
  const maxTeachers = subscription?.plan?.max_teachers || 15;
  const quotaPercent = Math.min(100, Math.round((teacherCount / maxTeachers) * 100));
  const isNearLimit = quotaPercent >= 80;
  const isAtLimit = teacherCount >= maxTeachers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Feedback */}
      {successMsg && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#059669" />
            {successMsg}
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#dc2626" />
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Quota & SaaS Plan Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '14px',
          padding: '20px 24px',
          color: '#fff',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Faculty & Staff Management</h3>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#93c5fd',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {subscription?.plan?.name || 'Starter'} Tier
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Provision verified login credentials and assign custom roles to teachers, administrators, and office staff.
            </p>
          </div>
        </div>

        {/* Quota Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ minWidth: '180px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: '#cbd5e1' }}>Faculty Quota</span>
              <span style={{ fontWeight: 700, color: isAtLimit ? '#f87171' : isNearLimit ? '#fbbf24' : '#34d399' }}>
                {teacherCount} / {maxTeachers} seats
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '7px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${quotaPercent}%`,
                  height: '100%',
                  background: isAtLimit
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : isNearLimit
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #10b981, #059669)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Zap size={14} /> Upgrade Seats
            </button>
          )}
        </div>
      </div>

      {/* Control Header & Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '360px',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search faculty by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Roles ({staffList.length})</option>
            {availableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadData}
            title="Refresh list"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '9px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>

          <button
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                password: generateRandomPassword(),
                phone: '',
                role: 'teacher',
                is_custom_role: false,
                custom_role_name: '',
              });
              setShowAddModal(true);
            }}
            disabled={isAtLimit}
            style={{
              background: isAtLimit ? '#94a3b8' : 'var(--primary, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isAtLimit ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isAtLimit ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <UserPlus size={16} />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Staff Member</th>
                <th style={{ padding: '12px 16px' }}>Assigned Role</th>
                <th style={{ padding: '12px 16px' }}>Contact Phone</th>
                <th style={{ padding: '12px 16px' }}>Account Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Loading staff directory...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', background: '#f1f5f9', borderRadius: '50%', marginBottom: '12px' }}>
                      <Users size={28} color="#94a3b8" />
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#334155' }}>No staff members found</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                      {search ? 'Try adjusting your search criteria.' : 'Add your first teacher or administrator.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const roleConfig = availableRoles.find((r) => r.id === (staff.custom_role || staff.role)) || {
                    label: (staff.custom_role || staff.role).toUpperCase(),
                    color: '#64748b',
                    bg: '#f1f5f9',
                  };

                  return (
                    <tr
                      key={staff.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                            }}
                          >
                            {(staff.name || 'S').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{staff.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={11} /> {staff.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: roleConfig.color,
                              background: roleConfig.bg,
                              border: `1px solid ${roleConfig.color}22`,
                            }}
                          >
                            {staff.custom_role ? `Custom: ${staff.custom_role}` : roleConfig.label}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {staff.phone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} color="#94a3b8" /> {staff.phone}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: staff.is_active !== false ? '#ecfdf5' : '#fef2f2',
                            color: staff.is_active !== false ? '#059669' : '#dc2626',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: staff.is_active !== false ? '#10b981' : '#ef4444',
                            }}
                          />
                          {staff.is_active !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleSendCredentials(staff)}
                            disabled={sendingCredentialsId === staff.id}
                            title="Email Institutional Credentials & Temporary Password"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #c7d2fe',
                              background: '#eef2ff',
                              color: '#4f46e5',
                              cursor: sendingCredentialsId === staff.id ? 'wait' : 'pointer',
                            }}
                          >
                            <Mail size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenPermissions(staff)}
                            title="Configure Feature Access & Permissions"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #c7d2fe',
                              background: '#eff6ff',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <Shield size={13} /> Permissions
                          </button>

                          <button
                            onClick={() => {
                              setResettingPasswordStaff(staff);
                              setNewPassword(generateRandomPassword());
                            }}
                            title="Reset Login Password"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              background: '#fff',
                              color: '#64748b',
                              cursor: 'pointer',
                            }}
                          >
                            <KeyRound size={14} />
                          </button>

                          <button
                            onClick={() => setEditingStaff({ ...staff })}
                            title="Edit Details & Role"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              background: '#fff',
                              color: '#2563eb',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmStaff(staff)}
                            title="Deactivate Account"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              background: '#fff',
                              color: '#dc2626',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal 1: Add New Staff Member ──────────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '10px', color: '#2563eb' }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                    Provision Staff Account
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Creates secure portal login credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Official Email (Username) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="priya.sharma@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                    style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Regenerate
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.password)}
                    title="Copy to clipboard"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                    }}
                  >
                    {copiedPass ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Role Selection & Custom Role Creation */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Organizational Role *
                </label>
                {!formData.is_custom_role ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        background: '#fff',
                      }}
                    >
                      {availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_custom_role: true })}
                      style={{
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#2563eb',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: '2px 0',
                      }}
                    >
                      + Create a new custom role for this school
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lab Assistant, Sports Coach, Head of Dept"
                        value={formData.custom_role_name}
                        onChange={(e) => setFormData({ ...formData, custom_role_name: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #3b82f6',
                          fontSize: '13px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_custom_role: false, custom_role_name: '' })}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Custom role will be saved and available for future assignments.
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#64748b',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Edit Staff Member ─────────────────────────────────── */}
      {editingStaff && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                Edit Staff Profile
              </h3>
              <button
                onClick={() => setEditingStaff(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.name || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={editingStaff.email || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editingStaff.phone || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Assigned Role
                </label>
                <select
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                >
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Custom Role Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physics HOD"
                  value={editingStaff.custom_role || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, custom_role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Account Status
                </label>
                <select
                  value={editingStaff.is_active !== false ? 'active' : 'suspended'}
                  onChange={(e) => setEditingStaff({ ...editingStaff, is_active: e.target.value === 'active' })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                >
                  <option value="active">Active (Can Login)</option>
                  <option value="suspended">Suspended (Access Blocked)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#64748b',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Reset Password ────────────────────────────────────── */}
      {resettingPasswordStaff && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '10px', color: '#d97706' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>
                    Reset Password
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    For {resettingPasswordStaff.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResettingPasswordStaff(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(newPassword)}
                    title="Copy password"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                    }}
                  >
                    {copiedPass ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateRandomPassword())}
                  style={{
                    fontSize: '11px',
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    marginTop: '5px',
                    padding: 0,
                  }}
                >
                  Generate new secure password
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setResettingPasswordStaff(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#64748b',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newPassword}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#d97706',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 4: Delete Confirmation ───────────────────────────────── */}
      {deleteConfirmStaff && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>
                  Deactivate Staff Member?
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  {deleteConfirmStaff.name} ({deleteConfirmStaff.email})
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to deactivate this account? They will immediately lose access to the portal.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={submitting}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 5: Feature Access & Permissions Management ────────── */}
      {managingPermissionsStaff && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '740px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Shield size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#1e293b' }}>
                    Feature Access & Module Permissions
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Staff Member: <strong>{managingPermissionsStaff.name || managingPermissionsStaff.email}</strong> • Role: <span style={{ textTransform: 'capitalize' }}>{managingPermissionsStaff.custom_role || managingPermissionsStaff.role}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingPermissionsStaff(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Presets Toolbar */}
            <div style={{
              padding: '12px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                Role Presets:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('teacher')}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#2563eb' }}
                >
                  Faculty Default
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('accountant')}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#059669' }}
                >
                  Cashier / Billing
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('front_desk')}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#7c3aed' }}
                >
                  Front Office
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}
                >
                  Grant All
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('none')}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Modules Grid */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '12px',
            }}>
              {SYSTEM_MODULES.map((mod) => {
                const isChecked = Boolean(staffPermissions[mod.key]);
                return (
                  <div
                    key={mod.key}
                    onClick={() => setStaffPermissions((prev) => ({ ...prev, [mod.key]: !isChecked }))}
                    style={{
                      border: isChecked ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                      background: isChecked ? '#eff6ff' : '#ffffff',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#2563eb', width: '16px', height: '16px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isChecked ? '#1e40af' : '#1e293b' }}>
                          <span style={{ marginRight: '6px' }}>{mod.icon}</span>
                          {mod.label}
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: isChecked ? '#dbeafe' : '#f1f5f9',
                          color: isChecked ? '#1d4ed8' : '#64748b',
                        }}>
                          {mod.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', lineHeight: '1.4' }}>
                        {mod.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {Object.values(staffPermissions).filter(Boolean).length} of {SYSTEM_MODULES.length} modules enabled
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setManagingPermissionsStaff(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#64748b',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  className="btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Shield size={14} />
                  {savingPermissions ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
