'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Line Chart Component
 * A beautiful, animated SVG line chart with gradient fill
 */
interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
  showGrid?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
  animated?: boolean;
}

const colorMap = {
  primary: { stroke: '#FF6A00', fill: 'url(#primaryGradient)' },
  success: { stroke: '#52C41A', fill: 'url(#successGradient)' },
  warning: { stroke: '#FAAD14', fill: 'url(#warningGradient)' },
  error: { stroke: '#FF4D4F', fill: 'url(#errorGradient)' },
  secondary: { stroke: '#1890FF', fill: 'url(#secondaryGradient)' },
};

export function LineChart({
  data,
  height = 200,
  className,
  color = 'primary',
  showGrid = true,
  showDots = true,
  showLabels = true,
  animated = true,
}: LineChartProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 400;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value), 100);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxValue - minValue || 100;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight,
    ...d,
  }));

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const { stroke, fill } = colorMap[color];

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Gradients */}
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6A00" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="successGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#52C41A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#52C41A" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="warningGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FAAD14" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FAAD14" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="errorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF4D4F" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF4D4F" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1890FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1890FF" stopOpacity="0.02" />
          </linearGradient>
          
          {/* Line animation */}
          {animated && (
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Grid lines */}
        {showGrid && (
          <g className="grid">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding.left}
                y1={padding.top + chartHeight * (1 - ratio)}
                x2={padding.left + chartWidth}
                y2={padding.top + chartHeight * (1 - ratio)}
                stroke="#E5E7EB"
                strokeDasharray="4 4"
              />
            ))}
          </g>
        )}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={fill}
          className={cn(
            'transition-opacity duration-700',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={animated ? 'url(#glow)' : undefined}
          className={cn(
            'transition-all duration-1000',
            animated && !isVisible && 'stroke-dasharray-[1000] stroke-dashoffset-[1000]'
          )}
          style={{
            strokeDasharray: animated ? '1000' : undefined,
            strokeDashoffset: animated && isVisible ? '0' : animated ? '1000' : undefined,
            transition: animated ? 'stroke-dashoffset 1.5s ease-in-out' : undefined,
          }}
        />

        {/* Dots */}
        {showDots && points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="white"
              stroke={stroke}
              strokeWidth="2"
              className={cn(
                'transition-all duration-300 cursor-pointer',
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              )}
              style={{ transitionDelay: `${i * 100 + 500}ms` }}
            />
            {/* Tooltip on hover */}
            <title>{`${point.label}: ${point.value}`}</title>
          </g>
        ))}

        {/* X-axis labels */}
        {showLabels && points.map((point, i) => (
          <text
            key={i}
            x={point.x}
            y={height - 10}
            textAnchor="middle"
            className="fill-gray-400 text-xs"
          >
            {point.label}
          </text>
        ))}

        {/* Y-axis labels */}
        {showLabels && [0, 0.5, 1].map((ratio) => (
          <text
            key={ratio}
            x={padding.left - 8}
            y={padding.top + chartHeight * (1 - ratio) + 4}
            textAnchor="end"
            className="fill-gray-400 text-xs"
          >
            {Math.round(minValue + valueRange * ratio)}
          </text>
        ))}
      </svg>
    </div>
  );
}

/**
 * Bar Chart Component
 * A beautiful, animated bar chart with hover effects
 */
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
  showLabels?: boolean;
  horizontal?: boolean;
}

const barColorMap = {
  primary: '#FF6A00',
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  secondary: '#1890FF',
};

export function BarChart({
  data,
  height = 200,
  className,
  color = 'primary',
  showLabels = true,
  horizontal = false,
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (horizontal) {
    return (
      <div className={cn('space-y-3', className)}>
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span className="text-gray-900 font-medium">{item.value}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || barColorMap[color],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <div className="h-full flex items-end justify-between gap-2">
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          const isHovered = hoveredIndex === i;
          
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Value */}
              <span className={cn(
                'text-xs font-medium transition-all',
                isHovered ? 'text-gray-900 scale-110' : 'text-gray-500'
              )}>
                {item.value}
              </span>
              
              {/* Bar */}
              <div
                className={cn(
                  'w-full rounded-t-md transition-all duration-500 ease-out cursor-pointer',
                  isHovered && 'shadow-lg'
                )}
                style={{
                  height: `${barHeight}px`,
                  minHeight: '4px',
                  backgroundColor: item.color || barColorMap[color],
                  opacity: isHovered ? 1 : 0.85,
                  transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                }}
              />
              
              {/* Label */}
              {showLabels && (
                <span className="text-xs text-gray-400 truncate w-full text-center">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Donut Chart Component
 * A beautiful, animated donut/pie chart
 */
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  className?: string;
  showLegend?: boolean;
  centerLabel?: React.ReactNode;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 24,
  className,
  showLegend = true,
  centerLabel,
}: DonutChartProps) {
  const [animationProgress, setAnimationProgress] = React.useState(0);

  React.useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ width: size, height: size }}>
        <p className="text-gray-400 text-sm">No data</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segments = data.map((item) => {
    const percentage = (item.value / total) * animationProgress;
    const length = percentage * circumference;
    const segment = {
      ...item,
      offset: currentOffset,
      length,
      percentage: (item.value / total) * 100,
    };
    currentOffset += (item.value / total) * circumference;
    return segment;
  });

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={thickness}
          />
          
          {/* Segments */}
          {segments.map((segment, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${segment.length} ${circumference}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          ))}
        </svg>
        
        {/* Center label */}
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centerLabel}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className="text-sm text-gray-900 font-medium ml-auto">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Progress Ring Component
 * A circular progress indicator with animation
 */
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
  className?: string;
  showLabel?: boolean;
  labelFormatter?: (value: number, max: number) => string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  thickness = 12,
  color = 'primary',
  className,
  showLabel = true,
  labelFormatter = (v, m) => `${Math.round((v / m) * 100)}%`,
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const startValue = animatedValue;
    const change = value - startValue;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(startValue + change * easeOut);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedValue / max) * circumference;

  const strokeColor = barColorMap[color];

  return (
    <div className={cn('relative inline-flex', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={thickness}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-300"
        />
      </svg>
      
      {/* Label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">
            {labelFormatter(animatedValue, max)}
          </span>
        </div>
      )}
    </div>
  );
}


