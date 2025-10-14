'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import '@/styles/fullcalendar.css';

// Load FullCalendar on the client only
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

type Task = {
  id: string;
  title: string;
  nextDue: string; // YYYY-MM-DD
};

type CalendarPanelProps = {
  tasks: Task[];
  onDateClick: (date: string) => void;
  // Parent can listen when the visible month/year changes
  onMonthYearChange?: (year: number, month: number) => void; // month: 1..12
};

// Format Date (local time) as YYYY-MM-DD
function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function CalendarPanel(props: CalendarPanelProps) {
  const { tasks = [], onDateClick, onMonthYearChange } = props;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);

  // Current visible month/year (driven by FullCalendar view)
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1..12

  // Month/Year picker state (triggered by the calendar icon)
  const [openPicker, setOpenPicker] = useState<boolean>(false);

  // Absolute position for the icon (to the RIGHT of the brown title)
  const [iconPos, setIconPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const taskDates = useMemo(() => new Set(tasks.map((t) => t.nextDue)), [tasks]);
  const todayStr = yyyymmdd(new Date());

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const yearOptions = useMemo(() => {
    const base = year || new Date().getFullYear();
    const arr: number[] = [];
    for (let y = base - 6; y <= base + 6; y += 1) arr.push(y);
    return arr;
  }, [year]);

  // Jump FullCalendar to a specific year & month
  const goto = (y: number, m: number) => {
    if (apiRef.current) {
      apiRef.current.gotoDate(new Date(y, m - 1, 1));
    }
  };

  // Position the icon immediately to the RIGHT of the brown title
  const positionIconNextToTitle = () => {
    const root = rootRef.current;
    if (!root) return;
    const title = root.querySelector('.fc-toolbar-title') as HTMLElement | null;
    if (!title) return;

    const hostBox = root.getBoundingClientRect();
    const tBox = title.getBoundingClientRect();

    setIconPos({
      top: tBox.top - hostBox.top + tBox.height / 2, // vertically centered
      left: tBox.right - hostBox.left + 8            // 8px to the right
    });
  };

  // Called whenever FullCalendar view changes (prev/next/initial)
  const onDatesSet = (arg: any) => {
    apiRef.current = arg.view.calendar;

    const cur = arg.view.calendar.getDate();
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;

    setYear(y);
    setMonth(m);
    if (onMonthYearChange) onMonthYearChange(y, m);

    // Recompute icon position after toolbar is painted
    setTimeout(positionIconNextToTitle, 0);
  };

  // Keep the icon aligned on window resize
  useEffect(() => {
    const onResize = () => positionIconNextToTitle();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Allow closing the picker with Esc
  useEffect(() => {
    if (!openPicker) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPicker(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPicker]);

  return (
    <div ref={rootRef} className="relative">
      {/* Borderless calendar icon to the RIGHT of the brown title */}
      <button
        type="button"
        aria-label="Pick month and year"
        onClick={() => setOpenPicker((v) => !v)}
        className="absolute z-10 -translate-y-1/2 p-1 hover:bg-black/5 rounded"
        style={{ top: iconPos.top, left: iconPos.left, background: 'transparent' }}
        title="Pick month & year"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="#3A0000" strokeWidth="2" />
          <path d="M8 2v4M16 2v4M3 9h18" stroke="#3A0000" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* FullCalendar keeps its single brown center title intact */}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
        height="auto"
        events={[]}
        fixedWeekCount={false}
        showNonCurrentDates={false}
        datesSet={onDatesSet}
        dateClick={(info: any) => {
          const d = yyyymmdd(info.date);
          onDateClick(taskDates.has(d) ? d : '');
        }}
        dayCellClassNames={(info: any) => {
          const d = yyyymmdd(info.date);
          const cls: string[] = [];
          if (d === todayStr) cls.push('fc-today-custom');
          if (taskDates.has(d)) cls.push('fc-task-day');
          return cls;
        }}
      />

      {/* Month / Year picker popover */}
      {openPicker && (
        <div
          className="absolute z-20 rounded-lg bg-white shadow p-2"
          style={{ top: iconPos.top + 14, left: iconPos.left }}
        >
          <div className="flex items-center gap-2">
            <select
              aria-label="Select month"
              className="rounded px-2 py-1 border"
              value={month}
              onChange={(e) => {
                const m = parseInt(e.target.value, 10);
                goto(year, m);
                setOpenPicker(false);
              }}
            >
              {months.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>

            <select
              aria-label="Select year"
              className="rounded px-2 py-1 border"
              value={year}
              onChange={(e) => {
                const y = parseInt(e.target.value, 10);
                goto(y, month);
                setOpenPicker(false);
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* ✅ Close button (restored) */}
            <button
              type="button"
              aria-label="Close picker"
              onClick={() => setOpenPicker(false)}
              className="ml-1 px-2 py-1 rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
