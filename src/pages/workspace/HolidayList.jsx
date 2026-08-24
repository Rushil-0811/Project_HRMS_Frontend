// src/pages/workspace/HolidayList.jsx
import { useState, useEffect } from 'react';
import { Upload, X, Calendar, FileSpreadsheet } from 'lucide-react';
import client from '../../api/client';
import { getEmpId, getRole } from '../../utils/auth';

// ── helpers ───────────────────────────────────────────────────────────────────
const parseDate = (str) => {
  if (!str) return null;
  const parts = str.split(/[-/]/);
  if (parts.length !== 3) return null;
  const isDayFirst = parts[0].length <= 2;
  const day   = parseInt(isDayFirst ? parts[0] : parts[2]);
  const month = parseInt(parts[1]) - 1;
  const year  = parseInt(isDayFirst ? parts[2] : parts[0]);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
};

const fmtParts = (str) => {
  const d = parseDate(str);
  if (!d) return { month: '—', day: '—', dayOfMonth: '?' };
  return {
    month:      d.toLocaleString('default', { month: 'long' }),
    day:        d.toLocaleString('default', { weekday: 'long' }).slice(0, 3),
    dayOfMonth: String(d.getDate()).padStart(2, '0'),
  };
};

const isPast = (str) => {
  const d = parseDate(str);
  if (!d) return false;
  return d < new Date(new Date().setHours(0, 0, 0, 0));
};

const TYPE_STYLES = {
  mandatory: 'badge-blue',
  optional:  'badge-purple',
};

const YEAR_OPTIONS = ['2024', '2025', '2026'];
const TYPE_OPTIONS = [
  { value: 'all',       label: 'All Holidays' },
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'optional',  label: 'Optional' },
];

// ── Upload Modal ──────────────────────────────────────────────────────────────
const UploadModal = ({ onClose, onSuccess }) => {
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const [dragging,  setDragging]  = useState(false);

  const validate = (f) => {
    const ok = f.name.endsWith('.xls') || f.name.endsWith('.xlsx');
    if (!ok) setError('Only .xls or .xlsx files are accepted.');
    return ok;
  };

  const pick = (f) => { if (validate(f)) { setFile(f); setError(''); } };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pick(f);
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first.');
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await client.post('/hrms/api/v1/excel/holiday-list', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { failureCount, message: msg, errors } = res.data || {};
      if (failureCount > 0) {
        setError(`${msg || 'Some rows failed'} (${failureCount} failed)`);
      } else {
        onSuccess(); onClose();
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Upload failed. Please check the file format.');
    } finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-0 rounded-2xl shadow-card-md w-full max-w-md animate-slide-down">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="font-display font-bold text-surface-900">Upload Holiday List</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100"><X size={16} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {error && <p className="text-xs text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Drop zone */}
          {!file ? (
            <label
              className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                dragging ? 'border-primary-400 bg-primary-50' : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
              }`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Upload size={22} className="text-primary-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-surface-800">Drag & drop your file here</p>
                <p className="text-xs text-surface-400 mt-1">or click to browse · .xls, .xlsx only</p>
              </div>
              <input type="file" className="hidden" accept=".xls,.xlsx" onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); }} />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-800 truncate">{file.name}</p>
                <p className="text-xs text-surface-400">Ready to upload</p>
              </div>
              <button onClick={() => setFile(null)} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-200">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const HolidayList = () => {
  const role = getRole();
  const now  = new Date();

  const [year,     setYear]     = useState(String(now.getFullYear()));
  const [filter,   setFilter]   = useState('all');
  const [holidays, setHolidays] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [location, setLocation] = useState('');

  // Fetch employee location first
  useEffect(() => {
    client.get(`/hrms/api/v1/employees/search/all?empId=${getEmpId()}`)
      .then(r => setLocation(r.data?.content?.[0]?.location?.toLowerCase() || 'default'))
      .catch(() => setLocation('default'));
  }, []);

  const fetchHolidays = () => {
    if (!location) return;
    setLoading(true);
    const params = { year, branch: location };
    if (filter !== 'all') params.holidayType = filter;
    client.get('/hrms/api/v1/master/get-holidays', { params })
      .then(r => {
        const raw = Array.isArray(r.data) ? r.data : (r.data?.holidays || r.data?.data || []);
        setHolidays(raw.map(h => ({
          date:  h.date || h.holidayDate || '',
          name:  h.holidayName || h.event || 'Unknown',
          type: ((h.holidayType || 'Mandatory').charAt(0).toUpperCase() + (h.holidayType || 'mandatory').slice(1).toLowerCase()),
        })));
      })
      .catch(() => setHolidays([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHolidays(); }, [year, filter, location]);

  // Group by month
  const grouped = holidays.reduce((acc, h) => {
    const d = parseDate(h.date);
    const key = d ? d.toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {});

  const nextHoliday = holidays.find(h => !isPast(h.date));

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Holiday List</h1>
          <p className="page-subtitle">
            {nextHoliday
              ? <>Next: <span className="font-semibold text-surface-800">{nextHoliday.name}</span></>
              : `${year} holidays`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role === 'HR' && (
            <button onClick={() => setShowUpload(true)} className="btn-secondary">
              <Upload size={14} /> Upload Excel
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {/* Year pills */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
          {YEAR_OPTIONS.map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                year === y ? 'bg-surface-0 text-surface-900 shadow-card' : 'text-surface-500 hover:text-surface-700'
              }`}>
              {y}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-surface-200" />

        {/* Type pills */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
          {TYPE_OPTIONS.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === t.value ? 'bg-surface-0 text-surface-900 shadow-card' : 'text-surface-500 hover:text-surface-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-surface-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : holidays.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <Calendar size={32} className="text-surface-300 mb-3" />
          <p className="text-surface-500 text-sm">No holidays found for {year}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([monthLabel, items]) => (
            <div key={monthLabel}>
              <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-3">{monthLabel}</p>
              <div className="space-y-2">
                {items.map((h, i) => {
                  const { month, day, dayOfMonth } = fmtParts(h.date);
                  const past = isPast(h.date);
                  return (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      past
                        ? 'bg-surface-50 border-surface-100 opacity-50'
                        : 'bg-surface-0 border-surface-100 shadow-card hover:shadow-card-md hover:border-surface-200'
                    }`}>
                      {/* Date block */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                        past ? 'bg-surface-100' : 'bg-primary-50'
                      }`}>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${past ? 'text-surface-400' : 'text-primary-400'}`}>
                          {month.slice(0, 3)}
                        </span>
                        <span className={`text-xl font-display font-bold leading-none ${past ? 'text-surface-500' : 'text-primary-700'}`}>
                          {dayOfMonth}
                        </span>
                        <span className={`text-2xs ${past ? 'text-surface-400' : 'text-primary-400'}`}>{day}</span>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${past ? 'text-surface-500' : 'text-surface-900'}`}>{h.name}</p>
                        <span className={`mt-1 inline-block ${TYPE_STYLES[h.type.toLowerCase()] || 'badge-gray'}`}>
                          {h.type}
                        </span>
                      </div>

                      {/* Past label */}
                      {past && <span className="badge-gray flex-shrink-0">Past</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchHolidays(); }}
        />
      )}
    </div>
  );
};

export default HolidayList;