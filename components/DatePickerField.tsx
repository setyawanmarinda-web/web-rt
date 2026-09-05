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
  colorTheme?: 'emerald' | 'teal';
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
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [yearInput, setYearInput] = useState(new Date().getFullYear().toString());
  const containerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const monthYear = currentMonth.toLocaleString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  const handleSelectDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const date = String(day).padStart(2, '0');

    onChange(`${year}-${month}-${date}`);
    setIsOpen(false);
    setShowMonthYearPicker(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  };

  const handleOpen = () => {
    if (value) {
      const [year, month, day] = value.split('-');
      const selected = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      setCurrentMonth(selected);
      setYearInput(year);
    } else {
      const today = new Date();
      setCurrentMonth(today);
      setYearInput(today.getFullYear().toString());
    }

    setShowMonthYearPicker(false);
    setIsOpen(!isOpen);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const year = parseInt(yearInput);

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return;
    }

    setCurrentMonth(new Date(year, monthIndex, 1));
    setShowMonthYearPicker(false);
  };

  const handleYearChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;

    setYearInput(value);

    if (value.length === 4) {
      const year = parseInt(value);

      if (year >= 1900 && year <= 2100) {
        setCurrentMonth(
          new Date(year, currentMonth.getMonth(), 1)
        );
      }
    }
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    onChange(`${year}-${month}-${day}`);
    setCurrentMonth(today);
    setYearInput(year.toString());
    setShowMonthYearPicker(false);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowMonthYearPicker(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');

      setCurrentMonth(
        new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        )
      );

      setYearInput(year);
    }
  }, [value]);

  const calendarDays = generateCalendarDays();

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  const isSelectedMonth =
    selectedDate?.getMonth() === currentMonth.getMonth() &&
    selectedDate?.getFullYear() === currentMonth.getFullYear();

  const themeColor =
    colorTheme === 'emerald'
      ? {
          border: 'border-emerald-500',
          bg: 'bg-emerald-500',
          text: 'text-emerald-400'
        }
      : {
          border: 'border-teal-500',
          bg: 'bg-teal-500',
          text: 'text-teal-400'
        };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
        <Calendar
          className="w-3.5 h-3.5"
          style={{
            color:
              colorTheme === 'emerald'
                ? '#10b981'
                : '#14b8a6'
          }}
        />

        {label}

        {required && (
          <span className="text-red-400">*</span>
        )}
      </label>

      <button
        type="button"
        onClick={handleOpen}
        className={`w-full bg-slate-950 border ${themeColor.border}/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 text-left transition-all`}
      >
        {value ? (
          formatDateDisplay(value)
        ) : (
          <span className="text-slate-500">
            {placeholder}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 w-80">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setYearInput(
                  currentMonth.getFullYear().toString()
                );
                setShowMonthYearPicker(!showMonthYearPicker);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-bold text-white capitalize hover:bg-slate-800 transition-colors"
              title="Pilih bulan dan tahun"
            >
              {monthYear}
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {showMonthYearPicker ? (
            <>
              {/* Year input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Tahun
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={yearInput}
                  onChange={(e) =>
                    handleYearChange(e.target.value)
                  }
                  placeholder="Contoh: 1950"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Month picker */}
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleSelectMonth(index)}
                    className={`
                      px-2 py-2.5 rounded-lg text-xs font-semibold transition-all
                      ${
                        currentMonth.getMonth() === index
                          ? `${themeColor.bg} text-slate-950`
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    {month.substring(0, 3)}
                  </button>
                ))}
              </div>

              {/* Back to calendar */}
              <button
                type="button"
                onClick={() => setShowMonthYearPicker(false)}
                className="w-full mt-4 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Kembali ke Kalender
              </button>
            </>
          ) : (
            <>
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {[
                  'Min',
                  'Sen',
                  'Sel',
                  'Rab',
                  'Kam',
                  'Jum',
                  'Sab'
                ].map(day => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-slate-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      day && handleSelectDate(day)
                    }
                    disabled={!day}
                    className={`
                      p-2 text-sm rounded-lg font-medium transition-all
                      ${!day ? 'invisible' : ''}
                      ${
                        day &&
                        selectedDate?.getDate() === day &&
                        isSelectedMonth
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
            </>
          )}

          {/* Footer */}
          {!showMonthYearPicker && (
            <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
              <button
                type="button"
                onClick={handleToday}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setShowMonthYearPicker(false);
                  setIsOpen(false);
                }}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Kosongkan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
