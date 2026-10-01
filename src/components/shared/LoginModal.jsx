import React, { useState, useEffect } from 'react';
import { api, setToken, setUser } from '../../api';
import { Shield, Sparkles, School, Lock, Mail, ArrowRight, UserCheck, Building2, Phone, MapPin, CheckCircle2, Globe, X, Search, ChevronDown, Check } from 'lucide-react';

export default function LoginModal({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register_school'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // School Selection state
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // SuperAdmin OTP login state
  const [adminPhone, setAdminPhone] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [sendingAdminOtp, setSendingAdminOtp] = useState(false);

  useEffect(() => {
    api.searchSchools('')
      .then(data => {
        setSchools(data || []);
        // Direct login enabled by default - no forced auto-selection
      })
      .catch(console.error);
  }, []);


  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);

  // School Registration state
  const [regForm, setRegForm] = useState({
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
    confirm_password: '',
  });

  const handleRequestReset = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please enter your registered email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      if (res.reset_token) {
        setResetCode(res.reset_token);
        setSuccessMsg(`Recovery code sent to your email! (Your Code: ${res.reset_token})`);
      } else {
        setSuccessMsg(res.message || 'If this email is registered, a reset link or code has been sent.');
      }
      setForgotStep(2);
    } catch (err) {
      setError(err.message || 'Failed to process password reset request');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReset = async (e) => {
    if (e) e.preventDefault();
    if (!resetCode.trim() || !newPassword.trim()) {
      setError('Please provide both the reset code and your new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.resetPassword({
        email: forgotEmail.trim(),
        reset_token: resetCode.trim(),
        new_password: newPassword,
      });
      setSuccessMsg(res.message || 'Password has been reset! Please sign in with your new credentials.');
      setMode('login');
      setEmail(forgotEmail);
      setPassword('');
      setForgotStep(1);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check the reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e, customEmail = null, customPass = null) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.login(loginEmail, loginPass, selectedSchool?.id);
      setToken(res.access_token);
      setUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSuperAdminOtp = async (e) => {
    if (e) e.preventDefault();
    const clean = adminPhone.trim().replace(/[^0-9]/g, '').slice(-10);
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit registered mobile number');
      return;
    }
    setSendingAdminOtp(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.superadminSendOtp(clean);
      setAdminOtpSent(true);
      setSuccessMsg(res.message || 'Verification OTP sent to your registered mobile number');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Ensure your mobile number is authorized.');
    } finally {
      setSendingAdminOtp(false);
    }
  };

  const handleVerifySuperAdminOtp = async (e) => {
    if (e) e.preventDefault();
    const clean = adminPhone.trim().replace(/[^0-9]/g, '').slice(-10);
    const code = adminOtp.trim();
    if (!code) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.superadminVerifyOtp(clean, code);
      setToken(res.access_token);
      setUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (val) => {
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(val) && !val.includes('..');
  };

  const isValidPhone = (val) => {
    const digits = val.replace(/\D/g, '');
    const clean = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : (digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits);
    return /^[6-9]\d{9}$/.test(clean) && new Set(clean).size >= 3;
  };

  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validations
    if (!regForm.name.trim() || regForm.name.trim().length < 2) {
      setError('School / Organization name is required (minimum 2 characters)');
      return;
    }
    if (!isValidEmail(regForm.email.trim())) {
      setError('A valid, genuine official school email is required (e.g. info@school.edu)');
      return;
    }
    if (regForm.phone && !isValidPhone(regForm.phone)) {
      setError('Please provide a valid 10-digit school mobile number starting with 6, 7, 8, or 9');
      return;
    }
    if (!regForm.admin_name.trim() || regForm.admin_name.trim().length < 2) {
      setError('Administrator full name is required');
      return;
    }
    if (!isValidEmail(regForm.admin_email.trim())) {
      setError('A valid administrator email is required');
      return;
    }
    if (regForm.admin_password.length < 6) {
      setError('Admin password must be at least 6 characters');
      return;
    }
    if (regForm.admin_password !== regForm.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerSchool({
        name: regForm.name.trim(),
        board: regForm.board,
        address: regForm.address.trim() || null,
        city: regForm.city.trim() || null,
        state: regForm.state.trim() || null,
        phone: regForm.phone.trim() || null,
        email: regForm.email.trim().toLowerCase(),
        admin_name: regForm.admin_name.trim(),
        admin_email: regForm.admin_email.trim().toLowerCase(),
        admin_password: regForm.admin_password,
      });

      setSuccessMsg(`School registered! Logging in as ${res.admin.full_name}...`);
      setToken(res.access_token);
      
      const userInfo = {
        ...res.admin,
        school_id: res.school.id,
        school_name: res.school.name,
      };
      setUser(userInfo);

      setTimeout(() => {
        onLoginSuccess(userInfo);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
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
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 91, 255, 0.08) 0%, rgba(248, 250, 252, 1) 90%)',
      padding: '24px 16px',
    }}>
      <div className="tech-card" style={{
        maxWidth: mode === 'login' ? '480px' : '640px',
        width: '100%',
        padding: '36px',
        background: '#ffffff',
        boxShadow: '0 20px 40px -15px rgba(10, 37, 64, 0.12), 0 0 0 1px rgba(10, 37, 64, 0.05)',
        transition: 'all 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/logo.jpg"
            alt="Logo"
            style={{ width: '60px', height: '60px', borderRadius: '14px', marginBottom: '12px', boxShadow: '0 4px 12px rgba(99, 91, 255, 0.25)' }}
          />
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Technula EduFlow
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Enterprise School Operating System & Unified Campus Platform
          </p>
        </div>

        {/* Mode Selector Tabs (Public for Schools) */}
        {mode === 'superadmin_otp' ? (
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="#a5b4fc" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#e0e7ff' }}>Master Platform SuperAdmin Portal</span>
            </div>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← School Login
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '22px',
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Staff / School Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register_school'); setError(null); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                background: mode === 'register_school' ? '#ffffff' : 'transparent',
                color: mode === 'register_school' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: mode === 'register_school' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Register School
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            background: 'var(--accent-emerald-light)',
            color: 'var(--accent-emerald)',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--accent-rose-light)',
            color: 'var(--accent-rose)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '18px',
          }}>
            {error}
          </div>
        )}

        {/* ── MODE 1: LOGIN ── */}
        {mode === 'login' && (
          <>
            {/* Manual Login Form */}
            <form onSubmit={handleLogin}>
              {/* Institution / School Selector */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Affiliated School / Campus
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSchoolPicker(!showSchoolPicker)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {showSchoolPicker ? 'Close' : (selectedSchool ? 'Change School' : 'Select School (Optional)')}
                  </button>
                </div>

                {/* Case 1: Direct Login (No specific school chosen) */}
                {!selectedSchool && !showSchoolPicker && (
                  <div
                    onClick={() => setShowSchoolPicker(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Globe size={18} color="var(--primary)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        Direct Sign In (All Schools)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Auto-detects school from your credentials • Click to filter by school
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
                      Choose ▾
                    </span>
                  </div>
                )}

                {/* Case 2: Specific School Selected */}
                {selectedSchool && !showSchoolPicker && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: 'rgba(99, 91, 255, 0.04)',
                      border: '1px solid rgba(99, 91, 255, 0.25)',
                      borderRadius: '8px',
                    }}
                  >
                    <Building2 size={18} color="var(--primary)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedSchool.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {selectedSchool.board || 'CBSE'} {selectedSchool.city ? `• ${selectedSchool.city}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowSchoolPicker(true)}
                        style={{
                          background: 'rgba(99, 91, 255, 0.1)',
                          border: 'none',
                          color: 'var(--primary)',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSchool(null)}
                        title="Clear school selection and use Direct Login"
                        style={{
                          background: '#f1f5f9',
                          border: 'none',
                          color: '#64748b',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Case 3: School Picker Dropdown with Instant Search */}
                {showSchoolPicker && (
                  <div style={{
                    background: '#fff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                      <input
                        type="text"
                        value={schoolSearch}
                        onChange={(e) => setSchoolSearch(e.target.value)}
                        placeholder="Search school by name, code, or city..."
                        className="form-input"
                        autoFocus
                        style={{ fontSize: '12px', padding: '6px 10px 6px 30px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {/* Option for Direct Login */}
                      <div
                        onClick={() => {
                          setSelectedSchool(null);
                          setShowSchoolPicker(false);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: !selectedSchool ? 'rgba(99, 91, 255, 0.08)' : '#f8fafc',
                          color: !selectedSchool ? 'var(--primary)' : 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: !selectedSchool ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px dashed #cbd5e1',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Globe size={14} /> Direct Sign In (Any School)
                        </span>
                        {!selectedSchool && <Check size={14} color="var(--primary)" />}
                      </div>

                      {schools
                        .filter(s =>
                          !schoolSearch ||
                          s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                          (s.city && s.city.toLowerCase().includes(schoolSearch.toLowerCase())) ||
                          (s.code && s.code.toLowerCase().includes(schoolSearch.toLowerCase()))
                        )
                        .map(s => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedSchool(s);
                              setShowSchoolPicker(false);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: selectedSchool?.id === s.id ? 'rgba(99, 91, 255, 0.08)' : 'transparent',
                              color: selectedSchool?.id === s.id ? 'var(--primary)' : 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: selectedSchool?.id === s.id ? 700 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div>{s.name}</div>
                              <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                {s.board || 'CBSE'} {s.city ? `• ${s.city}` : ''} {s.code ? `(${s.code})` : ''}
                              </div>
                            </div>
                            {selectedSchool?.id === s.id && <Check size={14} color="var(--primary)" />}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address
                </label>

                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Admin email or school email (e.g. vms@gmail.com)"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-14px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setError(null);
                    setSuccessMsg(null);
                    setForgotEmail(email);
                    setForgotStep(1);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px' }}
              >
                {loading ? 'Authenticating...' : (
                  <>
                    Sign In to Portal <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ── MODE 1B: SUPERADMIN OTP LOGIN ── */}
        {mode === 'superadmin_otp' && (
          <div>
            <div style={{
              background: 'rgba(99, 91, 255, 0.05)',
              border: '1px solid rgba(99, 91, 255, 0.15)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Shield size={24} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Platform SuperAdmin Master Access
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Enter your registered master mobile number to receive a verification OTP.
                </div>
              </div>
            </div>

            <form onSubmit={adminOtpSent ? handleVerifySuperAdminOtp : handleSendSuperAdminOtp}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Authorized Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    className="form-input"
                    style={{ paddingLeft: '48px', height: '42px', fontSize: '14px', fontWeight: 600 }}
                    disabled={adminOtpSent}
                  />
                </div>
              </div>

              {adminOtpSent && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      6-Digit Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdminOtpSent(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Change Number
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="text"
                      maxLength={6}
                      value={adminOtp}
                      onChange={(e) => setAdminOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="form-input"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '16px', letterSpacing: '4px', fontWeight: 800 }}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {!adminOtpSent ? (
                <button
                  type="submit"
                  disabled={sendingAdminOtp || adminPhone.length < 10}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', background: '#1e1b4b' }}
                >
                  {sendingAdminOtp ? 'Sending OTP...' : (
                    <>
                      Send Login Verification Code <ArrowRight size={16} />
                    </>
                  )}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={loading || adminOtp.length < 6}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', background: '#1e1b4b' }}
                  >
                    {loading ? 'Verifying...' : (
                      <>
                        Verify OTP & Access SaaS Platform <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendSuperAdminOtp}
                    disabled={sendingAdminOtp}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
                  >
                    Resend Verification Code
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ── MODE 3: FORGOT PASSWORD ── */}
        {mode === 'forgot_password' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {forgotStep === 1 ? 'Reset Your Password' : 'Set New Password'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                {forgotStep === 1
                  ? 'Enter your registered email address to receive a secure recovery code.'
                  : 'Enter the recovery code sent to your email and choose a new password.'}
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestReset}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g., admin@school.edu"
                      className="form-input"
                      style={{ paddingLeft: '38px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1.5, justifyContent: 'center' }}
                  >
                    {loading ? 'Sending Code...' : 'Send Recovery Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="e.g. 8-character code"
                    className="form-input"
                  />
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="form-input"
                      style={{ paddingLeft: '38px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1.5, justifyContent: 'center' }}
                  >
                    {loading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── MODE 2: REGISTER NEW SCHOOL / ORG ── */}
        {mode === 'register_school' && (
          <form onSubmit={handleRegisterSchool}>
            <div style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{
                background: 'rgba(99, 91, 255, 0.04)',
                border: '1px solid rgba(99, 91, 255, 0.12)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: 'var(--primary)',
                fontWeight: 600,
              }}>
                🏫 Register your school to create a dedicated multi-tenant environment with smart analytics.
              </div>

              {/* School Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    School / Institute Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="e.g., Greenfield International Academy"
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Board *
                  </label>
                  <select
                    value={regForm.board}
                    onChange={(e) => setRegForm({ ...regForm, board: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="Cambridge">Cambridge / IGCSE</option>
                    <option value="IB">IB (International)</option>
                    <option value="State Board">State Board</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Official School Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="contact@school.edu"
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Official Phone
                  </label>
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 11 2345 6789"
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    placeholder="e.g., New Delhi"
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={regForm.state}
                    onChange={(e) => setRegForm({ ...regForm, state: e.target.value })}
                    placeholder="e.g., Delhi"
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Administrator Details */}
              <div style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '14px',
                marginTop: '14px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  👑 Principal / Administrator Account
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Administrator Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.admin_name}
                    onChange={(e) => setRegForm({ ...regForm, admin_name: e.target.value })}
                    placeholder="e.g., Dr. Rajesh Sharma"
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Admin Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.admin_email}
                    onChange={(e) => setRegForm({ ...regForm, admin_email: e.target.value })}
                    placeholder="principal@school.edu"
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regForm.admin_password}
                      onChange={(e) => setRegForm({ ...regForm, admin_password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="form-input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regForm.confirm_password}
                      onChange={(e) => setRegForm({ ...regForm, confirm_password: e.target.value })}
                      placeholder="Repeat password"
                      className="form-input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* SaaS Subscription Plan Tier Option */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#16a34a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#14532d' }}>
                        10-Day Full Access Free Trial
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, background: '#bbf7d0', color: '#166534', padding: '1px 6px', borderRadius: '999px' }}>
                        No Card Needed
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#15803d' }}>
                      Includes Starter tier features, comprehensive reports, attendance, and student onboarding. Upgrade to Growth/Enterprise anytime via PayU.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '14px' }}
            >
              {loading ? 'Creating Organization...' : (
                <>
                  Complete Registration & Launch OS <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Technula EduFlow • Enterprise Cloud Architecture • Multi-Tenant School OS
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          {mode === 'superadmin_otp' ? (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Back to School Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMode('superadmin_otp'); setError(null); setSuccessMsg(null); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', opacity: 0.7 }}
            >
              🔐 Platform SuperAdmin Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
