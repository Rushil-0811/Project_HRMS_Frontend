// src/pages/inbox/Inbox.jsx
import { useState, useEffect, useCallback } from 'react';
import { X, Check, FileText, ChevronRight, User, Clock, Calendar, RefreshCw } from 'lucide-react';
import client from '../../api/client';
import { getEmpId } from '../../utils/auth';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = t => t ? t.split('T')[1]?.substring(0, 5) : '—';

const getDocFormat = (b64) => {
  if (!b64) return null;
  if (b64.startsWith('iVBORw0KGgo')) return 'png';
  if (b64.startsWith('/9j/'))        return 'jpg';
  return 'pdf';
};

const getDatesBetween = (from, to) => {
  if (!from || !to) return [];
  const dates = [], cur = new Date(from), end = new Date(to);
  while (cur <= end) { dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1); }
  return dates;
};

const STATUS_BADGE = {
  Approved: 'badge-green', Rejected: 'badge-red',
  Pending:  'badge-amber', Cancelled: 'badge-gray',
  APPROVED: 'badge-green', REJECTED: 'badge-red', PENDING: 'badge-amber',
};

const LEAVE_TYPE_COLOR = {
  'Casual Leave':     'bg-amber-100 text-amber-700 border-amber-200',
  'Sick Leave':       'bg-orange-100 text-orange-700 border-orange-200',
  'Earned Leave':     'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Comp-Off':         'bg-rose-100 text-rose-700 border-rose-200',
  'Optional-Holiday': 'bg-purple-100 text-purple-700 border-purple-200',
  'Maternity Leave':  'bg-pink-100 text-pink-700 border-pink-200',
  'Wedding Leave':    'bg-violet-100 text-violet-700 border-violet-200',
};

// ── shared UI ─────────────────────────────────────────────────────────────────
const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400">{label}</p>
    <p className="text-sm font-semibold text-surface-800">{value || '—'}</p>
  </div>
);

const EmptyState = ({ msg }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
      <FileText size={20} className="text-surface-300" />
    </div>
    <p className="text-surface-400 text-sm">{msg}</p>
  </div>
);

const LoadingRows = () => (
  <div className="space-y-2 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-14 bg-surface-100 rounded-xl animate-pulse" />
    ))}
  </div>
);

// ── Document viewer ───────────────────────────────────────────────────────────
const DocViewer = ({ doc, onClose }) => {
  const fmt    = getDocFormat(doc);
  const mime   = fmt === 'pdf' ? 'application/pdf' : `image/${fmt}`;
  const bytes  = Uint8Array.from(atob(doc), c => c.charCodeAt(0));
  const url    = URL.createObjectURL(new Blob([bytes], { type: mime }));

  useEffect(() => () => URL.revokeObjectURL(url), []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-0 rounded-2xl shadow-card-md w-full max-w-3xl h-[80vh] flex flex-col animate-slide-down">
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-100 flex-shrink-0">
          <p className="font-semibold text-surface-800 text-sm">Supporting Document</p>
          <div className="flex items-center gap-2">
            {fmt !== 'pdf' && (
              <a href={url} download={`document.${fmt}`} className="btn-secondary text-xs py-1.5 px-3">Download</a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X size={15} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          {fmt === 'pdf'
            ? <iframe src={url} className="w-full h-full border-0" title="Document" />
            : <img src={url} alt="Document" className="w-full h-full object-contain bg-surface-50" />
          }
        </div>
      </div>
    </div>
  );
};

// ── Detail Drawer ─────────────────────────────────────────────────────────────
const DetailDrawer = ({ type, data, onClose, onApprove, onReject, processing }) => {
  const [showDoc, setShowDoc] = useState(false);
  if (!data) return null;

  const pic = data.profilePicture
    ? `data:${data.docFormat || 'image/jpeg'};base64,${data.profilePicture}`
    : null;

  const leaveConfig = {
    'Casual Leave':     { showDates: true,  showList: true,  showDoc: false, showHoliday: false },
    'Sick Leave':       { showDates: true,  showList: true,  showDoc: true,  showHoliday: false },
    'Earned Leave':     { showDates: true,  showList: false, showDoc: false, showHoliday: false },
    'Comp-Off':         { showDates: true,  showList: true,  showDoc: false, showHoliday: false },
    'Optional-Holiday': { showDates: false, showList: false, showDoc: false, showHoliday: true  },
    'Maternity Leave':  { showDates: true,  showList: false, showDoc: true,  showHoliday: false },
    'Wedding Leave':    { showDates: true,  showList: false, showDoc: false, showHoliday: false },
  };
  const cfg = leaveConfig[data.leaveType] || {};

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-surface-900/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-surface-0 shadow-card-md flex flex-col animate-slide-down" style={{animationName:'slideRight'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 flex-shrink-0">
          <p className="font-display font-bold text-surface-900">Request Details</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X size={16} /></button>
        </div>

        {/* Employee info */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-surface-100 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary-100 flex-shrink-0 flex items-center justify-center">
            {pic ? <img src={pic} alt={data.name} className="w-full h-full object-cover" /> : <User size={22} className="text-primary-400" />}
          </div>
          <div>
            <p className="font-display font-bold text-surface-900">{data.name || '—'}</p>
            <p className="text-xs text-surface-500">{data.designation || data.empId}</p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Leave details */}
          {type === 'leave' && (
            <>
              {data.leaveType && (
                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold ${LEAVE_TYPE_COLOR[data.leaveType] || 'bg-surface-100 text-surface-700 border-surface-200'}`}>
                  {data.leaveType}
                </div>
              )}
              <DetailRow label="Requested Date" value={fmtDate(data.requestedDate)} />
              {cfg.showHoliday && <DetailRow label="Selected Holiday" value={data.selectedHoliday} />}
              {cfg.showDates && (
                <DetailRow label="Date Range" value={`${fmtDate(data.fromDate)} → ${fmtDate(data.toDate)}`} />
              )}
              {cfg.showList && data.fromDate && data.toDate && (
                <div>
                  <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-2">Leave Dates</p>
                  <div className="border border-surface-200 rounded-xl overflow-hidden divide-y divide-surface-100">
                    {getDatesBetween(data.fromDate, data.toDate).map(d => (
                      <div key={d} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-surface-700">{fmtDate(d)}</span>
                        <span className="text-surface-400 text-xs">{data.dayType || 'Full Day'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DetailRow label="No. of Days" value={`${data.totalDays} day${data.totalDays !== 1 ? 's' : ''}`} />
              {cfg.showDoc && data.doc && (
                <div>
                  <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-2">Supporting Document</p>
                  <button
                    onClick={() => setShowDoc(true)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl border border-surface-200 hover:bg-surface-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-primary-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-surface-800">Medical Document</p>
                      <p className="text-xs text-surface-400">Attached by employee</p>
                    </div>
                    <ChevronRight size={15} className="text-surface-400" />
                  </button>
                </div>
              )}
              <DetailRow label="Reason" value={data.reason} />
            </>
          )}

          {/* Permission details */}
          {type === 'permission' && (
            <>
              <DetailRow label="Requested Date"   value={fmtDate(data.requestedDate || data.date)} />
              <DetailRow label="Permission Date"   value={fmtDate(data.date)} />
              <DetailRow label="Time"              value={data.permissionTime || `${data.timeRangeFrom} → ${data.timeRangeTo}`} />
              <DetailRow label="Duration"          value={data.duration} />
              <DetailRow label="Reason"            value={data.reason} />
            </>
          )}

          {/* Regularization details */}
          {type === 'regularization' && (
            <>
              <DetailRow label="Requested Date" value={fmtDate(data.requestedDate)} />
              <DetailRow label="Date"           value={fmtDate(data.date)} />
              <DetailRow label="Check In"       value={fmtTime(data.checkInDateTime)} />
              <DetailRow label="Check Out"      value={fmtTime(data.checkOutDateTime)} />
              <DetailRow label="Work Hours"     value={data.productionHours ? `${data.productionHours} hrs` : '—'} />
              <DetailRow label="Reason"         value={data.reason} />
            </>
          )}

          {/* Attendance details */}
          {type === 'attendance' && (
            <>
              <DetailRow label="Date"       value={fmtDate(data.date)} />
              <DetailRow label="Check In"   value={fmtTime(data.checkInDateTime)} />
              <DetailRow label="Check Out"  value={fmtTime(data.checkOutDateTime)} />
              <DetailRow label="Status"     value={data.status} />
            </>
          )}
        </div>

        {/* Approve / Reject footer */}
        {(type === 'leave' || type === 'permission' || type === 'regularization') && (
          <div className="flex gap-3 px-5 py-4 border-t border-surface-100 flex-shrink-0">
            <button
              onClick={onReject}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <X size={16} /> Reject
            </button>
            <button
              onClick={onApprove}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 border border-green-200 text-success text-sm font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <Check size={16} /> {processing ? 'Processing…' : 'Approve'}
            </button>
          </div>
        )}
      </div>

      {showDoc && data.doc && <DocViewer doc={data.doc} onClose={() => setShowDoc(false)} />}
    </>
  );
};

// ── Leave Table ───────────────────────────────────────────────────────────────
const LeaveTable = ({ refreshKey, onRowClick }) => {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const managerId = getEmpId();

  useEffect(() => {
    setLoading(true);
    client.get(`/hrms/api/v1/employees/leave/pending-list?managerId=${managerId}`)
      .then(r => setData(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <LoadingRows />;
  if (!data.length) return <EmptyState msg="No pending leave requests." />;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>
          <th>Employee</th><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="cursor-pointer" onClick={() => onRowClick(row)}>
              <td>
                <div>
                  <p className="font-semibold text-surface-800">{row.name}</p>
                  <p className="text-xs text-surface-400">{row.empId}</p>
                </div>
              </td>
              <td>
                <span className={`badge ${LEAVE_TYPE_COLOR[row.leaveType] || 'badge-gray'}`}>{row.leaveType}</span>
              </td>
              <td>{fmtDate(row.fromDate)}</td>
              <td>{fmtDate(row.toDate)}</td>
              <td>{row.totalDays}</td>
              <td><span className={STATUS_BADGE[row.status] || 'badge-gray'}>{row.status}</span></td>
              <td><ChevronRight size={14} className="text-surface-400" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Permission Table ──────────────────────────────────────────────────────────
const PermissionTable = ({ refreshKey, onRowClick }) => {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const managerId = getEmpId();

  useEffect(() => {
    setLoading(true);
    client.get(`/hrms/api/v1/employees/permission/pending-list?managerId=${managerId}`)
      .then(r => setData(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <LoadingRows />;
  if (!data.length) return <EmptyState msg="No pending permission requests." />;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>
          <th>Employee</th><th>Date</th><th>Time</th><th>Duration</th><th>Reason</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="cursor-pointer" onClick={() => onRowClick(row)}>
              <td>
                <div>
                  <p className="font-semibold text-surface-800">{row.name}</p>
                  <p className="text-xs text-surface-400">{row.empId}</p>
                </div>
              </td>
              <td>{fmtDate(row.date)}</td>
              <td className="font-mono text-xs">{row.permissionTime || `${row.timeRangeFrom} → ${row.timeRangeTo}`}</td>
              <td>{row.duration}</td>
              <td className="max-w-[160px] truncate text-surface-500">{row.reason}</td>
              <td><span className={STATUS_BADGE[row.status] || 'badge-gray'}>{row.status}</span></td>
              <td><ChevronRight size={14} className="text-surface-400" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Regularization Table ──────────────────────────────────────────────────────
const RegularizationTable = ({ refreshKey, onRowClick }) => {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const managerId = getEmpId();

  useEffect(() => {
    setLoading(true);
    client.get(`/hrms/api/v1/employees/regularize/pending-list?managerId=${managerId}`)
      .then(r => setData(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <LoadingRows />;
  if (!data.length) return <EmptyState msg="No pending regularization requests." />;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>
          <th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Reason</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="cursor-pointer" onClick={() => onRowClick(row)}>
              <td>
                <div>
                  <p className="font-semibold text-surface-800">{row.name}</p>
                  <p className="text-xs text-surface-400">{row.empId}</p>
                </div>
              </td>
              <td>{fmtDate(row.date)}</td>
              <td className="font-mono text-xs">{fmtTime(row.checkInDateTime)}</td>
              <td className="font-mono text-xs">{fmtTime(row.checkOutDateTime)}</td>
              <td>{row.productionHours ? `${row.productionHours}h` : '—'}</td>
              <td className="max-w-[140px] truncate text-surface-500">{row.reason}</td>
              <td><span className={STATUS_BADGE[row.status] || 'badge-gray'}>{row.status}</span></td>
              <td><ChevronRight size={14} className="text-surface-400" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Attendance Table ──────────────────────────────────────────────────────────
const AttendanceTable = ({ refreshKey }) => {
  const [reportees,  setReportees]  = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const empId = getEmpId();

  useEffect(() => {
    client.get(`/hrms/api/v1/employees/hierarchy/employee?empId=${empId}`)
      .then(r => {
        const list = (r.data?.reportees || []).map(e => ({ id: e.empId, name: e.name }));
        setReportees(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    client.get('/hrms/api/v1/employee/attendance/pending-list', {
      params: { managerId: empId, empId: selected.id }
    })
      .then(r => setData(r.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [selected, refreshKey]);

  return (
    <div>
      {reportees.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="input-label mb-0">Employee</label>
          <select className="input w-auto" value={selected?.id || ''} onChange={e => setSelected(reportees.find(r => r.id === e.target.value))}>
            {reportees.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}
      {loading ? <LoadingRows /> : data.length === 0 ? <EmptyState msg="No pending attendance records." /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr>
              <th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th>
            </tr></thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{fmtDate(row.date)}</td>
                  <td className="font-mono text-xs">{fmtTime(row.checkInDateTime)}</td>
                  <td className="font-mono text-xs">{fmtTime(row.checkOutDateTime)}</td>
                  <td><span className={STATUS_BADGE[row.status] || 'badge-gray'}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Counts hook ───────────────────────────────────────────────────────────────
const useCounts = (refreshKey) => {
  const [counts, setCounts] = useState({ leave: 0, permission: 0, regularization: 0 });
  const managerId = getEmpId();

  useEffect(() => {
    Promise.allSettled([
      client.get(`/hrms/api/v1/employees/leave/pending-list?managerId=${managerId}`),
      client.get(`/hrms/api/v1/employees/permission/pending-list?managerId=${managerId}`),
      client.get(`/hrms/api/v1/employees/regularize/pending-list?managerId=${managerId}`),
    ]).then(([l, p, r]) => {
      setCounts({
        leave:          l.status === 'fulfilled' ? (l.value.data || []).length : 0,
        permission:     p.status === 'fulfilled' ? (p.value.data || []).length : 0,
        regularization: r.status === 'fulfilled' ? (r.value.data || []).length : 0,
      });
    });
  }, [refreshKey]);

  return counts;
};

// ── Main Inbox ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'leave',          label: 'Leave Requests' },
  { id: 'permission',     label: 'Permission' },
  { id: 'regularization', label: 'Regularization' },
  { id: 'attendance',     label: 'Attendance' },
];

const CountBadge = ({ n }) => n > 0
  ? <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-500 text-white text-2xs font-bold">{n}</span>
  : null;

const Inbox = () => {
  const [activeTab,   setActiveTab]   = useState('leave');
  const [refreshKey,  setRefreshKey]  = useState(0);
  const [drawer,      setDrawer]      = useState({ open: false, type: null, data: null });
  const [processing,  setProcessing]  = useState(false);
  const counts = useCounts(refreshKey);
  const managerId = getEmpId();

  const openDrawer = (type, data) => setDrawer({ open: true, type, data });
  const closeDrawer = () => setDrawer({ open: false, type: null, data: null });

  const callApproval = async (status) => {
    if (processing || !drawer.data) return;
    setProcessing(true);
    const d    = drawer.data;
    const type = drawer.type;

    const requestType = type === 'leave'          ? d.leaveType
                      : type === 'permission'     ? 'Permission'
                      : type === 'regularization' ? 'Regularization'
                      : '';
    try {
      await client.post(`/api/approval/${status === 'APPROVED' ? 'approve' : 'reject'}`, {
        requestId:   d.id,
        empId:       d.empId,
        status,
        managerId,
        requestType,
      });
      setRefreshKey(k => k + 1);
      closeDrawer();
    } catch (e) {
      console.error(e);
    } finally { setProcessing(false); }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inbox</h1>
          <p className="page-subtitle">Pending approvals from your team</p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)} className="btn-secondary">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
              activeTab === t.id ? 'bg-surface-0 text-surface-900 shadow-card' : 'text-surface-500 hover:text-surface-700'
            }`}>
            {t.label}
            {t.id !== 'attendance' && <CountBadge n={counts[t.id]} />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card p-0 overflow-hidden">
        {activeTab === 'leave'          && <LeaveTable          refreshKey={refreshKey} onRowClick={d => openDrawer('leave', d)} />}
        {activeTab === 'permission'     && <PermissionTable     refreshKey={refreshKey} onRowClick={d => openDrawer('permission', d)} />}
        {activeTab === 'regularization' && <RegularizationTable refreshKey={refreshKey} onRowClick={d => openDrawer('regularization', d)} />}
        {activeTab === 'attendance'     && <AttendanceTable     refreshKey={refreshKey} />}
      </div>

      {/* Drawer */}
      {drawer.open && (
        <DetailDrawer
          type={drawer.type}
          data={drawer.data}
          onClose={closeDrawer}
          onApprove={() => callApproval('APPROVED')}
          onReject={()  => callApproval('REJECTED')}
          processing={processing}
        />
      )}
    </div>
  );
};

export default Inbox;