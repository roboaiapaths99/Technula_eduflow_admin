import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  User, Phone, Mail, MapPin, HeartPulse, ShieldCheck, CheckCircle2,
  AlertCircle, Save, Clock, Lock
} from 'lucide-react';

export default function ParentProfileEdit({ user, studentId, studentInfo, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    father_phone: '',
    mother_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    blood_group: '',
    medical_notes: '',
  });

  useEffect(() => {
    if (studentId) loadProfile();
  }, [studentId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getParentProfile(studentId);
      setProfile(data);
      if (data?.student) {
        setForm({
          father_phone: data.student.father_phone || '',
          mother_phone: data.student.mother_phone || '',
          emergency_contact_name: data.student.emergency_contact_name || '',
          emergency_contact_phone: data.student.emergency_contact_phone || '',
          address: data.student.address || '',
          blood_group: data.student.blood_group || '',
          medical_notes: data.student.medical_notes || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateParentProfile(studentId, form);
      setMessage(res.message);
      loadProfile();
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading student & guardian profile...</div>;
  }

  const pendingFields = profile?.pending_approval_fields || {};
  const hasPending = Object.keys(pendingFields).length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Student Dossier & Guardian Contact Details</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Keep emergency contact numbers, medical notes, and home address up to date for campus dispatch.
        </p>
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

      {hasPending && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #fde68a' }}>
          <Clock size={18} />
          <span>
            <strong>Pending Admin Review:</strong> Updates to ({Object.keys(pendingFields).join(', ')}) are currently awaiting school verification.
          </span>
        </div>
      )}

      {/* Official Identity Read-Only Section */}
      <div className="tech-card" style={{ padding: '20px', background: '#f8fafc' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
          Official School Enrolment (Institutional Record)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Student Full Name:</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{profile?.student?.name}</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Admission Number:</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{profile?.student?.admission_no}</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Class & Section:</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>Grade {profile?.student?.grade}-{profile?.student?.section}</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Date of Birth:</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{profile?.student?.dob || 'Not on file'}</div>
          </div>
        </div>
      </div>

      {/* Self-Edit Form */}
      <form onSubmit={handleSave} className="tech-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
          Editable Contact & Emergency Info
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Father Phone / WhatsApp</label>
            <input
              type="tel"
              value={form.father_phone}
              onChange={(e) => setForm({ ...form, father_phone: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Mother Phone / WhatsApp</label>
            <input
              type="tel"
              value={form.mother_phone}
              onChange={(e) => setForm({ ...form, mother_phone: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Emergency Contact Name</label>
            <input
              type="text"
              placeholder="e.g. Uncle / Neighbor"
              value={form.emergency_contact_name}
              onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Emergency Contact Phone</label>
            <input
              type="tel"
              value={form.emergency_contact_phone}
              onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Blood Group</label>
            <select
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
            >
              <option value="">Select Blood Group</option>
              <option value="O+">O+</option>
              <option value="A+">A+</option>
              <option value="B+">B+</option>
              <option value="AB+">AB+</option>
              <option value="O-">O-</option>
              <option value="A-">A-</option>
              <option value="B-">B-</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Medical Notes / Allergies</label>
            <input
              type="text"
              placeholder="e.g. Asthmatic, Peanut allergy, Inhaler in bag"
              value={form.medical_notes}
              onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Permanent Residential Address</label>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
