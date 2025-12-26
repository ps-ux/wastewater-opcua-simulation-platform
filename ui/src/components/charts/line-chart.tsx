// Simple line chart component using SVG

'use client';

import * as React from 'react';
import { useMemo } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showArea?: boolean;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  label?: string;
}

export function LineChart({
  data,
  color = '#3b82f6',
  height = 120,
  showGrid = true,
  showArea = true,
  minValue,
  maxValue,
  unit = '',
  label,
}: LineChartProps) {
  const chartData = useMemo(() => {
    if (data.length < 2) return null;

    const values = data.map(d => d.value);
    const min = minValue ?? Math.min(...values) * 0.9;
    const max = maxValue ?? Math.max(...values) * 1.1;
    const range = max - min || 1;

    const width = 100; // percentage
    const padding = 2;

    const points = data.map((d, i) => {
      const x = ((i / (data.length - 1)) * (width - padding * 2)) + padding;
      const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
      return { x, y, value: d.value };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return {
      points,
      pathD,
      areaD,
      min,
      max,
      current: values[values.length - 1],
    };
  }, [data, height, minValue, maxValue]);

  if (!chartData) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800"
        style={{ height }}
      >
        <p className="text-sm text-zinc-400">Waiting for data...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
          <span className="font-mono text-lg font-bold" style={{ color }}>
            {chartData.current.toFixed(1)}{unit && <span className="ml-1 text-sm text-zinc-400">{unit}</span>}
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full overflow-visible"
        preserveAspectRatio="none"
        style={{ height }}
      >
        {/* Grid lines */}
        {showGrid && (
          <g className="text-zinc-200 dark:text-zinc-700">
            {[0.25, 0.5, 0.75].map(ratio => (
              <line
                key={ratio}
                x1="0"
                y1={height * ratio}
                x2="100"
                y2={height * ratio}
                stroke="currentColor"
                strokeWidth="0.3"
                strokeDasharray="2,2"
              />
            ))}
          </g>
        )}

        {/* Area fill */}
        {showArea && (
          <path
            d={chartData.areaD}
            fill={`${color}20`}
          />
        )}

        {/* Line */}
        <path
          d={chartData.pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Current value dot */}
        {chartData.points.length > 0 && (
          <circle
            cx={chartData.points[chartData.points.length - 1].x}
            cy={chartData.points[chartData.points.length - 1].y}
            r="3"
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Min/Max labels */}
      <div className="mt-1 flex justify-between text-xs text-zinc-400">
        <span>{chartData.min.toFixed(1)}</span>
        <span>{chartData.max.toFixed(1)}</span>
      </div>
    </div>
  );
}
