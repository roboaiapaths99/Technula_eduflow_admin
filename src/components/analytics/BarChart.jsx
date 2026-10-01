import React, { useState } from 'react';

/**
 * Pure SVG Animated Bar Chart.
 * Zero external dependencies.
 *
 * Props:
 * - data: Array of { label: string, value: number, maxValue?: number, color?: string }
 * - benchmark?: number (e.g. 75 for 75% target)
 * - height?: number
 */
export default function BarChart({ data = [], benchmark = null, height = 280 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No analytics data available for this selection.
      </div>
    );
  }

  const defaultColors = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'
  ];

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((item, idx) => {
          const maxVal = item.maxValue || 100;
          const pct = Math.min(100, Math.max(0, (item.value / maxVal) * 100));
          const color = item.color || defaultColors[idx % defaultColors.length];
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateX(4px)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
                <span style={{ fontWeight: 700, color }}>
                  {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}%
                </span>
              </div>

              {/* Bar track */}
              <div style={{
                height: '10px',
                background: 'rgba(99, 102, 241, 0.08)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}dd 0%, ${color} 100%)`,
                    borderRadius: '6px',
                    transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isHovered ? `0 0 10px ${color}66` : 'none'
                  }}
                />

                {/* Benchmark indicator */}
                {benchmark && (
                  <div
                    title={`Benchmark: ${benchmark}%`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${benchmark}%`,
                      width: '2px',
                      background: '#ef4444',
                      zIndex: 2
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {benchmark && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ width: '8px', height: '2px', background: '#ef4444', display: 'inline-block' }} />
          <span>School Target Benchmark ({benchmark}%)</span>
        </div>
      )}
    </div>
  );
}
