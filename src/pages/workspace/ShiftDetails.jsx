// src/pages/workspace/ShiftDetails.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import client from '../../api/client';
import { getEmpId } from '../../utils/auth';

// ── helpers ───────────────────────────────────────────────────────────────────
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const toISO = (y, m, d) => {
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

const SHIFT_COLORS = {
  'morning':  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  'evening':  { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
  'night':    { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400'    },
  'general':  { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-400'   },
  'weekend':  { bg: 'bg-surface-50', text: 'text-surface-400', dot: 'bg-surface-300' },
  'default':  { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-400' },
};

const getShiftColors = (shiftName) => {
  if (!shiftName) return SHIFT_COLORS.default;
  const key = shiftName.toLowerCase();
  return SHIFT_COLORS[key] || SHIFT_COLORS.default;
};

const buildCalendar = (year, month, monthlyShifts, holidays) => {
  const first = new Date(year, month, 1).getDay();
  const last  = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = [];

  // Trailing prev month
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = first - 1; i >= 0; i--) {
    cells.push({ date: prevLast - i, currentMonth: false });
  }

  // Current month
  for (let d = 1; d <= last; d++) {
    const iso       = toISO(year, month, d);
    const shiftData = monthlyShifts[iso];
    const holiday   = holidays[iso];
    const isToday   = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    cells.push({
      date: d, iso, currentMonth: true, isToday,
      shift:   shiftData?.shift   || null,
      time:    shiftData?.time    || null,
      holiday: holiday?.name      || null,
      holidayType: holiday?.type  || null,
    });
  }

  // Pad to 42
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: d, currentMonth: false });
  }

  return cells;
};

// ── Legend ────────────────────────────────────────────────────────────────────
const Legend = () => (
  <div className="flex items-center gap-4 flex-wrap text-xs text-surface-500">
    {[
      { label: 'Holiday',  cls: 'bg-red-100 border border-red-200'     },
      { label: 'Weekend',  cls: 'bg-surface-100 border border-surface-200' },
      { label: 'Today',    cls: 'bg-primary-600'                        },
      { label: 'Shift',    cls: 'bg-amber-100 border border-amber-200'  },
    ].map(({ label, cls }) => (
      <div key={label} className="flex items-center gap-1.5">
        <div className={`w-3 h-3 rounded-sm ${cls}`} />
        <span>{label}</span>
      </div>
    ))}
  </div>
);

// ── Cell ──────────────────────────────────────────────────────────────────────
const Cell = ({ cell }) => {
  if (!cell.currentMonth) {
    return (
      <div className="min-h-[90px] p-2 bg-surface-50 rounded-xl border border-surface-100">
        <span className="text-xs text-surface-300 font-medium">{String(cell.date).padStart(2, '0')}</span>
      </div>
    );
  }

  const isWeekend   = cell.shift?.toLowerCase() === 'weekend';
  const isHoliday   = !!cell.holiday;
  const isMandatory = cell.holidayType?.toLowerCase() === 'mandatory';
  const colors      = getShiftColors(cell.shift);

  let cellBg = 'bg-surface-0 border-surface-100';
  if (isHoliday && isMandatory) cellBg = 'bg-red-50 border-red-200';
  else if (isHoliday)           cellBg = 'bg-orange-50 border-orange-200';
  else if (isWeekend)           cellBg = 'bg-surface-50 border-surface-100';

  return (
    <div className={`min-h-[90px] p-2 rounded-xl border flex flex-col gap-1 transition-all hover:shadow-card ${cellBg}`}>
      {/* Date number */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
          cell.isToday ? 'bg-primary-600 text-white' : 'text-surface-700'
        }`}>
          {String(cell.date).padStart(2, '0')}
        </span>

        {/* Shift dot */}
        {cell.shift && !isHoliday && !isWeekend && (
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
        )}
        {isHoliday && (
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isMandatory ? 'bg-red-400' : 'bg-orange-400'}`} />
        )}
      </div>

      {/* Holiday label */}
      {isHoliday && (
        <p className={`text-2xs font-semibold leading-tight line-clamp-2 ${isMandatory ? 'text-red-700' : 'text-orange-700'}`}>
          {cell.holiday}
        </p>
      )}

      {/* Shift info */}
      {!isHoliday && cell.shift && (
        <div className={`mt-auto rounded-lg px-1.5 py-1 ${colors.bg}`}>
          <p className={`text-2xs font-semibold ${colors.text}`}>{cell.shift}</p>
          {cell.time && (
            <p className={`text-2xs opacity-80 ${colors.text} font-mono`}>{cell.time}</p>
          )}
        </div>
      )}

      {/* Weekend */}
      {!isHoliday && isWeekend && (
        <p className="text-2xs text-surface-400 mt-auto">Weekend</p>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ShiftDetails = () => {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [monthlyShifts, setMonthlyShifts] = useState({});
  const [holidays,      setHolidays]      = useState({});
  const [location,      setLocation]      = useState('');
  const [loading,       setLoading]       = useState(true);
  const [shiftLoading,  setShiftLoading]  = useState(false);

  const monthLabel = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Fetch employee location once
  useEffect(() => {
    client.get(`/hrms/api/v1/employees/search/all?empId=${getEmpId()}`)
      .then(r => setLocation(r.data?.content?.[0]?.location?.toLowerCase() || 'default'))
      .catch(() => setLocation('default'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch shifts when month/year changes
  useEffect(() => {
    setShiftLoading(true);
    client.get(`/hrms/api/v1/employees/employee/getAllShifts/${getEmpId()}`, {
      params: { year, month: month + 1 }
    })
      .then(r => setMonthlyShifts(r.data || {}))
      .catch(() => setMonthlyShifts({}))
      .finally(() => setShiftLoading(false));
  }, [year, month]);

  // Fetch holidays when year/location changes
  useEffect(() => {
    if (!location) return;
    client.get('/hrms/api/v1/holiday-list', { params: { year, branch: location } })
      .then(r => {
        const map = {};
        (r.data || []).forEach(h => {
          if (h.holidayDate) {
            const iso = new Date(h.holidayDate).toISOString().split('T')[0];
            map[iso]  = { name: h.holidayName, type: h.holidayType };
          }
        });
        setHolidays(map);
      })
      .catch(() => setHolidays({}));
  }, [year, location]);

  const changeMonth = (delta) => {
    const d = new Date(year, month + delta);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const cells = buildCalendar(year, month, monthlyShifts, holidays);

  // Summary counts
  const summary = cells.filter(c => c.currentMonth).reduce((acc, c) => {
    if (c.holiday)                         acc.holidays++;
    else if (c.shift?.toLowerCase() === 'weekend') acc.weekends++;
    else if (c.shift)                      acc.shifts++;
    return acc;
  }, { shifts: 0, weekends: 0, holidays: 0 });

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Shift Calendar</h1>
          <p className="page-subtitle">Your shift schedule and holidays</p>
        </div>
        <button onClick={goToday} className="btn-secondary text-xs">Today</button>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        {[
          { label: 'Working Days', value: summary.shifts,   cls: 'text-primary-600' },
          { label: 'Weekends',     value: summary.weekends, cls: 'text-surface-500' },
          { label: 'Holidays',     value: summary.holidays, cls: 'text-red-600'     },
        ].map(({ label, value, cls }) => (
          <div key={label} className="card py-3 px-5 flex items-center gap-3">
            <span className={`text-2xl font-display font-bold ${cls}`}>{value}</span>
            <span className="text-xs text-surface-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div className="card p-0 overflow-hidden">
        {/* Nav bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors">
              <ChevronRight size={16} />
            </button>
            <h2 className="font-display font-bold text-surface-900 text-base ml-1">{monthLabel}</h2>
            {shiftLoading && (
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin ml-2" />
            )}
          </div>
          <Legend />
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-surface-100">
          {WEEKDAYS.map(d => (
            <div key={d} className={`px-2 py-2.5 text-center text-2xs font-bold tracking-widest uppercase ${
              d === 'SUN' || d === 'SAT' ? 'text-surface-400' : 'text-surface-500'
            }`}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1.5 p-3">
          {cells.map((cell, i) => <Cell key={i} cell={cell} />)}
        </div>
      </div>
    </div>
  );
};

export default ShiftDetails;