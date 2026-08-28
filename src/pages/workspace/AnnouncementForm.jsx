import { useState } from 'react';
import { Megaphone, CheckCircle, AlertCircle, X } from 'lucide-react';
import client from '../../api/client';
import { getEmpId } from '../../utils/auth';

const today = () => new Date().toISOString().split('T')[0];

const AnnouncementForm = () => {
  const [form,     setForm]     = useState({ title: '', content: '', displayFromDate: today(), displayToDate: '' });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const onChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())          e.title           = 'Title is required';
    if (!form.content.trim())        e.content         = 'Content is required';
    if (!form.displayFromDate)       e.displayFromDate = 'Start date is required';
    if (!form.displayToDate)         e.displayToDate   = 'End date is required';
    else if (form.displayToDate < form.displayFromDate)
                                     e.displayToDate   = 'End date must be after start date';
    return e;
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await client.post('/hrms/api/v1/employees/recognition/announcements', {
        empId:               getEmpId(),
        announcementTitle:   form.title,
        announcementContent: form.content,
        announcementDate:    new Date().toISOString(),
        displayFromDate:     form.displayFromDate,
        displayToDate:       form.displayToDate,
      });
      showToast('success', 'Announcement posted successfully!');
      setForm({ title: '', content: '', displayFromDate: today(), displayToDate: '' });
      setErrors({});
    } catch (e) {
      showToast('error', e.response?.data?.message || 'Failed to post announcement.');
    } finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md border text-sm font-medium animate-slide-down ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Post Announcement</h1>
          <p className="page-subtitle">Broadcast a message to all employees</p>
        </div>
      </div>

      <div className="card space-y-5">
        {/* Title */}
        <div>
          <label className="input-label">Title <span className="text-danger">*</span></label>
          <input
            className="input"
            placeholder="e.g. Company Holiday Notice"
            value={form.title}
            onChange={e => onChange('title', e.target.value)}
          />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
        </div>

        {/* Content */}
        <div>
          <label className="input-label">Content <span className="text-danger">*</span></label>
          <textarea
            className="input min-h-[140px] resize-none"
            placeholder="Write your announcement here…"
            value={form.content}
            onChange={e => onChange('content', e.target.value)}
          />
          {errors.content && <p className="text-xs text-danger mt-1">{errors.content}</p>}
          <p className="text-2xs text-surface-400 mt-1 text-right">{form.content.length} characters</p>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Display From <span className="text-danger">*</span></label>
            <input
              className="input"
              type="date"
              value={form.displayFromDate}
              max={form.displayToDate || undefined}
              onChange={e => onChange('displayFromDate', e.target.value)}
            />
            {errors.displayFromDate && <p className="text-xs text-danger mt-1">{errors.displayFromDate}</p>}
          </div>
          <div>
            <label className="input-label">Display To <span className="text-danger">*</span></label>
            <input
              className="input"
              type="date"
              value={form.displayToDate}
              min={form.displayFromDate || undefined}
              onChange={e => onChange('displayToDate', e.target.value)}
            />
            {errors.displayToDate && <p className="text-xs text-danger mt-1">{errors.displayToDate}</p>}
          </div>
        </div>

        {/* Preview */}
        {form.title && form.content && (
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
            <p className="text-2xs uppercase tracking-widest font-semibold text-primary-400 mb-2">Preview</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Megaphone size={15} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-surface-900">{form.title}</p>
                <p className="text-xs text-surface-600 mt-1 line-clamp-3">{form.content}</p>
                {form.displayFromDate && form.displayToDate && (
                  <p className="text-2xs text-primary-500 mt-2">
                    Visible: {form.displayFromDate} → {form.displayToDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-surface-100">
          <button className="btn-secondary" onClick={() => { setForm({ title: '', content: '', displayFromDate: today(), displayToDate: '' }); setErrors({}); }}>
            Reset
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            <Megaphone size={14} />
            {saving ? 'Posting…' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;