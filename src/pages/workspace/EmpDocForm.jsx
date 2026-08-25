// src/pages/workspace/EmpDocForm.jsx
import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import client from '../../api/client';

// ── constants ─────────────────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  'Education Experience Certificate',
  'Profile Picture',
  'PG Certificate',
  'UG Certificate',
  'Company Experience Certificate',
  '10th Marksheet',
  '12th Marksheet',
  'Payslip',
  'Others',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

const EMPTY = {
  empId:        '',
  documentName: '',
  documentType: '',
  docLocation:  '',
  year:         '',
};

const VALIDATIONS = {
  empId:        { pattern: /^[a-zA-Z0-9]{1,20}$/, msg: 'Only alphanumeric characters allowed' },
  documentName: { pattern: /^[A-Za-z\s]+$/,        msg: 'Only letters are allowed'             },
  docLocation:  { pattern: /^[A-Za-z\s]+$/,        msg: 'Only letters are allowed'             },
};

// ── helpers ───────────────────────────────────────────────────────────────────
const validate = (form, file) => {
  const errors = {};
  if (!form.empId.trim())        errors.empId        = 'Employee ID is required';
  else if (VALIDATIONS.empId.pattern && !VALIDATIONS.empId.pattern.test(form.empId))
                                 errors.empId        = VALIDATIONS.empId.msg;
  if (!form.documentName.trim()) errors.documentName = 'Document name is required';
  else if (!VALIDATIONS.documentName.pattern.test(form.documentName))
                                 errors.documentName = VALIDATIONS.documentName.msg;
  if (!form.documentType)        errors.documentType = 'Please select a document type';
  if (!form.docLocation.trim())  errors.docLocation  = 'Document location is required';
  else if (!VALIDATIONS.docLocation.pattern.test(form.docLocation))
                                 errors.docLocation  = VALIDATIONS.docLocation.msg;
  if (!file)                     errors.file         = 'Please upload a file';
  return errors;
};

// ── sub-components ────────────────────────────────────────────────────────────
const FormField = ({ label, error, children, required }) => (
  <div>
    <label className="input-label">
      {label}{required && <span className="text-danger ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-danger mt-1">{error}</p>}
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const EmpDocForm = () => {
  const [form,      setForm]      = useState(EMPTY);
  const [file,      setFile]      = useState(null);
  const [errors,    setErrors]    = useState({});
  const [submitting,setSubmitting]= useState(false);
  const [toast,     setToast]     = useState(null); // { type: 'success'|'error', msg }
  const [dragging,  setDragging]  = useState(false);

  const onChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const pickFile = f => {
    setFile(f);
    if (errors.file) setErrors(e => ({ ...e, file: '' }));
  };

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async () => {
    const errs = validate(form, file);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        empId:        form.empId,
        doc_location: form.docLocation,
        referenceNumber: form.empId,
        documentType: form.documentType,
        documentName: form.documentName,
        role:         'HR',
        ...(form.year && { year: form.year }),
      });

      const fd = new FormData();
      fd.append('file', file);

      await client.post(`/hrms/api/v1/file/upload?${params}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('success', 'Document uploaded successfully!');
      setForm(EMPTY);
      setFile(null);
      setErrors({});
    } catch (e) {
      showToast('error', e.response?.data || e.message || 'Upload failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleReset = () => { setForm(EMPTY); setFile(null); setErrors({}); };

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md border text-sm font-medium animate-slide-down ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Employee Document</h1>
          <p className="page-subtitle">Upload and tag documents to an employee record</p>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Left col */}
          <FormField label="Employee ID" error={errors.empId} required>
            <input
              className="input"
              name="empId"
              placeholder="e.g. EMP001"
              value={form.empId}
              onChange={onChange}
            />
          </FormField>

          <FormField label="Document Name" error={errors.documentName} required>
            <input
              className="input"
              name="documentName"
              placeholder="e.g. Aadhar Card"
              value={form.documentName}
              onChange={onChange}
            />
          </FormField>

          <FormField label="Document Type" error={errors.documentType} required>
            <select
              className="input"
              name="documentType"
              value={form.documentType}
              onChange={onChange}
            >
              <option value="">Select type…</option>
              {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>

          <FormField label="Document Location" error={errors.docLocation} required>
            <input
              className="input"
              name="docLocation"
              placeholder="e.g. Chennai"
              value={form.docLocation}
              onChange={onChange}
            />
          </FormField>

          <FormField label="Year" error={errors.year}>
            <select
              className="input"
              name="year"
              value={form.year}
              onChange={onChange}
            >
              <option value="">Select year (optional)</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </FormField>
        </div>

        {/* File upload */}
        <div className="mt-5">
          <FormField label="Upload File" error={errors.file} required>
            {!file ? (
              <label
                className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  dragging
                    ? 'border-primary-400 bg-primary-50'
                    : errors.file
                    ? 'border-red-300 bg-red-50'
                    : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
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
                  <p className="text-xs text-surface-400 mt-1">or click to browse · PDF, JPG, PNG, DOC</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-800 truncate">{file.name}</p>
                  <p className="text-xs text-surface-400">
                    {(file.size / 1024).toFixed(1)} KB · Ready to upload
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-200 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-surface-100">
          <button className="btn-secondary" onClick={handleReset} disabled={submitting}>
            Reset
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" />
                </svg>
                Uploading…
              </>
            ) : (
              <><Upload size={14} /> Upload Document</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmpDocForm;