import { useState } from 'react';
import { Trophy, CheckCircle, AlertCircle, X } from 'lucide-react';
import client from '../../api/client';
import { getEmpId } from '../../utils/auth';

const AchievementForm = () => {
  const [form,   setForm]   = useState({ title: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);

  const onChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
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
      await client.post('/hrms/api/v1/employees/recognition/achievement', {
        empId:                  getEmpId(),
        achievementTitle:       form.title,
        achievementDescription: form.description,
        achievementDate:        new Date().toISOString(),
        isRecognized:           true,
        additionalNotes:        'Awarded at the annual company meeting.',
      });
      showToast('success', 'Achievement submitted successfully!');
      setForm({ title: '', description: '' });
      setErrors({});
    } catch (e) {
      showToast('error', e.response?.data?.message || 'Failed to submit achievement.');
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
          <h1 className="page-title">Log Achievement</h1>
          <p className="page-subtitle">Record a milestone or accomplishment</p>
        </div>
      </div>

      <div className="card space-y-5">

        {/* Trophy banner */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Trophy size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800">Share your achievements</p>
            <p className="text-xs text-surface-500 mt-0.5">Completed a certification? Led a project? Log it here so HR can recognize your work.</p>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="input-label">Achievement Title <span className="text-danger">*</span></label>
          <input
            className="input"
            placeholder="e.g. AWS Certified Solutions Architect"
            value={form.title}
            onChange={e => onChange('title', e.target.value)}
          />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="input-label">Description <span className="text-danger">*</span></label>
          <textarea
            className="input min-h-[140px] resize-none"
            placeholder="Describe what you achieved and its impact…"
            value={form.description}
            onChange={e => onChange('description', e.target.value)}
          />
          {errors.description && <p className="text-xs text-danger mt-1">{errors.description}</p>}
          <p className="text-2xs text-surface-400 mt-1 text-right">{form.description.length} characters</p>
        </div>

        {/* Preview */}
        {form.title && form.description && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-2xs uppercase tracking-widest font-semibold text-amber-400 mb-2">Preview</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Trophy size={15} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-surface-900">{form.title}</p>
                <p className="text-xs text-surface-600 mt-1 line-clamp-3">{form.description}</p>
                <p className="text-2xs text-amber-500 mt-2">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-surface-100">
          <button className="btn-secondary" onClick={() => { setForm({ title: '', description: '' }); setErrors({}); }}>
            Reset
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            <Trophy size={14} />
            {saving ? 'Submitting…' : 'Submit Achievement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementForm;