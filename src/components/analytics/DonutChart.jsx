import React, { useState } from 'react';

/**
 * Pure SVG Donut Chart with animated segments and interactive legend.
 *
 * Props:
 * - data: Array of { label: string, value: number, color: string }
 * - size?: number (default 200)
 * - strokeWidth?: number (default 24)
 * - centerLabel?: string
 * - centerValue?: string | number
 */
export default function DonutChart({
  data = [],
  size = 200,
  strokeWidth = 24,
  centerLabel = 'Total',
  centerValue = null
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  if (total === 0) {
    return (
      <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No data to display.
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;
  const segments = data.map((d, idx) => {
    const val = Number(d.value) || 0;
    const pct = val / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += pct * circumference;

    return {
      ...d,
      pct: Math.round(pct * 100),
      strokeDasharray,
      strokeDashoffset,
      idx
    };
  });

  const displayCenterValue = centerValue !== null ? centerValue : total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {/* Base track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={hoveredIdx === seg.idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              onMouseEnter={() => setHoveredIdx(seg.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: 'center'
              }}
            />
          ))}
        </svg>

        {/* Center label & total */}
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
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>
            {hoveredIdx !== null ? data[hoveredIdx]?.label : centerLabel}
          </span>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
            {hoveredIdx !== null ? `${data[hoveredIdx]?.value} (${segments[hoveredIdx]?.pct}%)` : displayCenterValue}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px', justifyContent: 'center' }}>
        {segments.map((seg) => (
          <div
            key={seg.idx}
            onMouseEnter={() => setHoveredIdx(seg.idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              opacity: hoveredIdx === null || hoveredIdx === seg.idx ? 1 : 0.45,
              transition: 'opacity 0.2s ease'
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: seg.color,
                display: 'inline-block'
              }}
            />
            <span style={{ color: 'var(--text-secondary, #475569)', fontWeight: 500 }}>
              {seg.label}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              {seg.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
