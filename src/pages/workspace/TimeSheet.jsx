// src/pages/workspace/TimeSheet.jsx
import { useState, useEffect } from 'react';
import { Calendar, Printer, Download, MoreHorizontal, X } from 'lucide-react';
import client from '../../api/client';
import { getEmpId } from '../../utils/auth';

// ── helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtHours = t => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// Status → tailwind badge classes
const STATUS_STYLES = {
  'present':          'bg-green-100 text-green-700',
  'absent':           'bg-red-100 text-red-700',
  'half day':         'bg-amber-100 text-amber-700',
  'halfday':          'bg-amber-100 text-amber-700',
  'permission':       'bg-blue-100 text-blue-700',
  'full-day':         'bg-green-100 text-green-700',
  'week off':         'bg-yellow-100 text-yellow-800',
  'disclosed':        'bg-lime-100 text-lime-700',
  'optional holiday': 'bg-teal-100 text-teal-700',
  'sick leave':       'bg-red-100 text-red-600',
  'casual leave':     'bg-purple-100 text-purple-700',
  'comp off':         'bg-cyan-100 text-cyan-700',
  'earned leave':     'bg-emerald-100 text-emerald-700',
  'lop':              'bg-rose-100 text-rose-700',
  'half sick leave':  'bg-orange-100 text-orange-700',
  'half casual leave':'bg-fuchsia-100 text-fuchsia-700',
  'half comp off':    'bg-cyan-100 text-cyan-600',
  'half earned leave':'bg-green-50 text-green-600',
  'pending':          'bg-violet-100 text-violet-700',
};

const getStatusClass = status => {
  if (!status) return 'bg-surface-100 text-surface-500';
  const lower = status.toLowerCase();
  if (lower.startsWith('holiday - ')) return 'bg-indigo-100 text-indigo-700';
  return STATUS_STYLES[lower] || 'bg-surface-100 text-surface-600';
};

const getStatusLabel = status => {
  if (!status) return '—';
  const lower = status.toLowerCase();
  if (lower === 'halfday')    return 'Half Day';
  if (lower === 'full-day')   return 'Full Day';
  return status;
};

const canRegularize = status => {
  if (!status) return false;
  const lower = status.toLowerCase();
  return lower !== 'week off' && !lower.startsWith('holiday - ');
};

// ── Regularization Modal ──────────────────────────────────────────────────────
const RegularizationModal = ({ record, onClose, onSuccess }) => {
  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reason,   setReason]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!checkIn || !checkOut) return setError('Please select both check-in and check-out times.');
    if (!reason.trim())        return setError('Please enter a reason.');

    const toISO = (date, time) => `${date}T${time}:00`;

    setSaving(true);
    try {
      await client.post('/hrms/api/v1/employees/regularize/request', {
        empId:            getEmpId(),
        date:             record.date,
        checkInDateTime:  toISO(record.date, checkIn),
        checkOutDateTime: toISO(record.date, checkOut),
        reason,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit regularization.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-0 rounded-2xl shadow-card-md w-full max-w-sm animate-slide-down">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <div>
            <h3 className="font-display font-bold text-surface-900">Regularization</h3>
            <p className="text-xs text-surface-400 mt-0.5">{fmtDate(record.date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100"><X size={16} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {error && (
            <p className="text-xs text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Check In</label>
              <input className="input" type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Check Out</label>
              <input className="input" type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="input-label">Reason</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Enter reason…" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Summary bar ───────────────────────────────────────────────────────────────
const SummaryBar = ({ data }) => {
  const counts = data.reduce((acc, row) => {
    const s = (row.status || '').toLowerCase();
    if (s === 'present' || s === 'full-day') acc.present++;
    else if (s === 'absent')                 acc.absent++;
    else if (s.includes('leave'))            acc.leave++;
    else if (s === 'half day' || s === 'halfday') acc.half++;
    return acc;
  }, { present: 0, absent: 0, leave: 0, half: 0 });

  const items = [
    { label: 'Present',   value: counts.present, cls: 'text-green-600'  },
    { label: 'Absent',    value: counts.absent,  cls: 'text-red-600'    },
    { label: 'On Leave',  value: counts.leave,   cls: 'text-purple-600' },
    { label: 'Half Days', value: counts.half,    cls: 'text-amber-600'  },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {items.map(({ label, value, cls }) => (
        <div key={label} className="card text-center py-3">
          <p className={`text-2xl font-display font-bold ${cls}`}>{value}</p>
          <p className="text-2xs text-surface-400 mt-0.5 uppercase tracking-wide">{label}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const TimeSheet = () => {
  const now = new Date();
  const [month,      setMonth]      = useState(MONTHS[now.getMonth()]);
  const [year,       setYear]       = useState(now.getFullYear());
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [regRecord,  setRegRecord]  = useState(null);   // record to regularize
  const [actionRow,  setActionRow]  = useState(null);   // row with open action menu
  const [refreshKey, setRefreshKey] = useState(0);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  useEffect(() => {
    setLoading(true);
    const monthNum = MONTHS.indexOf(month) + 1;
    client.get('/hrms/api/v1/employee/attendance/get-attendance-filters', {
      params: { year, month: monthNum, empId: getEmpId() }
    })
      .then(r => setData(r.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [month, year, refreshKey]);

  // Close action menu when clicking elsewhere
  useEffect(() => {
    const handler = () => setActionRow(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePrint = () => {
    const rows = data.map(r => `
      <tr>
        <td>${fmtDate(r.date)}</td>
        <td>${r.checkIn || '—'}</td>
        <td>${r.checkOut || '—'}</td>
        <td>${r.permission || '—'}</td>
        <td>${fmtHours(r.productionHours)}</td>
        <td>${getStatusLabel(r.status)}</td>
      </tr>`).join('');

    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Attendance ${month} ${year}</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f2f2f2}</style>
      </head><body>
      <h2>Attendance — ${month} ${year}</h2>
      <table><thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Permission</th><th>Hours</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.onload=()=>{setTimeout(()=>{window.print();window.close()},200)}</script>
      </body></html>`);
    win.document.close();
  };

  const handleExcelExport = () => {
    const header = ['Date', 'Check In', 'Check Out', 'Permission', 'Total Hours', 'Status'];
    const rows   = data.map(r => [
      fmtDate(r.date), r.checkIn || '', r.checkOut || '',
      r.permission || '', fmtHours(r.productionHours), getStatusLabel(r.status)
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `attendance_${month}_${year}.csv`;
    a.click();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Your monthly attendance record</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExcelExport} className="btn-secondary" title="Export CSV">
            <Download size={14} />
          </button>
          <button onClick={handlePrint} className="btn-secondary" title="Print">
            <Printer size={14} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-surface-0 border border-surface-200 rounded-xl px-3 py-2">
          <Calendar size={14} className="text-surface-400" />
          <select
            className="text-sm text-surface-800 bg-transparent focus:outline-none"
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-surface-0 border border-surface-200 rounded-xl px-3 py-2">
          <Calendar size={14} className="text-surface-400" />
          <select
            className="text-sm text-surface-800 bg-transparent focus:outline-none"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      {!loading && data.length > 0 && <SummaryBar data={data} />}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-surface-100 rounded-xl animate-pulse" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <Calendar size={32} className="text-surface-300 mb-3" />
          <p className="text-surface-500 text-sm">No attendance records for {month} {year}.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Permission</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td className="font-medium">{fmtDate(row.date)}</td>
                  <td className="font-mono text-xs">{row.checkIn  || '—'}</td>
                  <td className="font-mono text-xs">{row.checkOut || '—'}</td>
                  <td>{row.permission || '—'}</td>
                  <td className="font-mono text-xs">{fmtHours(row.productionHours)}</td>
                  <td>
                    <span className={`badge ${getStatusClass(row.status)}`}>
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                  <td>
                    {canRegularize(row.status) && (
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActionRow(actionRow === i ? null : i)}
                          className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {actionRow === i && (
                          <div className="absolute right-0 top-8 w-40 bg-surface-0 rounded-xl shadow-card-md border border-surface-100 py-1 z-20 animate-slide-down">
                            <button
                              onClick={() => { setRegRecord(row); setActionRow(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                            >
                              Regularization
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Regularization modal */}
      {regRecord && (
        <RegularizationModal
          record={regRecord}
          onClose={() => setRegRecord(null)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
};

export default TimeSheet;