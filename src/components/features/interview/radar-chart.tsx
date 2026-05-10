'use client';

import type { CoachScores } from '@/lib/ai/interview-coach';

interface RadarChartProps {
  scores: CoachScores;
  size?: number;
}

const LABELS: { key: keyof CoachScores; label: string }[] = [
  { key: 'relevance', label: '内容相关性' },
  { key: 'structure', label: '结构清晰度' },
  { key: 'quantification', label: '量化数据' },
  { key: 'technicalDepth', label: '技术深度' },
  { key: 'fluency', label: '表达流畅度' },
];

/**
 * Compute (x, y) for a vertex of a regular pentagon.
 * Index 0 is at the top (12 o'clock).
 */
function getPoint(index: number, radius: number, cx: number, cy: number) {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function pentagonPath(radius: number, cx: number, cy: number): string {
  return Array.from({ length: 5 })
    .map((_, i) => {
      const { x, y } = getPoint(i, radius, cx, cy);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ') + ' Z';
}

export function RadarChart({ scores, size = 250 }: RadarChartProps) {
  const padding = 40;
  const viewSize = size + padding * 2;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  const maxRadius = size / 2;

  // Build score polygon points
  const scorePoints = LABELS.map((dim, i) => {
    const raw = scores[dim.key];
    const value = typeof raw === 'number' && !isNaN(raw) ? Math.min(10, Math.max(0, raw)) : 0;
    const radius = (value / 10) * maxRadius;
    return getPoint(i, radius, cx, cy);
  });

  const scorePolygon = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  // Grid levels at 33%, 66%, 100%
  const gridLevels = [0.33, 0.66, 1.0];

  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      className="w-full max-w-[300px] h-auto"
      aria-label="能力雷达图"
    >
      {/* Grid lines */}
      {gridLevels.map((level) => (
        <path
          key={level}
          d={pentagonPath(maxRadius * level, cx, cy)}
          fill="none"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines from center to vertices */}
      {Array.from({ length: 5 }).map((_, i) => {
        const { x, y } = getPoint(i, maxRadius, cx, cy);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Score fill area */}
      <path
        d={scorePolygon}
        fill="rgba(34, 197, 94, 0.2)"
        stroke="rgb(34, 197, 94)"
        strokeWidth="2"
      />

      {/* Score dots */}
      {scorePoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="rgb(34, 197, 94)"
        />
      ))}

      {/* Labels and scores */}
      {LABELS.map((dim, i) => {
        const { x, y } = getPoint(i, maxRadius + 24, cx, cy);
        const raw = scores[dim.key];
        const value = typeof raw === 'number' && !isNaN(raw) ? Math.min(10, Math.max(0, raw)) : 0;

        // Determine text-anchor based on position
        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (x < cx - 10) textAnchor = 'end';
        else if (x > cx + 10) textAnchor = 'start';

        // Adjust y for top/bottom labels
        const dy = y < cy ? -4 : y > cy + 10 ? 12 : 4;

        return (
          <g key={dim.key}>
            <text
              x={x}
              y={y + dy}
              textAnchor={textAnchor}
              className="fill-current text-gray-700 dark:text-gray-300"
              fontSize="11"
              fontWeight="500"
            >
              {dim.label}
            </text>
            <text
              x={x}
              y={y + dy + 14}
              textAnchor={textAnchor}
              className="fill-current text-gray-500 dark:text-gray-400"
              fontSize="10"
            >
              {value.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
