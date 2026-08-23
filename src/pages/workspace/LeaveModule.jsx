// src/pages/workspace/LeaveModule.jsx
import { useState, useEffect, useCallback } from 'react';
import { Umbrella, Clock, ChevronDown, X, Upload, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import client from '../../api/client';
import { getEmpId } from '../../utils/auth';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const getDatesBetween = (from, to) => {
  if (!from || !to) return [];
  const dates = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const fmtMinutes = mins => {
  if (!mins) return '0h';
  const h = Math.floor(mins / 60), m = mins % 60;
  return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : ''].filter(Boolean).join(' ') || '0h';
};

const today = () => new Date().toISOString().split('T')[0];
const thisMonth = () => new Date().toISOString().slice(0, 7);

const STATUS_BADGE = {
  Approved:  'badge-green',
  Rejected:  'badge-red',
  Pending:   'badge-amber',
  Cancelled: 'badge-gray',
};

// ── shared UI ─────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-surface-0 rounded-2xl shadow-card-md w-full max-w-md max-h-[90vh] flex flex-col animate-slide-down">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 flex-shrink-0">
        <h3 className="font-display font-bold text-surface-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100"><X size={16} /></button>
      </div>
      <div className="p-6 overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

const InfoRow = ({ label, value, highlight }) => (
  <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm ${highlight ? 'bg-primary-50' : 'bg-surface-50'}`}>
    <span className="text-surface-500">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-primary-700' : 'text-surface-800'}`}>{value}</span>
  </div>
);

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md border animate-slide-down text-sm font-medium ${
    type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
  }`}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

// ── Leave Apply Modal ─────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  { value: 'Casual Leave',      label: 'Casual Leave' },
  { value: 'Sick Leave',        label: 'Sick Leave' },
  { value: 'Earned Leave',      label: 'Earned Leave' },
  { value: 'Comp-Off',          label: 'Comp Off' },
  { value: 'Optional-Holiday',  label: 'Optional Holiday' },
  { value: 'Maternity Leave',   label: 'Maternity Leave' },
  { value: 'Wedding Leave',     label: 'Wedding Leave' },
];

const DAY_OPTIONS = [
  { value: 'fullday', label: 'Full Day' },
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
];

const LEAVE_CONFIG = {
  'Casual Leave':     { showDates: true,  showList: true,  showUpload: false,          showHolidays: false, showTotalDays: false },
  'Sick Leave':       { showDates: true,  showList: true,  showUpload: d => d >= 3,    showHolidays: false, showTotalDays: false },
  'Earned Leave':     { showDates: true,  showList: true,  showUpload: false,          showHolidays: false, showTotalDays: false },
  'Comp-Off':         { showDates: true,  showList: true,  showUpload: false,          showHolidays: false, showTotalDays: false },
  'Optional-Holiday': { showDates: false, showList: false, showUpload: false,          showHolidays: true,  showTotalDays: false },
  'Maternity Leave':  { showDates: true,  showList: false, showUpload: false,          showHolidays: false, showTotalDays: true  },
  'Wedding Leave':    { showDates: true,  showList: false, showUpload: false,          showHolidays: false, showTotalDays: true  },
};

const ApplyLeaveModal = ({ onClose, onSuccess, empData, leaveBalance }) => {
  const [leaveType,    setLeaveType]    = useState('');
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');
  const [dateList,     setDateList]     = useState([]);
  const [dayOptions,   setDayOptions]   = useState({});  // { 'YYYY-MM-DD': 'fullday'|'morning'|'evening' }
  const [reason,       setReason]       = useState('');
  const [file,         setFile]         = useState(null);
  const [optHolidays,  setOptHolidays]  = useState([]);
  const [selHoliday,   setSelHoliday]   = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  const cfg = LEAVE_CONFIG[leaveType] || {};
  const showUpload = typeof cfg.showUpload === 'function' ? cfg.showUpload(totalDays) : cfg.showUpload;

  // fetch optional holidays
  useEffect(() => {
    if (leaveType !== 'Optional-Holiday') return;
    client.get('/hrms/api/v1/holiday-list', {
      params: { holidayType: 'optional', year: new Date().getFullYear(), branch: empData?.location?.toLowerCase() || 'default' }
    }).then(r => {
      const now = new Date(); now.setHours(0,0,0,0);
      setOptHolidays((r.data || [])
        .filter(h => new Date(h.holidayDate) >= now)
        .map(h => ({ value: h.holidayName, label: `${h.holidayName} (${fmtDate(h.holidayDate)})`, date: h.holidayDate }))
      );
    }).catch(() => setOptHolidays([]));
  }, [leaveType, empData?.location]);

  // build date list
  useEffect(() => {
    if (!fromDate || !toDate) { setDateList([]); return; }
    const list = getDatesBetween(fromDate, toDate);
    setDateList(list);
    setDayOptions(prev => {
      const next = {};
      list.forEach(d => { next[d] = prev[d] || 'fullday'; });
      return next;
    });
  }, [fromDate, toDate]);

  const totalDays = Object.values(dayOptions).reduce((sum, v) => {
    return sum + (v === 'fullday' ? 1 : 0.5);
  }, 0);

  const availableBalance = leaveBalance?.[leaveType]?.balance ?? null;

  const getMaternityDays = () => {
    if (leaveType !== 'Maternity Leave') return 0;
    return (empData?.children ?? 3) <= 2 ? 180 : 120;
  };

  const handleSubmit = async () => {
    setError('');
    if (!leaveType) return setError('Please select a leave type.');
    if (!reason.trim()) return setError('Please enter a reason.');

    let fromD, toD, totalD;

    if (leaveType === 'Optional-Holiday') {
      if (!selHoliday) return setError('Please select a holiday.');
      const h = optHolidays.find(o => o.value === selHoliday);
      fromD = h.date.split('T')[0];
      toD   = fromD;
      totalD = 1;
    } else {
      if (!fromDate || !toDate) return setError('Please select dates.');
      if (leaveType !== 'Maternity Leave' && leaveType !== 'Wedding Leave' && totalDays === 0)
        return setError('Please select at least one leave day.');
      fromD  = fromDate;
      toD    = toDate;
      totalD = leaveType === 'Maternity Leave' ? getMaternityDays()
             : leaveType === 'Wedding Leave'   ? dateList.length
             : totalDays;
    }

    setSubmitting(true);
    try {
      const payload = {
        empId: getEmpId(),
        leaveType,
        fromDate: fromD,
        toDate:   toD,
        reason,
        totalDays: totalD,
        employmentType: empData?.employmentType,
        branchName:     empData?.location,
      };

      if (file && showUpload) {
        const b64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.readAsDataURL(file);
          r.onload  = () => res(r.result.split(',')[1]);
          r.onerror = rej;
        });
        payload.medicalProof = b64;
      }

      await client.post('/hrms/api/v1/employees/leave/request', payload);
      onSuccess('Leave request submitted successfully!');
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to submit leave request.');
    } finally { setSubmitting(false); }
  };

  const minDate = new Date(); minDate.setDate(1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <Modal title="Apply Leave" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="flex items-start gap-2 text-danger text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* Leave type */}
        <div>
          <label className="input-label">Leave Type</label>
          <select className="input" value={leaveType} onChange={e => { setLeaveType(e.target.value); setFromDate(''); setToDate(''); setDateList([]); setDayOptions({}); }}>
            <option value="">Select leave type…</option>
            {LEAVE_TYPES
              .filter(t => {
                if (t.value === 'Maternity Leave' && (empData?.gender !== 'Female' || !empData?.children || empData?.maritalStatus !== 'Married')) return false;
                if (t.value === 'Wedding Leave'   && empData?.maritalStatus === 'married') return false;
                return true;
              })
              .map(t => <option key={t.value} value={t.value}>{t.label}</option>)
            }
          </select>
        </div>

        {/* Available balance */}
        {leaveType && availableBalance !== null && (
          <InfoRow label="Available balance" value={`${availableBalance} days`} />
        )}

        {/* Date range */}
        {cfg.showDates && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">From Date</label>
              <input className="input" type="date" min={minDateStr} value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="input-label">To Date</label>
              <input className="input" type="date" min={fromDate || minDateStr} value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
        )}

        {/* Maternity info */}
        {leaveType === 'Maternity Leave' && (
          <InfoRow label="Total maternity days" value={`${getMaternityDays()} days`} highlight />
        )}

        {/* Date list with day options */}
        {cfg.showList && dateList.length > 0 && (
          <div className="border border-surface-200 rounded-xl overflow-hidden">
            <div className="bg-surface-50 px-4 py-2 border-b border-surface-200">
              <p className="text-2xs uppercase tracking-widest font-semibold text-surface-500">Selected Dates</p>
            </div>
            <div className="divide-y divide-surface-100 max-h-48 overflow-y-auto">
              {dateList.map(d => (
                <div key={d} className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-surface-700 font-medium">{fmtDate(d)}</span>
                  <select
                    className="text-xs border border-surface-200 rounded-lg px-2 py-1 bg-surface-0 text-surface-700 focus:outline-none focus:ring-1 focus:ring-primary-400"
                    value={dayOptions[d] || 'fullday'}
                    onChange={e => setDayOptions(prev => ({ ...prev, [d]: e.target.value }))}
                  >
                    {DAY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-surface-50 border-t border-surface-200">
              <InfoRow label="Total" value={`${totalDays} day${totalDays !== 1 ? 's' : ''}`} highlight />
            </div>
          </div>
        )}

        {/* Total days (Wedding/Maternity) */}
        {cfg.showTotalDays && dateList.length > 0 && (
          <InfoRow label="Total leave days" value={`${dateList.length} days`} />
        )}

        {/* Optional holidays */}
        {cfg.showHolidays && (
          <div>
            <label className="input-label">Select Optional Holiday</label>
            <select className="input" value={selHoliday} onChange={e => setSelHoliday(e.target.value)}>
              <option value="">Select holiday…</option>
              {optHolidays.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
            {optHolidays.length === 0 && (
              <p className="text-xs text-surface-400 mt-1">No optional holidays available.</p>
            )}
          </div>
        )}

        {/* Upload */}
        {showUpload && (
          <div>
            <label className="input-label">Medical Document</label>
            <label className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-surface-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors text-sm text-surface-500">
              <Upload size={15} />
              {file ? <span className="text-surface-800 font-medium truncate">{file.name}</span> : <span>Click to upload (PNG, JPG, PDF)</span>}
              <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="input-label">Reason</label>
          <textarea className="input min-h-[90px] resize-none" placeholder="Enter your reason…" value={reason} onChange={e => setReason(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-secondary" onClick={onClose}>Discard</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Permission Modal ──────────────────────────────────────────────────────────
const PermissionModal = ({ onClose, onSuccess, remainingMins }) => {
  const [date,      setDate]      = useState('');
  const [fromTime,  setFromTime]  = useState('');
  const [toTime,    setToTime]    = useState('');
  const [reason,    setReason]    = useState('');
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]     = useState('');

  const calcDiff = () => {
    if (!fromTime || !toTime) return null;
    const [fh, fm] = fromTime.split(':').map(Number);
    const [th, tm] = toTime.split(':').map(Number);
    return (th * 60 + tm) - (fh * 60 + fm);
  };

  const diffMins = calcDiff();
  const diffLabel = diffMins !== null
    ? (diffMins <= 0 ? 'Invalid range' : fmtMinutes(diffMins))
    : null;
  const isValid = diffMins !== null && diffMins > 0 && diffMins <= 120;

  const to12h = t => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${((h % 12) || 12).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ampm}`;
  };

  const handleSubmit = async () => {
    setError('');
    if (!date)    return setError('Please select a date.');
    if (!fromTime || !toTime) return setError('Please select time range.');
    if (!isValid) return setError('Duration must be between 1 minute and 2 hours.');
    if (!reason.trim()) return setError('Please enter a reason.');

    setSubmitting(true);
    try {
      await client.post('/hrms/api/v1/employees/permission/request', {
        empId:         getEmpId(),
        date,
        timeRangeFrom: to12h(fromTime),
        timeRangeTo:   to12h(toTime),
        reason,
      });
      onSuccess('Permission request submitted successfully!');
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to submit.');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal title="Request Permission" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="flex items-start gap-2 text-danger text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{error}
          </div>
        )}

        <div>
          <label className="input-label">Date</label>
          <input className="input" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <InfoRow label="Remaining this month" value={fmtMinutes(remainingMins)} />

        <div>
          <label className="input-label">Time Range</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">From</label>
              <input className="input" type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} />
            </div>
            <div>
              <label className="input-label">To</label>
              <input className="input" type="time" value={toTime} onChange={e => setToTime(e.target.value)} />
            </div>
          </div>
        </div>

        {diffLabel && (
          <InfoRow
            label={diffMins > 120 ? '⚠ Exceeds 2 hour limit' : 'Duration'}
            value={diffLabel}
            highlight={isValid}
          />
        )}

        <div>
          <label className="input-label">Reason</label>
          <textarea className="input min-h-[90px] resize-none" placeholder="Enter your reason…" value={reason} onChange={e => setReason(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-secondary" onClick={onClose}>Discard</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Tab: Summary ──────────────────────────────────────────────────────────────
const SummaryTab = ({ refreshKey, onBalanceLoaded }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client.get(`/hrms/api/v1/employees/leave/balance/${getEmpId()}`)
      .then(r => { setBalance(r.data); onBalanceLoaded?.(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
      {[...Array(6)].map((_,i) => <div key={i} className="card animate-pulse h-24" />)}
    </div>
  );

  if (!balance) return <p className="text-surface-400 text-sm text-center py-12">No leave balance data available.</p>;

  const entries = Object.entries(balance);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
      {entries.map(([type, info]) => {
        const used = (info.total || 0) - (info.balance || 0);
        const pct  = info.total > 0 ? Math.min(100, (used / info.total) * 100) : 0;
        return (
          <div key={type} className="card flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-surface-800 leading-tight">{type}</p>
              <span className="badge-blue flex-shrink-0">{info.balance ?? 0}</span>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-2xs text-surface-400">
              <span>Used: {used}</span>
              <span>Total: {info.total ?? 0}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Tab: Leave Details ────────────────────────────────────────────────────────
const LeaveDetailsTab = ({ refreshKey }) => {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const year = new Date().getFullYear();
    client.get(`/hrms/api/v1/employees/leave/details?empId=${getEmpId()}&year=${year}`)
      .then(r => setData(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="py-12 text-center text-surface-400 text-sm">Loading…</div>;
  if (data.length === 0) return <div className="py-12 text-center text-surface-400 text-sm">No leave records found.</div>;

  return (
    <div className="table-wrap mt-4">
      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>From</th>
            <th>To</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="font-medium">{row.leaveType}</td>
              <td>{fmtDate(row.fromDate)}</td>
              <td>{fmtDate(row.toDate)}</td>
              <td>{row.totalDays}</td>
              <td className="max-w-[180px] truncate text-surface-500">{row.reason}</td>
              <td><span className={STATUS_BADGE[row.status] || 'badge-gray'}>{row.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Tab: Permissions ──────────────────────────────────────────────────────────
const TOTAL_MONTHLY_PERMISSION = 120;

const PermissionsTab = ({ refreshKey, onRemainingLoaded }) => {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const month = thisMonth();
      const res   = await client.get(`/hrms/api/v1/employees/permission/month-wise?empId=${getEmpId()}&month=${month}`);
      const list  = res.data || [];
      setData(list);

      // Compute remaining
      const active = list.filter(p => !p.cancelled).sort((a,b) => new Date(b.date) - new Date(a.date));
      const remaining = active.length > 0 ? active[0].permissionBalance : TOTAL_MONTHLY_PERMISSION;
      onRemainingLoaded?.(remaining);
    } catch {
      onRemainingLoaded?.(TOTAL_MONTHLY_PERMISSION);
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  if (loading) return <div className="py-12 text-center text-surface-400 text-sm">Loading…</div>;
  if (data.length === 0) return <div className="py-12 text-center text-surface-400 text-sm">No permission records this month.</div>;

  return (
    <div className="table-wrap mt-4">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Duration</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{fmtDate(row.date)}</td>
              <td className="font-mono text-xs">{row.timeRangeFrom}</td>
              <td className="font-mono text-xs">{row.timeRangeTo}</td>
              <td>{fmtMinutes(row.duration)}</td>
              <td className="max-w-[160px] truncate text-surface-500">{row.reason}</td>
              <td><span className={row.cancelled ? 'badge-gray' : STATUS_BADGE[row.status] || 'badge-amber'}>{row.cancelled ? 'Cancelled' : (row.status || 'Pending')}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary',     label: 'Summary' },
  { id: 'details',     label: 'Leave Details' },
  { id: 'permissions', label: 'Permissions' },
];

const LeaveModule = () => {
  const [activeTab,      setActiveTab]      = useState('summary');
  const [showLeave,      setShowLeave]      = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [leaveBalance,   setLeaveBalance]   = useState(null);
  const [remainingMins,  setRemainingMins]  = useState(TOTAL_MONTHLY_PERMISSION);
  const [empData,        setEmpData]        = useState(null);
  const [toast,          setToast]          = useState(null);

  useEffect(() => {
    client.get(`/hrms/api/v1/employees/search/all?empId=${getEmpId()}`)
      .then(r => setEmpData(r.data?.content?.[0] || null))
      .catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const onSuccess = msg => { showToast(msg); setRefreshKey(k => k + 1); };

  return (
    <div className="animate-fade-in">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Tracker</h1>
          <p className="page-subtitle">{new Date().getFullYear()} · Track and manage your leaves</p>
        </div>

        {/* Apply dropdown */}
        <div className="relative">
          <div className="flex">
            <button
              className="btn-primary rounded-r-none border-r border-primary-700"
              onClick={() => { setShowLeave(true); setShowDropdown(false); }}
            >
              <Umbrella size={14} /> Apply Leave
            </button>
            <button
              className="btn-primary rounded-l-none px-2"
              onClick={() => setShowDropdown(d => !d)}
            >
              <ChevronDown size={14} />
            </button>
          </div>
          {showDropdown && (
            <div className="absolute right-0 top-10 w-48 bg-surface-0 rounded-xl shadow-card-md border border-surface-100 py-1 animate-slide-down z-20">
              <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50"
                onClick={() => { setShowLeave(true); setShowDropdown(false); }}>
                <Umbrella size={14} /> Apply Leave
              </button>
              <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50"
                onClick={() => { setShowPermission(true); setShowDropdown(false); }}>
                <Clock size={14} /> Request Permission
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-surface-0 text-surface-900 shadow-card' : 'text-surface-500 hover:text-surface-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary'     && <SummaryTab     refreshKey={refreshKey} onBalanceLoaded={setLeaveBalance} />}
      {activeTab === 'details'     && <LeaveDetailsTab refreshKey={refreshKey} />}
      {activeTab === 'permissions' && <PermissionsTab  refreshKey={refreshKey} onRemainingLoaded={setRemainingMins} />}

      {showLeave && (
        <ApplyLeaveModal
          onClose={() => setShowLeave(false)}
          onSuccess={onSuccess}
          empData={empData}
          leaveBalance={leaveBalance}
        />
      )}

      {showPermission && (
        <PermissionModal
          onClose={() => setShowPermission(false)}
          onSuccess={onSuccess}
          remainingMins={remainingMins}
        />
      )}
    </div>
  );
};

export default LeaveModule;