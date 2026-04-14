"use client";

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
    value: string; // YYYY-MM-DD or empty
    onChange: (value: string) => void;
    min?: string; // YYYY-MM-DD
    max?: string; // YYYY-MM-DD
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const POPOVER_MIN_W = 280;
const POPOVER_APPROX_MAX_H = 400;

function parseDate(str: string): Date | null {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function displayDate(str: string): string {
    const d = parseDate(str);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DatePicker({
    value,
    onChange,
    min,
    max,
    placeholder = 'Select date',
    className = '',
    disabled = false,
    required,
    name,
}: DatePickerProps) {
    const today = new Date();
    const selected = parseDate(value);
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
    const [showYearPicker, setShowYearPicker] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [popoverBox, setPopoverBox] = useState<{ top: number; left: number; width: number } | null>(null);

    useLayoutEffect(() => {
        if (!open) {
            setPopoverBox(null);
            return;
        }
        const update = () => {
            const trigger = ref.current;
            if (!trigger) return;
            const rect = trigger.getBoundingClientRect();
            const width = Math.max(rect.width, POPOVER_MIN_W);
            let left = rect.left;
            if (left + width > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - width - 8);
            } else {
                left = Math.max(8, left);
            }
            const gap = 6;
            let top = rect.bottom + gap;
            const spaceBelow = window.innerHeight - rect.bottom - gap;
            if (spaceBelow < POPOVER_APPROX_MAX_H && rect.top > POPOVER_APPROX_MAX_H) {
                top = Math.max(8, rect.top - POPOVER_APPROX_MAX_H - gap);
            }
            if (top + POPOVER_APPROX_MAX_H > window.innerHeight - 8) {
                top = Math.max(8, window.innerHeight - POPOVER_APPROX_MAX_H - 8);
            }
            setPopoverBox({ top, left, width });
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open, viewMonth, viewYear, showYearPicker]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (ref.current?.contains(t)) return;
            if (popoverRef.current?.contains(t)) return;
            setOpen(false);
            setShowYearPicker(false);
        };
        if (open) {
            document.addEventListener('mousedown', handler);
        }
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (selected) {
            setViewYear(selected.getFullYear());
            setViewMonth(selected.getMonth());
        }
    }, [value]);

    const minDate = parseDate(min ?? '');
    const maxDate = parseDate(max ?? '');

    function isDisabled(date: Date): boolean {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
    }

    function getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year: number, month: number): number {
        return new Date(year, month, 1).getDay();
    }

    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    }

    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    }

    function selectDay(day: number) {
        const d = new Date(viewYear, viewMonth, day);
        if (isDisabled(d)) return;
        onChange(formatDate(d));
        setOpen(false);
        setShowYearPicker(false);
    }

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let y = currentYear + 3; y >= currentYear - 100; y--) years.push(y);

    const calendarPanel = open && popoverBox && typeof document !== 'undefined' ? (
        createPortal(
            <div
                ref={popoverRef}
                style={{
                    position: 'fixed',
                    top: popoverBox.top,
                    left: popoverBox.left,
                    width: popoverBox.width,
                    maxHeight: 'min(85vh, 420px)',
                    zIndex: 200,
                }}
                className="overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 text-gray-900"
            >
                {showYearPicker ? (
                    <>
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-gray-900">Select Year</span>
                            <button type="button" onClick={() => setShowYearPicker(false)} className="text-xs text-gray-500 hover:text-gray-800 font-medium">Back</button>
                        </div>
                        <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                            {years.map(y => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                                    className={`p-2 rounded-lg text-sm font-medium transition-colors
                                        ${y === viewYear ? 'bg-[#09BF44] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-3">
                            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowYearPicker(true)}
                                className="font-bold text-gray-900 hover:text-[#09BF44] transition-colors text-sm"
                            >
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </button>
                            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 mb-1">
                            {DAY_NAMES.map(d => (
                                <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const date = new Date(viewYear, viewMonth, day);
                                const disabled = isDisabled(date);
                                const isSelected = selected && formatDate(date) === value;
                                const isToday = formatDate(date) === formatDate(today);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => selectDay(day)}
                                        className={`relative h-8 w-8 mx-auto rounded-lg text-sm font-medium transition-all
                                            ${isSelected ? 'bg-[#09BF44] text-white shadow-sm' : ''}
                                            ${!isSelected && isToday ? 'text-[#09BF44] font-black' : ''}
                                            ${!isSelected && !disabled ? 'hover:bg-[#09BF44]/10 hover:text-[#09BF44] text-gray-700' : ''}
                                            ${disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        {day}
                                        {isToday && !isSelected && (
                                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#09BF44]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {!minDate || today >= minDate ? (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isDisabled(today)) {
                                            onChange(formatDate(today));
                                            setOpen(false);
                                        }
                                    }}
                                    className="w-full text-center text-xs text-[#09BF44] font-bold hover:underline"
                                >
                                    Today
                                </button>
                            </div>
                        ) : null}
                    </>
                )}
            </div>,
            document.body
        )
    ) : null;

    return (
        <div ref={ref} className={`relative ${className}`}>
            {name && (
                <input type="hidden" name={name} value={value} required={required} />
            )}
            <button
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) setOpen(!open); }}
                className={`w-full p-4 bg-gray-50 rounded-xl border-2 text-left flex items-center justify-between transition-all outline-none font-medium
                    ${open ? 'border-[#09BF44] bg-white' : 'border-transparent'}
                    ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-200 cursor-pointer'}
                    ${value ? 'text-gray-900' : 'text-gray-400'}`}
            >
                <span className="text-sm md:text-base">{value ? displayDate(value) : placeholder}</span>
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
            {calendarPanel}
        </div>
    );
}
