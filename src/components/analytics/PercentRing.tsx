'use client';

import React from 'react';

interface PercentRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export default function PercentRing({
  percent,
  size = 110,
  strokeWidth = 10,
  color = 'stroke-purple-600 dark:stroke-purple-400',
  label,
}: PercentRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="rotate-[-90deg] w-full h-full">
          {/* Outer track */}
          <circle
            className="stroke-slate-200/50 dark:stroke-zinc-800/80"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className={`transition-all duration-500 ease-out ${color}`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {percent}%
          </span>
          {label && (
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
