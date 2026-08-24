// src/pages/workspace/TimeSheet2.jsx
import { useState, useEffect, useCallback } from 'react';
import { Search, X, Download, Printer, RotateCcw } from 'lucide-react';
import client from '../../api/client';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtHours = t => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

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
  'loss of pay':      'bg-rose-100 text-rose-700',
  'half sick leave':  'bg-orange-100 text-orange-700',
  'in-progress':      'bg-violet-100 text-violet-700',
};

const getStatusClass = s => {
  if (!s) return 'bg-surface-100 text-surface-500';
  const lower = s.toLowerCase();
  if (lower.startsWith('holiday - ') || lower === 'holiday') return 'bg-indigo-100 text-indigo-700';
  return STATUS_STYLES[lower] || 'bg-surface-100 text-surface-600';
};

const getStatusLabel = s => {
  if (!s) return '—';
  const lower = s.toLowerCase();
  if (lower === 'halfday')  return 'Half Day';
  if (lower === 'full-day') return 'Full Day';
  if (lower === 'lop')      return 'Loss of Pay';
  return s;
};

const STATUS_OPTIONS = [
  'Present', 'Full-Day', 'Half Day', 'Half Sick Leave',
  'In-progress', 'Permission', 'Loss of Pay', 'Absent',
  'Sick Leave', 'Optional Holiday', 'Disclosed', 'Week Off',
];

const startOfMonth = () => {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split('T')[0];
};
const endOfMonth = () => {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  return d.toISOString().split('T')[0];
};

const PAGE_SIZES = [10, 20, 50, 100];

// ── Main ──────────────────────────────────────────────────────────────────────
const TimeSheet2 = () => {
  const [data,       setData]       = useState([]);
  const [exportData, setExportData] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [filters,    setFilters]    = useState({
    empId:     '',
    status:    '',
    startDate: startOfMonth(),
    endDate:   endOfMonth(),
  });
  const [applied,    setApplied]    = useState({ ...filters });
  const [page,       setPage]       = useState(0);
  const [pageSize,   setPageSize]   = useState(50);
  const [total,      setTotal]      = useState(0);

  // Fetch paginated table data
  const fetchData = useCallback(async (pg = page, ps = pageSize, f = applied) => {
    setLoading(true);
    try {
      const params = {
        page: pg, size: ps,
        ...(f.empId     && { empId:     f.empId.trim() }),
        ...(f.status    && { status:    f.status }),
        ...(f.startDate && { startDate: f.startDate }),
        ...(f.endDate   && { endDate:   f.endDate }),
      };
      const res  = await client.get('/hrms/api/v1/employee/attendance/get-all', { params });
      const body = res.data;
      const rows = body?.data || body?.content || [];
      const tot  = body?.totalItems || body?.totalElements || rows.length;
      setData(rows);
      setTotal(tot);
    } catch { setData([]); setTotal(0); }
    finally { setLoading(false); }
  }, [page, pageSize, applied]);

  useEffect(() => { fetchData(page, pageSize, applied); }, [page, pageSize, applied]);

  // Fetch full data for export (no pagination)
  useEffect(() => {
    if (!applied.startDate || !applied.endDate) return;
    client.get('/hrms/api/v1/employee/attendance/get-all', {
      params: { page: 0, size: 9999, startDate: applied.startDate, endDate: applied.endDate }
    })
      .then(r => setExportData(r.data?.data || r.data?.content || []))
      .catch(() => setExportData([]));
  }, [applied.startDate, applied.endDate]);

  const handleSearch = () => { setPage(0); setApplied({ ...filters }); };
  const handleReset  = () => {
    const reset = { empId: '', status: '', startDate: startOfMonth(), endDate: endOfMonth() };
    setFilters(reset); setApplied(reset); setPage(0);
  };

  const handleExport = () => {
    const header = ['Emp ID', 'Name', 'Date', 'Check In', 'Check Out', 'Permission', 'Total Hours', 'Status'];
    const rows   = exportData.map(r => [
      r.empId || '', r.employeeName || '',
      fmtDate(r.date), r.checkIn || '', r.checkOut || '',
      r.permission || '', fmtHours(r.productionHours), getStatusLabel(r.status),
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `hr_attendance_${applied.startDate}_${applied.endDate}.csv`;
    a.click();
  };

  const handlePrint = () => {
    const rows = data.map(r => `
      <tr>
        <td>${r.empId || '—'}</td><td>${r.employeeName || '—'}</td>
        <td>${fmtDate(r.date)}</td><td>${r.checkIn || '—'}</td>
        <td>${r.checkOut || '—'}</td><td>${r.permission || '—'}</td>
        <td>${fmtHours(r.productionHours)}</td><td>${getStatusLabel(r.status)}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>HR Attendance</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f2f2f2}</style>
      </head><body><h2>Attendance — ${applied.startDate} to ${applied.endDate}</h2>
      <table><thead><tr>
        <th>Emp ID</th><th>Name</th><th>Date</th><th>Check In</th>
        <th>Check Out</th><th>Permission</th><th>Hours</th><th>Status</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>{setTimeout(()=>{window.print();window.close()},200)}</script>
      </body></html>`);
    win.document.close();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">HR Attendance</h1>
          <p className="page-subtitle">All employee attendance records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary" title="Export CSV">
            <Download size={14} />
          </button>
          <button onClick={handlePrint} className="btn-secondary" title="Print">
            <Printer size={14} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Emp ID */}
          <div>
            <label className="input-label">Employee ID</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. EMP001"
              value={filters.empId}
              onChange={e => setFilters(f => ({ ...f, empId: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Status */}
          <div>
            <label className="input-label">Status</label>
            <select className="input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="input-label">Start Date</label>
            <input
              className="input"
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="input-label">End Date</label>
            <input
              className="input"
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button onClick={handleReset} className="btn-secondary">
            <RotateCcw size={13} /> Reset
          </button>
          <button onClick={handleSearch} className="btn-primary">
            <Search size={13} /> Search
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {!loading && data.length > 0 && (
        <div className="flex items-center gap-4 mb-4 text-sm text-surface-500">
          <span>Showing <span className="font-semibold text-surface-800">{data.length}</span> of <span className="font-semibold text-surface-800">{total}</span> records</span>
          <span>·</span>
          <span>{applied.startDate} → {applied.endDate}</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-surface-100 rounded-xl animate-pulse" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <Search size={32} className="text-surface-300 mb-3" />
          <p className="text-surface-500 text-sm">No records found for the selected filters.</p>
          <button onClick={handleReset} className="btn-secondary mt-4 text-xs">
            <RotateCcw size={12} /> Clear filters
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Permission</th>
                <th>Total Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs font-semibold">{row.empId || '—'}</td>
                  <td className="font-medium">{row.employeeName || '—'}</td>
                  <td>{fmtDate(row.date)}</td>
                  <td className="font-mono text-xs">{row.checkIn  || '—'}</td>
                  <td className="font-mono text-xs">{row.checkOut || '—'}</td>
                  <td>{row.permission || '—'}</td>
                  <td className="font-mono text-xs">{fmtHours(row.productionHours)}</td>
                  <td>
                    <span className={`badge ${getStatusClass(row.status)}`}>
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <span>Rows per page</span>
            <select
              className="input w-auto py-1 text-xs"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40"
            >«</button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40"
            >‹</button>

            {/* Page number pills */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const pg    = start + i;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pg === page ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'
                  }`}>
                  {pg + 1}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40"
            >›</button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40"
            >»</button>
          </div>

          <span className="text-xs text-surface-400">
            Page {page + 1} of {totalPages} · {total} total
          </span>
        </div>
      )}
    </div>
  );
};

export default TimeSheet2;