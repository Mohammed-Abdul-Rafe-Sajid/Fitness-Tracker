'use client';

import React from 'react';

interface BarData {
  label: string;
  percent: number;
}

interface SimpleBarChartProps {
  data: BarData[];
  barColor?: string;
}

export default function SimpleBarChart({
  data,
  barColor = 'bg-purple-500 dark:bg-purple-600',
}: SimpleBarChartProps) {
  return (
    <div className="flex justify-between items-end gap-3 h-36 w-full pt-4 px-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
          {/* Hover indicator */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-5 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-semibold py-0.5 px-1.5 rounded-md shadow-md z-10 pointer-events-none">
            {item.percent}%
          </div>
          
          {/* Vertical Bar track */}
          <div className="w-4 bg-slate-200/50 dark:bg-zinc-800/80 rounded-full h-full flex items-end overflow-hidden">
            <div
              className={`w-full rounded-full transition-all duration-700 ease-out ${barColor}`}
              style={{ height: `${item.percent}%` }}
            />
          </div>
          
          {/* Label */}
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-full text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
