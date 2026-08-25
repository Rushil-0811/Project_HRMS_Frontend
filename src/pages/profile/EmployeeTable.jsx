// src/pages/profile/EmployeeTable.jsx
import { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Download, ChevronLeft, ChevronRight, User, X } from 'lucide-react';
import client from '../../api/client';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmt     = v => (!v || v === 'N/A' || v === 'null') ? '—' : v;
const titleCase = s => s ? s.split('_').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '—';

const EMPTY_FILTERS = { empId: '', name: '', designation: '', employeeType: '', location: '' };
const PAGE_SIZES    = [10, 20, 50];

// ── Detail Drawer ─────────────────────────────────────────────────────────────
const Field = ({ label, value }) => (
  <div>
    <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-0.5">{label}</p>
    <p className="text-sm text-surface-800 font-medium break-words">{value || '—'}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-3 mt-5 first:mt-0">{title}</p>
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
  </div>
);

const DetailDrawer = ({ emp, onClose }) => {
  if (!emp) return null;
  const pic = emp.profilePicture ? `data:image/jpeg;base64,${emp.profilePicture}` : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-surface-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-surface-0 shadow-card-md flex flex-col animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 flex-shrink-0">
          <p className="font-display font-bold text-surface-900">Employee Details</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X size={16} /></button>
        </div>

        {/* Profile banner */}
        <div className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-primary-700 to-primary-900 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary-300 flex-shrink-0 flex items-center justify-center">
            {pic
              ? <img src={pic} alt={emp.name} className="w-full h-full object-cover" />
              : <User size={22} className="text-primary-100" />
            }
          </div>
          <div>
            <p className="font-display font-bold text-white text-base leading-tight">{fmt(emp.name || emp.fullName)}</p>
            <p className="text-primary-200 text-xs mt-0.5">{fmt(emp.currentDesignation || emp.designation)}</p>
            <p className="text-primary-300 text-xs">{fmt(emp.empId)}</p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          <Section title="Work">
            <Field label="Department"        value={titleCase(emp.deptName || emp.department)} />
            <Field label="Employment Type"   value={titleCase(emp.employmentType)} />
            <Field label="Date of Joining"   value={fmtDate(emp.doj)} />
            <Field label="Location"          value={fmt(emp.location)} />
            <Field label="Shift"             value={titleCase(emp.shift)} />
            <Field label="Reporting Manager" value={fmt(emp.reportingManager)} />
            <div className="col-span-2"><Field label="Official Email" value={fmt(emp.officialEmailWork || emp.officialEmail)} /></div>
            <Field label="Work Phone"        value={fmt(emp.workPhoneNumber)} />
          </Section>

          <div className="border-t border-surface-100" />

          <Section title="Personal">
            <Field label="Date of Birth"   value={fmtDate(emp.dateOfBirth)} />
            <Field label="Gender"          value={titleCase(emp.gender)} />
            <Field label="Blood Group"     value={fmt(emp.bloodGroup)} />
            <Field label="Marital Status"  value={titleCase(emp.maritalStatus)} />
            <Field label="Mobile Number"   value={fmt(emp.mobileNumber)} />
            <Field label="Personal Email"  value={fmt(emp.personalMailId)} />
            <Field label="Emergency No."   value={fmt(emp.emergencyContactNumber)} />
          </Section>

          <div className="border-t border-surface-100" />

          <Section title="Identity">
            <Field label="PAN"    value={fmt(emp.panNumber)} />
            <Field label="Aadhar" value={fmt(emp.aadharNumber)} />
            <Field label="UAN"    value={fmt(emp.uanNumber)} />
          </Section>

          <div className="border-t border-surface-100" />

          <Section title="Qualifications">
            <Field label="Qualification" value={fmt(emp.qualification || emp.undergraduate)} />
            <Field label="Experience"    value={fmt(emp.totalExperience)} />
          </Section>
        </div>
      </div>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const EmployeeTable = () => {
  const [employees,   setEmployees]   = useState([]);
  const [allEmp,      setAllEmp]      = useState([]); // for filter dropdowns
  const [loading,     setLoading]     = useState(true);
  const [filters,     setFilters]     = useState(EMPTY_FILTERS);
  const [applied,     setApplied]     = useState(EMPTY_FILTERS);
  const [page,        setPage]        = useState(0);
  const [pageSize,    setPageSize]    = useState(10);
  const [total,       setTotal]       = useState(0);
  const [selected,    setSelected]    = useState(null);

  // Fetch dropdown options once
  useEffect(() => {
    client.get('/hrms/api/v1/employees/get-search', { params: { page: 0, size: 1000 } })
      .then(r => setAllEmp(r.data?.content || []))
      .catch(() => {});
  }, []);

  // Fetch paginated employees
  const fetchEmployees = useCallback(async (pg = page, ps = pageSize, f = applied) => {
    setLoading(true);
    try {
      const params = { page: pg, size: ps };
      if (f.empId?.trim())       params.empId          = f.empId.trim();
      if (f.name?.trim())        params.name           = f.name.trim();
      if (f.designation)         params.designation    = f.designation;
      if (f.employeeType)        params.employmentType = f.employeeType;
      if (f.location)            params.location       = f.location;
      const res = await client.get('/hrms/api/v1/employees/get-search', { params });
      setEmployees(res.data?.content || []);
      setTotal(res.data?.totalElements || 0);
    } catch { setEmployees([]); setTotal(0); }
    finally { setLoading(false); }
  }, [page, pageSize, applied]);

  useEffect(() => { fetchEmployees(page, pageSize, applied); }, [page, pageSize, applied]);

  const handleSearch = () => { setPage(0); setApplied({ ...filters }); };
  const handleReset  = () => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(0); };
  const onFilterChange = (field, val) => setFilters(f => ({ ...f, [field]: val }));

  // Unique options from all employees
  const opts = (key) => [...new Set(allEmp.map(e => e[key]).filter(Boolean))].sort();

  const totalPages = Math.ceil(total / pageSize);

  const handleExport = () => {
    const header = ['Emp ID','Name','DOJ','Designation','Department','Reporting Manager','Employment Type','Phone','Email','Location'];
    const rows   = employees.map(e => [
      e.empId, e.name || e.fullName, fmtDate(e.doj),
      e.currentDesignation || e.designation, e.deptName || e.department,
      e.reportingManager, e.employmentType, e.workPhoneNumber,
      e.officialEmailWork || e.officialEmail, e.location,
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'employee_master.csv';
    a.click();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Master</h1>
          <p className="page-subtitle">{total} employees · click any row to view details</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="input-label">Emp ID</label>
            <input
              className="input"
              placeholder="e.g. EMP001"
              value={filters.empId}
              onChange={e => onFilterChange('empId', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="input-label">Name</label>
            <input
              className="input"
              placeholder="Search name…"
              value={filters.name}
              onChange={e => onFilterChange('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="input-label">Designation</label>
            <select className="input" value={filters.designation} onChange={e => onFilterChange('designation', e.target.value)}>
              <option value="">All</option>
              {opts('currentDesignation').map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Employment Type</label>
            <select className="input" value={filters.employeeType} onChange={e => onFilterChange('employeeType', e.target.value)}>
              <option value="">All</option>
              {opts('employmentType').map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Location</label>
            <select className="input" value={filters.location} onChange={e => onFilterChange('location', e.target.value)}>
              <option value="">All</option>
              {opts('location').map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={handleReset} className="btn-secondary"><RotateCcw size={13} /> Reset</button>
          <button onClick={handleSearch} className="btn-primary"><Search size={13} /> Search</button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-surface-100 rounded-xl animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <User size={32} className="text-surface-300 mb-3" />
          <p className="text-surface-500 text-sm">No employees found.</p>
          <button onClick={handleReset} className="btn-secondary mt-4 text-xs"><RotateCcw size={12} /> Clear filters</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Date of Joining</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Reporting Manager</th>
                <th>Employment Type</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={i} className="cursor-pointer" onClick={() => setSelected(emp)}>
                  <td className="font-mono text-xs font-semibold">{fmt(emp.empId)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-600">
                        {(emp.name || emp.fullName || '?')[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium">{fmt(emp.name || emp.fullName)}</span>
                    </div>
                  </td>
                  <td>{fmtDate(emp.doj)}</td>
                  <td>{fmt(emp.currentDesignation || emp.designation)}</td>
                  <td>{fmt(emp.deptName || emp.department)}</td>
                  <td>{fmt(emp.reportingManager)}</td>
                  <td><span className="badge-gray">{titleCase(emp.employmentType)}</span></td>
                  <td className="font-mono text-xs">{fmt(emp.workPhoneNumber)}</td>
                  <td className="text-xs">{fmt(emp.officialEmailWork || emp.officialEmail)}</td>
                  <td>{fmt(emp.location)}</td>
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
            <select className="input w-auto py-1 text-xs" value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}>
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const pg    = start + i;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${pg === page ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'}`}>
                  {pg + 1}
                </button>
              );
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">»</button>
          </div>

          <span className="text-xs text-surface-400">Page {page + 1} of {totalPages} · {total} total</span>
        </div>
      )}

      {/* Detail drawer */}
      {selected && <DetailDrawer emp={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default EmployeeTable;