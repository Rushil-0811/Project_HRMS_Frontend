// src/pages/workspace/ExcelUpload.jsx
import { useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import client from '../../api/client';

// ── config ────────────────────────────────────────────────────────────────────
const UPLOAD_TYPES = [
  {
    value:    'employee',
    label:    'Employee Details',
    endpoint: '/api/approval/excel/tables?tableType=All',
    hint:     'File must be named exactly "Formatted_Employee_Template.xlsx"',
    filename: 'Formatted_Employee_Template',
    sendInvites: true,
  },
  {
    value:    'leave',
    label:    'Leave Details',
    endpoint: '/hrms/api/v1/excel/employee-leaves',
    hint:     'Excel with columns: EmpID, LeaveType, TotalLeaves, Balance',
    filename: null,
  },
  {
    value:    'approval',
    label:    'Approval Flow',
    endpoint: '/hrms/api/v1/excel/approval-matrix',
    hint:     'Excel with approval matrix data',
    filename: null,
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────
const isValidExcel = (file) =>
  file.name.endsWith('.xls') || file.name.endsWith('.xlsx') ||
  file.type === 'application/vnd.ms-excel' ||
  file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md border text-sm font-medium animate-slide-down max-w-sm ${
      toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {toast.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 flex-shrink-0"><X size={14} /></button>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ExcelUpload = () => {
  const [uploadType, setUploadType] = useState('employee');
  const [file,       setFile]       = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');
  const [toast,      setToast]      = useState(null);
  const [result,     setResult]     = useState(null); // { success, failed, total }

  const config = UPLOAD_TYPES.find(t => t.value === uploadType);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const validateFile = (f) => {
    if (!isValidExcel(f)) {
      setError('Only .xls or .xlsx files are accepted.');
      return false;
    }
    // Filename check for employee template
    if (config.filename) {
      const nameWithoutExt = f.name.replace(/\.xlsx?$/i, '');
      if (nameWithoutExt !== config.filename) {
        setError(`File must be named exactly "${config.filename}.xlsx"`);
        return false;
      }
    }
    setError('');
    return true;
  };

  const pickFile = (f) => {
    if (validateFile(f)) { setFile(f); setResult(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  };

  const handleTypeChange = (val) => {
    setUploadType(val);
    setFile(null);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    setUploading(true); setError(''); setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await client.post(config.endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data         = res.data || {};
      const failureCount = data.failureCount || 0;
      const successCount = data.successCount || data.insertedCount || 0;
      const total        = data.totalCount   || (successCount + failureCount);
      const hasErrors    = failureCount > 0 || (data.message || '').toLowerCase().includes('error');

      if (hasErrors) {
        setResult({ success: successCount, failed: failureCount, total });
        setError('Some rows failed to upload. Check the result below.');
      } else {
        setResult({ success: successCount || total, failed: 0, total });
        showToast('success', `${config.label} uploaded successfully!${config.sendInvites ? ' Invite emails will be sent to new employees.' : ''}`);
        setFile(null);
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Upload failed.';
      const status = e.response?.status;
      setError(
        status === 400
          ? 'Invalid file format. Please ensure the correct template is used.'
          : msg
      );
    } finally { setUploading(false); }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Excel Upload</h1>
          <p className="page-subtitle">Bulk import data using Excel templates</p>
        </div>
      </div>

      <div className="card space-y-5">
        {/* Upload type selector */}
        <div>
          <label className="input-label">Upload Type</label>
          <div className="flex gap-2 flex-wrap">
            {UPLOAD_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  uploadType === t.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-surface-0 text-surface-600 border-surface-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info hint */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-600">
          <Info size={14} className="flex-shrink-0 mt-0.5 text-primary-500" />
          <div>
            <p className="font-semibold text-surface-700 mb-0.5">{config.label}</p>
            <p>{config.hint}</p>
            {config.sendInvites && (
              <p className="mt-1 text-primary-600 font-medium">
                ✦ Invite emails will automatically be sent to all new employees after upload.
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-danger text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Drop zone or file preview */}
        {!file ? (
          <label
            className={`flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
              dragging
                ? 'border-primary-400 bg-primary-50'
                : error
                ? 'border-red-300 bg-red-50'
                : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
              <FileSpreadsheet size={30} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-surface-800">Drag & drop your Excel file here</p>
              <p className="text-xs text-surface-400 mt-1">or click to browse · .xls and .xlsx only</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xls,.xlsx"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }}
            />
          </label>
        ) : (
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-green-50 border border-green-200">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={22} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-surface-900 truncate">{file.name}</p>
              <p className="text-xs text-surface-500 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB · {config.label}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="badge-green">Ready</span>
              <button
                onClick={() => { setFile(null); setError(''); setResult(null); }}
                className="p-1.5 rounded-lg text-surface-400 hover:bg-green-200"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Result summary */}
        {result && (
          <div className={`p-4 rounded-xl border ${result.failed > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <p className="text-sm font-semibold text-surface-800 mb-3">Upload Result</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-surface-0 rounded-lg py-2">
                <p className="text-xl font-display font-bold text-surface-800">{result.total || '—'}</p>
                <p className="text-2xs text-surface-400 uppercase tracking-wide">Total</p>
              </div>
              <div className="bg-green-50 rounded-lg py-2">
                <p className="text-xl font-display font-bold text-green-700">{result.success}</p>
                <p className="text-2xs text-green-500 uppercase tracking-wide">Success</p>
              </div>
              <div className="bg-red-50 rounded-lg py-2">
                <p className="text-xl font-display font-bold text-red-600">{result.failed}</p>
                <p className="text-2xs text-red-400 uppercase tracking-wide">Failed</p>
              </div>
            </div>
            {result.failed > 0 && (
              <p className="text-xs text-amber-700 mt-3">
                {result.failed} row{result.failed > 1 ? 's' : ''} failed — check that all required fields are correctly filled in the template.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-100">
          <button
            className="btn-secondary text-xs"
            onClick={() => { setFile(null); setError(''); setResult(null); }}
            disabled={uploading}
          >
            Reset
          </button>
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" />
                </svg>
                Uploading…
              </>
            ) : (
              <><Upload size={14} /> Upload & Process</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUpload;