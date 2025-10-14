'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { getViewerRole } from '@/lib/data';
import '@/app/globals.css';

/* ---- Colors ---- */
const palette = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  pageBg: '#fff4e6',
  border: '#3d0000',
  accent: '#E07A5F',
  peachSoft: 'rgba(249,201,177,0.55)', // buttons default (no border)
  peachHover: 'rgba(249,201,177,0.9)', // hover deeper
};

type Carer = { id: string; name: string; role?: 'Carer' | 'Management' };
type ShiftEntry = { start: string; end: string; label?: string };
type ScheduleByCarer = Record<string, Record<string, ShiftEntry | undefined>>;

function isoDate(d: Date) {
  const tzOff = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOff * 60000);
  return local.toISOString().slice(0, 10);
}
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function shiftDuration(start: string, end: string) {
  try {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const hours = diff / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  } catch {
    return '';
  }
}

/* Demo data */
const DEMO_CARERS: Carer[] = [
  { id: 'c-hannah', name: 'Hannah Brown', role: 'Carer' },
  { id: 'c-john', name: 'John Smith', role: 'Carer' },
  { id: 'c-florence', name: 'Florence Edwards', role: 'Carer' },
  { id: 'c-michael', name: 'Michael Chen', role: 'Carer' },
];
const DEMO_SCHEDULE: ScheduleByCarer = {
  'c-hannah': { '2025-10-06': { start: '07:00', end: '15:00', label: 'Morning' } },
  'c-john': { '2025-10-07': { start: '15:00', end: '22:00', label: 'Afternoon' } },
  'c-florence': { '2025-10-09': { start: '22:00', end: '07:00', label: 'Evening' } },
  'c-michael': {},
};

export default function StaffSchedulePage() {
  const router = useRouter();
  const onLogoClick = () => router.push('/management_dashboard');

  // Role
  const [role, setRole] = useState<'family' | 'carer' | 'management' | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await getViewerRole();
        setRole(r);
      } catch {
        setRole(null);
      }
    })();
  }, []);
  const isManagement = role === 'management';
  const isReadonly = !isManagement;

  // State
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [carers, setCarers] = useState<Carer[]>(() => {
    try {
      const raw = localStorage.getItem('staff_carers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
    return DEMO_CARERS;
  });
  const [schedule, setSchedule] = useState<ScheduleByCarer>(() => {
    try {
      const raw = localStorage.getItem('staff_schedule_by_carer');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed || DEMO_SCHEDULE;
      }
    } catch {}
    return DEMO_SCHEDULE;
  });
  const [shiftPresets, setShiftPresets] = useState({
    Morning: { start: '07:00', end: '15:00' },
    Afternoon: { start: '15:00', end: '22:00' },
    Evening: { start: '22:00', end: '07:00' },
  });
  const [search, setSearch] = useState<string>('');
  const [modal, setModal] = useState<{
    open: boolean;
    carerId?: string;
    dateISO?: string;
    start?: string;
    end?: string;
    label?: string;
  }>({ open: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addCarerModal, setAddCarerModal] = useState<{ open: boolean; name?: string; role: 'Carer' | 'Management' }>({
    open: false,
    role: 'Carer',
  });

  useEffect(() => {
    localStorage.setItem('staff_carers', JSON.stringify(carers));
    localStorage.setItem('staff_schedule_by_carer', JSON.stringify(schedule));
  }, [carers, schedule]);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  const changeWeek = (weeks: number) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + weeks * 7);
    setWeekStart(startOfWeek(newDate));
  };

  const openAssignModal = (carerId: string, dateISO: string) => {
    if (isReadonly) return;
    const existing = schedule?.[carerId]?.[dateISO];
    setModal({
      open: true,
      carerId,
      dateISO,
      start: existing?.start || '',
      end: existing?.end || '',
      label: existing?.label || '',
    });
  };
  const saveModal = () => {
    if (isReadonly) return setModal({ open: false });
    if (!modal.carerId || !modal.dateISO) return setModal({ open: false });
    const { carerId, dateISO, start = '', end = '', label = '' } = modal;
    setSchedule((prev) => {
      const copy: ScheduleByCarer = structuredClone(prev || {});
      if (!copy[carerId]) copy[carerId] = {};
      copy[carerId][dateISO] = { start, end, label };
      return copy;
    });
    setModal({ open: false });
  };
  const removeShift = (carerId: string, dateISO: string) => {
    if (isReadonly) return;
    setSchedule((prev) => {
      const copy: ScheduleByCarer = structuredClone(prev || {});
      delete copy[carerId]?.[dateISO];
      return copy;
    });
  };

  const visibleCarers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return carers;
    return carers.filter((c) => c.name.toLowerCase().includes(q));
  }, [carers, search]);

  const getShift = (carerId: string, dateISO: string) => schedule?.[carerId]?.[dateISO];

  const weekLabel = useMemo(() => {
    const a = days[0];
    const b = days[6];
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${a.toLocaleDateString(undefined, opts)} — ${b.toLocaleDateString(undefined, opts)}`;
  }, [days]);

  const addCarer = () => {
    if (isReadonly) return;
    const name = addCarerModal.name?.trim();
    if (!name) return;
    const id = 'c-' + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    if (carers.some((c) => c.id === id || c.name === name)) {
      alert('Staff already exists');
      return;
    }
    setCarers((prev) => [...prev, { id, name, role: addCarerModal.role }]);
    setAddCarerModal({ open: false, role: 'Carer' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: palette.pageBg }}>
      <DashboardChrome
        hideBanner={true}
        page="staff-schedule"
        headerTitle="Staff Schedule"
        bannerTitle=""
        showClientPicker={false}
        navItems={[
          { label: 'Staff List', href: '/management_dashboard/staff_list' },
        ]}
        clients={[]}
        onClientChange={() => {}}
        colors={{ header: palette.header, banner: palette.banner, text: palette.text }}
        onLogoClick={onLogoClick}
      >
        {/* Top toolbar */}
        <div
          className="flex justify-between items-center px-6 py-4 shadow-md mt-4"
          style={{ backgroundColor: palette.banner }}
        >
          {/* Week navigation */}
          <div className="flex items-center gap-4 w-1/3 px-4 py-2 rounded-2xl" style={{ backgroundColor: palette.pageBg }}>
            <button
              onClick={() => changeWeek(-1)}
              className="px-4 py-2 rounded-2xl font-semibold transition-colors"
              style={{ backgroundColor: palette.peachSoft, color: palette.header }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
              aria-label="Previous week"
              title="Previous week"
            >
              ◀
            </button>
            <div className="flex-1 text-center font-bold text-xl" style={{ color: palette.header }}>
              {weekLabel}
            </div>
            <button
              onClick={() => changeWeek(1)}
              className="px-4 py-2 rounded-2xl font-semibold transition-colors"
              style={{ backgroundColor: palette.peachSoft, color: palette.header }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
              aria-label="Next week"
              title="Next week"
            >
              ▶
            </button>
          </div>

            {/* Right buttons — management only */}
            <div className="flex items-center gap-6 justify-end w-1/3">

            {/* Print — visible to everyone */}
            <button
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="inline-flex items-center px-6 py-3 rounded-2xl border border-black/30 bg-white font-extrabold text-xl hover:bg-black/5 transition-colors"
                title="Print"
                aria-label="Print"
            >
                Print
            </button>
            {isManagement && (
                <>
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="px-5 py-2.5 rounded-2xl text-base font-semibold transition-colors"
                    style={{ backgroundColor: palette.pageBg, color: '#000000ff' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2987aff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.pageBg)}
                >
                    Shift Settings
                </button>
                </>
            )}
            </div>

        </div>

        {/* Table */}
        <section className="w-full px-6 py-6">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full table-auto border-collapse text-black">
              <thead>
                <tr style={{ backgroundColor: palette.header }}>
                  <th className="p-3 py-5 text-left border" style={{ color: 'white' }}>
                    Staff
                  </th>
                  {days.map((d) => {
                    const label = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
                    const iso = isoDate(d);
                    return (
                      <th key={iso} className="p-3 py-5 text-center border" style={{ backgroundColor: palette.header, color: 'white' }}>
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{label}</span>
                          <span className="text-sm">{iso}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleCarers.map((carer) => (
                  <tr key={carer.id}>
                    {/* Carer cell */}
                    <td className="p-3 py-5 align-top border" style={{ backgroundColor: 'white' }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3d0000] font-semibold"
                            style={{ boxShadow: '0 0 0 2px rgba(61,0,0,0.25) inset' }}
                          >
                            {carer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-black">{carer.name}</div>
                            <div className="text-sm text-black/70">{carer.role || 'Carer'}</div>
                          </div>
                        </div>

                        {isManagement && (
                          <button
                            onClick={() => {
                              if (!confirm(`Delete ${carer.name}?`)) return;
                              setCarers((prev) => prev.filter((c) => c.id !== carer.id));
                              setSchedule((prev) => {
                                const copy = { ...prev };
                                delete copy[carer.id];
                                return copy;
                              });
                            }}
                            className="px-3 py-1 rounded-2xl text-sm font-semibold transition-colors"
                            style={{ color: palette.header, backgroundColor: palette.peachSoft }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Day cells */}
                    {days.map((d) => {
                      const iso = isoDate(d);
                      const s = getShift(carer.id, iso);
                      const isToday = iso === isoDate(new Date());
                      return (
                        <td
                          key={iso}
                          className="p-3 py-5 text-center border"
                          style={{ backgroundColor: isToday ? '#d7c1bbff' : 'white' }}
                        >
                          {s ? (
                            <div className="inline-flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: isToday ? 'white' : palette.pageBg }}>
                              <div className="text-sm text-black font-semibold">
                                {(s.label === 'Morning' && 'Morning') ||
                                  (s.label === 'Afternoon' && 'Afternoon') ||
                                  (s.label === 'Evening' && 'Evening') ||
                                  'Custom'}{' '}
                                ({s.start} — {s.end})
                              </div>
                              <div className="text-xs text-black/70">({shiftDuration(s.start, s.end)})</div>

                              {isManagement && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openAssignModal(carer.id, iso)}
                                    className="text-xs px-3 py-1 rounded-2xl font-semibold transition-colors"
                                    style={{ backgroundColor: palette.peachSoft, color: palette.header }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeShift(carer.id, iso)}
                                    className="text-xs px-3 py-1 rounded-2xl font-semibold transition-colors"
                                    style={{ backgroundColor: palette.peachSoft, color: palette.header }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : isManagement ? (
                            <button
                              onClick={() => openAssignModal(carer.id, iso)}
                              className="text-sm px-3 py-2 rounded-2xl font-semibold transition-colors"
                              style={{ backgroundColor: palette.peachSoft, color: palette.header }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                            >
                              Add Shift
                            </button>
                          ) : (
                            <span className="text-sm text-black/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modals — management only, borderless shells */}
        {isManagement && addCarerModal.open && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
              <h3 className="text-lg font-semibold mb-3">Add Staff</h3>
              <label className="block mb-2 text-sm">Name</label>
              <input
                type="text"
                value={addCarerModal.name || ''}
                onChange={(e) => setAddCarerModal((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-2xl mb-3"
                style={{ backgroundColor: '#f7f7f7' }}
              />
              <label className="block mb-2 text-sm">Role</label>
              <select
                value={addCarerModal.role}
                onChange={(e) => setAddCarerModal((prev) => ({ ...prev, role: e.target.value as 'Carer' | 'Management' }))}
                className="w-full px-3 py-2 rounded-2xl mb-4"
                style={{ backgroundColor: '#f7f7f7' }}
              >
                <option>Carer</option>
                <option>Management</option>
              </select>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAddCarerModal({ open: false, role: 'Carer' })}
                  className="px-4 py-2 rounded-2xl font-semibold transition-colors"
                  style={{ backgroundColor: palette.peachSoft, color: palette.header }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                >
                  Cancel
                </button>
                <button
                  onClick={addCarer}
                  className="px-4 py-2 rounded-2xl font-semibold transition-colors"
                  style={{ backgroundColor: palette.peachSoft, color: palette.header }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {isManagement && settingsOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
              <h3 className="text-lg font-semibold mb-4">Shift Settings</h3>
              {(['Morning', 'Afternoon', 'Evening'] as const).map((key) => (
                <div key={key} className="flex items-center justify-between mb-3">
                  <div className="w-24">{key}</div>
                  <input
                    type="time"
                    value={shiftPresets[key].start}
                    onChange={(e) => setShiftPresets((p) => ({ ...p, [key]: { ...p[key], start: e.target.value } }))}
                    className="px-2 py-2 rounded-2xl text-sm"
                    style={{ backgroundColor: '#f7f7f7' }}
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={shiftPresets[key].end}
                    onChange={(e) => setShiftPresets((p) => ({ ...p, [key]: { ...p[key], end: e.target.value } }))}
                    className="px-2 py-2 rounded-2xl text-sm"
                    style={{ backgroundColor: '#f7f7f7' }}
                  />
                </div>
              ))}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 rounded-2xl font-semibold transition-colors"
                  style={{ backgroundColor: palette.peachSoft, color: palette.header }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {isManagement && modal.open && modal.carerId && modal.dateISO && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
              <h3 className="text-lg font-semibold mb-3">Assign Shift</h3>
              <p className="text-sm mb-3">
                <strong>Staff:</strong> {carers.find((c) => c.id === modal.carerId)?.name} ·{' '}
                <strong>Date:</strong> {modal.dateISO}
              </p>
              <label className="block mb-2 text-sm">Presets</label>
              <div className="flex gap-2 mb-4 flex-wrap">
                {Object.entries(shiftPresets).map(([key, { start, end }]) => (
                  <button
                    key={key}
                    onClick={() => setModal((m) => ({ ...m, label: key, start, end }))}
                    className="px-3 py-2 rounded-2xl text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: modal.label === key ? palette.peachHover : palette.peachSoft,
                      color: palette.header,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                    onMouseLeave={(e) => {
                      if (modal.label !== key) e.currentTarget.style.backgroundColor = palette.peachSoft;
                    }}
                  >
                    {key}
                  </button>
                ))}
                <button
                  onClick={() => setModal((m) => ({ ...m, label: 'Custom', start: '', end: '' }))}
                  className="px-3 py-2 rounded-2xl text-sm font-semibold transition-colors"
                  style={{ backgroundColor: modal.label === 'Custom' ? palette.peachHover : palette.peachSoft, color: palette.header }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                  onMouseLeave={(e) => {
                    if (modal.label !== 'Custom') e.currentTarget.style.backgroundColor = palette.peachSoft;
                  }}
                >
                  Custom
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <label className="flex flex-col text-sm">
                  <span className="text-xs mb-1">Start</span>
                  <input
                    type="time"
                    value={modal.start || ''}
                    onChange={(e) => (modal.label === 'Custom' ? setModal((m) => ({ ...m, start: e.target.value })) : null)}
                    disabled={modal.label !== 'Custom'}
                    className={`px-3 py-2 rounded-2xl text-black ${modal.label !== 'Custom' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: modal.label !== 'Custom' ? '#eee' : '#f7f7f7' }}
                  />
                </label>
                <label className="flex flex-col text-sm">
                  <span className="text-xs mb-1">End</span>
                  <input
                    type="time"
                    value={modal.end || ''}
                    onChange={(e) => (modal.label === 'Custom' ? setModal((m) => ({ ...m, end: e.target.value })) : null)}
                    disabled={modal.label !== 'Custom'}
                    className={`px-3 py-2 rounded-2xl text-black ${modal.label !== 'Custom' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: modal.label !== 'Custom' ? '#eee' : '#f7f7f7' }}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModal({ open: false })}
                  className="px-4 py-2 rounded-2xl font-semibold transition-colors"
                  style={{ backgroundColor: palette.peachSoft, color: palette.header }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                >
                  Cancel
                </button>
                <button
                  onClick={saveModal}
                  className="px-4 py-2 rounded-2xl font-semibold transition-colors"
                  style={{ backgroundColor: palette.peachSoft, color: palette.header }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.peachHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = palette.peachSoft)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardChrome>
    </div>
  );
}
