'use client';

import React, { useEffect, useState } from 'react';
import { getDailyQuote } from '@/lib/quotes';
import { getLocalDateString } from '@/lib/dates';
import { Quote } from 'lucide-react';

export default function QuoteBanner() {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const today = getLocalDateString();
    setQuote(getDailyQuote(today));
  }, []);

  if (!quote) return null;

  return (
    <div className="glass-panel p-5 rounded-3xl relative overflow-hidden flex flex-col gap-2 shadow-sm">
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
      <div className="flex gap-2.5 items-start">
        <Quote className="text-purple-500 dark:text-purple-400 shrink-0 rotate-180" size={18} />
        <p className="text-sm font-semibold italic text-slate-600 dark:text-slate-300 leading-relaxed">
          {quote}
        </p>
      </div>
    </div>
  );
}
