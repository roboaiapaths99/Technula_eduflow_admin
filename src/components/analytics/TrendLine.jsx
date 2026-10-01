import React, { useState } from 'react';

/**
 * Pure SVG TrendLine Chart.
 *
 * Props:
 * - data: Array of { label: string, value: number } (e.g. exams or dates)
 * - height?: number
 * - color?: string
 * - ySuffix?: string (e.g. "%")
 */
export default function TrendLine({ data = [], height = 220, color = '#6366f1', ySuffix = '%' }) {
  const [activePoint, setActivePoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No trend data available.
      </div>
    );
  }

  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;
  const width = 500; // SVG viewBox coordinate system

  // Scale Y between 0 and 100 or min/max
  const values = data.map(d => Number(d.value) || 0);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 100);

  const getY = (val) => {
    const range = maxVal - minVal || 100;
    const norm = (val - minVal) / range;
    return paddingTop + (1 - norm) * (height - paddingTop - paddingBottom);
  };

  const getX = (idx) => {
    if (data.length <= 1) return (width - paddingLeft - paddingRight) / 2 + paddingLeft;
    const step = (width - paddingLeft - paddingRight) / (data.length - 1);
    return paddingLeft + idx * step;
  };

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(Number(d.value) || 0),
    data: d
  }));

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${height - paddingBottom} L ${points[0].x},${height - paddingBottom} Z`
    : '';

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`trend-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 25, 50, 75, 100].map((gridVal) => {
          const y = getY(gridVal);
          return (
            <g key={gridVal}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(148, 163, 184, 0.2)"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                fill="var(--text-muted, #94a3b8)"
                fontSize="10"
                textAnchor="end"
              >
                {gridVal}{ySuffix}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#trend-grad-${color.replace('#', '')})`} />

        {/* The line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i} style={{ cursor: 'pointer' }}>
            <circle
              cx={p.x}
              y={p.y}
              r={activePoint === i ? 7 : 5}
              fill="#ffffff"
              stroke={color}
              strokeWidth="3"
              onMouseEnter={() => setActivePoint(i)}
              onMouseLeave={() => setActivePoint(null)}
              style={{ transition: 'r 0.2s ease' }}
            />
            {/* X-axis label */}
            <text
              x={p.x}
              y={height - paddingBottom + 18}
              fill="var(--text-secondary, #64748b)"
              fontSize="11"
              fontWeight={activePoint === i ? 700 : 500}
              textAnchor="middle"
            >
              {p.data.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Active tooltip */}
      {activePoint !== null && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none'
        }}>
          <span>{data[activePoint]?.label}: </span>
          <span style={{ color: color, fontWeight: 700 }}>
            {data[activePoint]?.value}{ySuffix}
          </span>
        </div>
      )}
    </div>
  );
}
