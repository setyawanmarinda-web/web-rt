'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  colorTheme?: 'emerald' | 'teal'; // Tema warna: emerald untuk form statistik, teal untuk kas
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Pilih Tanggal',
  required = false,
  className = '',
  colorTheme = 'emerald'
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Format date untuk display (DD/MM/YYYY)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Parse date dari display format
  const parseDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Month and year display
  const monthYear = currentMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  // Handle date selection
  const handleSelectDate = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = selected.toISOString().split('T')[0];
    onChange(dateStr);
    setIsOpen(false);
  };

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update calendar month when value changes
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
    }
  }, [value]);

  const calendarDays = generateCalendarDays();
  const selectedDate = value ? new Date(value) : null;
  const isSelectedMonth = selectedDate?.getMonth() === currentMonth.getMonth() && 
                         selectedDate?.getFullYear() === currentMonth.getFullYear();

  const themeColor = colorTheme === 'emerald' 
    ? { border: 'border-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-400' }
    : { border: 'border-teal-500', bg: 'bg-teal-500', text: 'text-teal-400' };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" style={{ color: colorTheme === 'emerald' ? '#10b981' : '#14b8a6' }} />
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>

      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border ${themeColor.border}/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 text-left transition-all`}
      >
        {value ? formatDateDisplay(value) : <span className="text-slate-500">{placeholder}</span>}
      </button>

      {/* Calendar popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 w-80">
          {/* Header - Month/Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-white capitalize text-center flex-1">
              {monthYear}
            </h3>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => day && handleSelectDate(day)}
                disabled={!day}
                className={`
                  p-2 text-sm rounded-lg font-medium transition-all
                  ${!day ? 'invisible' : ''}
                  ${day && selectedDate?.getDate() === day && isSelectedMonth
                    ? `${themeColor.bg} text-slate-950 font-bold`
                    : day
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : ''
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Footer - Today button */}
          <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onChange(today);
                setCurrentMonth(new Date());
                setIsOpen(false);
              }}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Kosongkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
