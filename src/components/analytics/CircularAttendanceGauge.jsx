import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Calendar, ShieldCheck } from 'lucide-react';

/**
 * CircularAttendanceGauge
 * Interactive, high-fidelity SVG circular attendance progress gauge
 * with real student metrics and CBSE 75% regulatory compliance indicator.
 */
export default function CircularAttendanceGauge({
  percentage = 100,
  presentDays = 0,
  absentDays = 0,
  totalDays = 0,
  recentStatus = 'Present',
  size = 150,
  strokeWidth = 12,
  showBreakdown = true,
  studentName = 'Student'
}) {
  const numRate = Number(percentage) || 0;
  const clamped = Math.min(Math.max(numRate, 0), 100);

  // SVG Geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // 75% CBSE milestone angle position
  // 0% starts at top (-90deg), so 75% is at (-90 + 0.75 * 360) = 180deg (straight down)
  const markerAngle = -90 + 0.75 * 360;
  const markerRad = (markerAngle * Math.PI) / 180;
  const markerX = size / 2 + radius * Math.cos(markerRad);
  const markerY = size / 2 + radius * Math.sin(markerRad);

  // Status color logic
  let gradStart = '#10b981';
  let gradEnd = '#059669';
  let statusBadgeBg = '#ecfdf5';
  let statusTextColor = '#047857';
  let statusTitle = 'Excellent Standing';
  let statusIcon = <CheckCircle2 size={13} color="#10b981" />;

  if (clamped < 75) {
    gradStart = '#ef4444';
    gradEnd = '#b91c1c';
    statusBadgeBg = '#fef2f2';
    statusTextColor = '#b91c1c';
    statusTitle = 'Below 75% CBSE Threshold';
    statusIcon = <AlertTriangle size={13} color="#ef4444" />;
  } else if (clamped < 85) {
    gradStart = '#f59e0b';
    gradEnd = '#d97706';
    statusBadgeBg = '#fffbeb';
    statusTextColor = '#b45309';
    statusTitle = 'Good Standing (CBSE Met)';
    statusIcon = <ShieldCheck size={13} color="#f59e0b" />;
  }

  const gradId = `att-grad-${size}-${Math.round(clamped)}`;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <Calendar size={16} color="var(--primary, #635bff)" />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Student Attendance Gauge
            </span>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
              {studentName}
            </div>
          </div>
        </div>

        <div
          style={{
            background: statusBadgeBg,
            color: statusTextColor,
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {statusIcon}
          <span>{statusTitle}</span>
        </div>
      </div>

      {/* Center Layout: Circular Progress + Quick Stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          flexWrap: 'wrap'
        }}
      >
        {/* SVG Circular Ring */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradStart} />
                <stop offset="100%" stopColor={gradEnd} />
              </linearGradient>
              <filter id="att-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={gradStart} floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Animated Foreground Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#${gradId})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              filter="url(#att-glow)"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{
                transition: 'stroke-dashoffset 1s ease-in-out',
              }}
            />

            {/* 75% CBSE Target Notch Dot */}
            <circle
              cx={markerX}
              cy={markerY}
              r={3}
              fill="#ffffff"
              stroke="#64748b"
              strokeWidth={1.5}
            />
          </svg>

          {/* Center Text inside Circle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {clamped.toFixed(1)}%
            </span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.6px', marginTop: '4px' }}>
              ATTENDED
            </span>
          </div>
        </div>

        {/* Breakdown Badges */}
        {showBreakdown && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '170px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #f1f5f9'
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Present Days</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>{presentDays}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #f1f5f9'
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Absences</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: absentDays > 0 ? '#ef4444' : '#64748b' }}>
                {absentDays}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #f1f5f9'
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Working</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{totalDays}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Milestone */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#64748b'
        }}
      >
        <span>
          Regulatory Minimum: <strong>75.0%</strong> (Marked with ring notch)
        </span>
        <span style={{ fontWeight: 700, color: clamped >= 75 ? '#059669' : '#dc2626' }}>
          {clamped >= 75 ? '✓ Compliance Met' : '⚠️ Action Required'}
        </span>
      </div>
    </div>
  );
}
