import React, { useState } from 'react';
import { api, setUser as setStoredUser } from '../../api';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, LogOut, KeyRound } from 'lucide-react';

export default function ForceResetPasswordScreen({ user, onPasswordChanged, onLogout }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Password requirements
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasNumber && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!hasMinLength) setError('Password must be at least 8 characters long.');
      else if (!hasNumber) setError('Password must contain at least one number.');
      else if (!passwordsMatch) setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.forceChangePassword(newPassword);
      setSuccess(true);
      if (res.user) {
        setStoredUser(res.user);
        setTimeout(() => {
          onPasswordChanged(res.user);
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
      padding: '24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
        padding: '36px',
        border: '1px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top Accent Gradient Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)'
        }} />

        {/* Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            color: '#2563eb',
            marginBottom: '16px',
            boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.2)'
          }}>
            <KeyRound size={30} strokeWidth={2.2} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
            Set Your Permanent Password
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
            Welcome, <strong>{user?.full_name || user?.email}</strong>. You are logging in with a temporary password provided by school administration. Please choose a secure permanent password to activate your account.
          </p>
          {user?.school_name && (
            <div style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#f1f5f9',
              fontSize: '12px',
              fontWeight: '600',
              color: '#334155'
            }}>
              🏫 {user.school_name}
            </div>
          )}
        </div>

        {/* Success Banner */}
        {success && (
          <div style={{
            padding: '14px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#065f46',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={18} color="#059669" />
            Password updated successfully! Unlocking your dashboard...
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{
            padding: '14px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#991b1b',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} color="#dc2626" />
            {error}
          </div>
        )}

        {/* Reset Form */}
        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              New Permanent Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 8 characters"
                disabled={loading || success}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  color: '#0f172a'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Confirm Permanent Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            />
          </div>

          {/* Password Strength Checklist */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Security Requirements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasMinLength ? '#16a34a' : '#94a3b8', fontWeight: hasMinLength ? '600' : '400' }}>
                <CheckCircle2 size={14} color={hasMinLength ? '#16a34a' : '#cbd5e1'} />
                At least 8 characters
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasNumber ? '#16a34a' : '#94a3b8', fontWeight: hasNumber ? '600' : '400' }}>
                <CheckCircle2 size={14} color={hasNumber ? '#16a34a' : '#cbd5e1'} />
                Contains at least one number (0-9)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: passwordsMatch ? '#16a34a' : '#94a3b8', fontWeight: passwordsMatch ? '600' : '400' }}>
                <CheckCircle2 size={14} color={passwordsMatch ? '#16a34a' : '#cbd5e1'} />
                Passwords match
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading || success}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              background: isFormValid && !loading && !success
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                : '#94a3b8',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: isFormValid && !loading && !success ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isFormValid ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Securing Account...' : (
              <>
                Activate Account & Enter Dashboard
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Sign Out Option */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            <LogOut size={13} />
            Sign Out & Return Later
          </button>
        </div>
      </div>
    </div>
  );
}
