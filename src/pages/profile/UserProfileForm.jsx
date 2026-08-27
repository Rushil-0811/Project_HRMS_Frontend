// src/pages/profile/UserProfileForm.jsx
import { useState } from 'react';
import {
  User, Building2, GraduationCap, Briefcase,
  CheckCircle, AlertCircle, X, Send,
} from 'lucide-react';
import client from '../../api/client';

// ── constants ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  'Development', 'Quality Assurance', 'Networking',
  'Information Technology', 'Human Resource', 'Management',
  'Accounts and Finance', 'Business Development', 'Administration',
];

const SHIFTS = ['Morning', 'Evening', 'Night', 'General'];

const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];

const LOCATIONS = ['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Remote'];

const ROLES = ['Employee', 'Manager', 'HR'];

// ── helpers ───────────────────────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md border text-sm font-medium animate-slide-down ${
      toast.type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span>{toast.msg}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
};

const Field = ({ label, error, required, children }) => (
  <div>
    <label className="input-label">
      {label}{required && <span className="text-danger ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-danger mt-1">{error}</p>}
  </div>
);

const Grid = ({ cols = 2, children }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-4`}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-4 mt-6 first:mt-0">{children}</p>
);

// ── Tab 1: Personal Details ───────────────────────────────────────────────────
const PersonalForm = ({ onToast }) => {
  const EMPTY = {
    empId: '', salutation: 'Mr.', firstName: '', lastName: '',
    dateOfBirth: '', gender: '', bloodGroup: '', maritalStatus: '',
    mobileNumber: '', personalMailId: '',
    emergencyContactPerson: '', emergencyContactNumber: '',
    presentAddress: '', permanentAddress: '',
    username: '', email: '', role: 'Employee',
  };
  const [form,     setForm]     = useState(EMPTY);
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [inviting, setInviting] = useState(false);
  const [saved,    setSaved]    = useState(false); // track if personal details saved

  const onChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
    // auto set salutation based on gender
    if (field === 'gender') {
      if (val === 'Male')   setForm(f => ({ ...f, gender: val, salutation: 'Mr.' }));
      if (val === 'Female') setForm(f => ({ ...f, gender: val, salutation: 'Mrs.' }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.empId.trim())      e.empId      = 'Required';
    if (!form.firstName.trim())  e.firstName  = 'Required';
    if (!form.lastName.trim())   e.lastName   = 'Required';
    if (!form.dateOfBirth)       e.dateOfBirth = 'Required';
    if (!form.gender)            e.gender     = 'Required';
    if (!form.mobileNumber.trim()) e.mobileNumber = 'Required';
    if (!form.email.trim())      e.email      = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.username.trim())   e.username   = 'Required';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await client.post('/hrms/api/v1/employees/save/personal-details', {
        ...form,
        salutation: form.salutation,
      });
      setSaved(true);
      onToast('success', 'Personal details saved! You can now send the invite.');
    } catch (e) {
      onToast('error', e.response?.data?.message || 'Failed to save personal details.');
    } finally { setSaving(false); }
  };

  const handleInvite = async () => {
    if (!saved) { onToast('error', 'Please save personal details first.'); return; }
    setInviting(true);
    try {
      await client.post('/api/auth/invite', {
        username: form.username,
        email:    form.email,
        role:     form.role,
        empId:    form.empId,
        name:     `${form.firstName} ${form.lastName}`,
      });
      onToast('success', `Invite sent to ${form.email}!`);
    } catch (e) {
      onToast('error', e.response?.data?.message || 'Failed to send invite.');
    } finally { setInviting(false); }
  };

  const handleReset = () => { setForm(EMPTY); setErrors({}); setSaved(false); };

  return (
    <div className="space-y-1">
      <SectionTitle>Identity</SectionTitle>
      <Grid>
        <Field label="Employee ID" error={errors.empId} required>
          <input className="input" placeholder="e.g. EMP001" value={form.empId} onChange={e => onChange('empId', e.target.value)} />
        </Field>
        <Field label="Salutation">
          <select className="input" value={form.salutation} onChange={e => onChange('salutation', e.target.value)}>
            {['Mr.','Mrs.','Ms.','Dr.'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="First Name" error={errors.firstName} required>
          <input className="input" placeholder="First name" value={form.firstName} onChange={e => onChange('firstName', e.target.value)} />
        </Field>
        <Field label="Last Name" error={errors.lastName} required>
          <input className="input" placeholder="Last name" value={form.lastName} onChange={e => onChange('lastName', e.target.value)} />
        </Field>
        <Field label="Date of Birth" error={errors.dateOfBirth} required>
          <input className="input" type="date" value={form.dateOfBirth} onChange={e => onChange('dateOfBirth', e.target.value)} />
        </Field>
        <Field label="Gender" error={errors.gender} required>
          <select className="input" value={form.gender} onChange={e => onChange('gender', e.target.value)}>
            <option value="">Select…</option>
            {['Male','Female','Other'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Blood Group">
          <select className="input" value={form.bloodGroup} onChange={e => onChange('bloodGroup', e.target.value)}>
            <option value="">Select…</option>
            {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Marital Status">
          <select className="input" value={form.maritalStatus} onChange={e => onChange('maritalStatus', e.target.value)}>
            <option value="">Select…</option>
            {['Single','Married','Divorced','Widowed'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
      </Grid>

      <SectionTitle>Contact</SectionTitle>
      <Grid>
        <Field label="Mobile Number" error={errors.mobileNumber} required>
          <input className="input" placeholder="10-digit mobile" value={form.mobileNumber} onChange={e => onChange('mobileNumber', e.target.value)} />
        </Field>
        <Field label="Personal Email">
          <input className="input" type="email" placeholder="personal@email.com" value={form.personalMailId} onChange={e => onChange('personalMailId', e.target.value)} />
        </Field>
        <Field label="Emergency Contact Person">
          <input className="input" placeholder="Name" value={form.emergencyContactPerson} onChange={e => onChange('emergencyContactPerson', e.target.value)} />
        </Field>
        <Field label="Emergency Contact Number">
          <input className="input" placeholder="Phone" value={form.emergencyContactNumber} onChange={e => onChange('emergencyContactNumber', e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Present Address">
            <textarea className="input min-h-[70px] resize-none" placeholder="Present address" value={form.presentAddress} onChange={e => onChange('presentAddress', e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Permanent Address">
            <textarea className="input min-h-[70px] resize-none" placeholder="Permanent address" value={form.permanentAddress} onChange={e => onChange('permanentAddress', e.target.value)} />
          </Field>
        </div>
      </Grid>

      <SectionTitle>Account & Access</SectionTitle>
      <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 mb-4">
        <p className="text-xs text-primary-700 font-medium">These credentials will be used to send the invite email and create the login account.</p>
      </div>
      <Grid>
        <Field label="Username" error={errors.username} required>
          <input className="input" placeholder="e.g. john.doe" value={form.username} onChange={e => onChange('username', e.target.value)} />
        </Field>
        <Field label="Work Email" error={errors.email} required>
          <input className="input" type="email" placeholder="work@company.com" value={form.email} onChange={e => onChange('email', e.target.value)} />
        </Field>
        <Field label="Role" required>
          <select className="input" value={form.role} onChange={e => onChange('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </Grid>

      {/* Actions */}
      <div className="flex items-center justify-between pt-5 mt-2 border-t border-surface-100">
        <button className="btn-secondary" onClick={handleReset}>Reset</button>
        <div className="flex items-center gap-3">
          {saved && (
            <button
              className="btn-secondary"
              onClick={handleInvite}
              disabled={inviting}
            >
              <Send size={14} />
              {inviting ? 'Sending invite…' : 'Send Invite Email'}
            </button>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Personal Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Tab 2: Employee / Work Details ────────────────────────────────────────────
const EmployeeForm = ({ onToast }) => {
  const EMPTY = {
    empId: '', deptName: '', designation: '', currentDesignation: '',
    employmentType: '', doj: '', location: '', shift: '',
    officialEmailWork: '', workPhoneNumber: '', reportingManager: '',
  };
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.empId.trim())              e.empId              = 'Required';
    if (!form.deptName)                  e.deptName           = 'Required';
    if (!form.designation.trim())        e.designation        = 'Required';
    if (!form.currentDesignation.trim()) e.currentDesignation = 'Required';
    if (!form.employmentType)            e.employmentType     = 'Required';
    if (!form.doj)                       e.doj                = 'Required';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await client.post('/hrms/api/v1/employees/save-work', { empId: form.empId, ...form });
      onToast('success', 'Work details saved successfully!');
      setForm(EMPTY);
    } catch (e) {
      onToast('error', e.response?.data?.message || 'Failed to save work details.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-1">
      <SectionTitle>Work Information</SectionTitle>
      <Grid>
        <Field label="Employee ID" error={errors.empId} required>
          <input className="input" placeholder="e.g. EMP001" value={form.empId} onChange={e => onChange('empId', e.target.value)} />
        </Field>
        <Field label="Department" error={errors.deptName} required>
          <select className="input" value={form.deptName} onChange={e => onChange('deptName', e.target.value)}>
            <option value="">Select…</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Designation" error={errors.designation} required>
          <input className="input" placeholder="e.g. Software Engineer" value={form.designation} onChange={e => onChange('designation', e.target.value)} />
        </Field>
        <Field label="Current Designation" error={errors.currentDesignation} required>
          <input className="input" placeholder="e.g. Senior Engineer" value={form.currentDesignation} onChange={e => onChange('currentDesignation', e.target.value)} />
        </Field>
        <Field label="Employment Type" error={errors.employmentType} required>
          <select className="input" value={form.employmentType} onChange={e => onChange('employmentType', e.target.value)}>
            <option value="">Select…</option>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Date of Joining" error={errors.doj} required>
          <input className="input" type="date" value={form.doj} onChange={e => onChange('doj', e.target.value)} />
        </Field>
        <Field label="Location">
          <select className="input" value={form.location} onChange={e => onChange('location', e.target.value)}>
            <option value="">Select…</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Shift">
          <select className="input" value={form.shift} onChange={e => onChange('shift', e.target.value)}>
            <option value="">Select…</option>
            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Official Email">
          <input className="input" type="email" placeholder="emp@company.com" value={form.officialEmailWork} onChange={e => onChange('officialEmailWork', e.target.value)} />
        </Field>
        <Field label="Work Phone">
          <input className="input" placeholder="Work phone number" value={form.workPhoneNumber} onChange={e => onChange('workPhoneNumber', e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Reporting Manager">
            <input className="input" placeholder="Manager name or emp ID" value={form.reportingManager} onChange={e => onChange('reportingManager', e.target.value)} />
          </Field>
        </div>
      </Grid>

      <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-surface-100">
        <button className="btn-secondary" onClick={() => { setForm(EMPTY); setErrors({}); }}>Reset</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Work Details'}
        </button>
      </div>
    </div>
  );
};

// ── Tab 3: Education ──────────────────────────────────────────────────────────
const EducationForm = ({ onToast }) => {
  const EMPTY = {
    empId: '',
    sslcSchoolName: '', sslcYearOfPassing: '',
    hscSchoolName:  '', hscYearOfPassing:  '',
    ugDegree: '', ugStream: '', ugYearOfPassing: '', ugCollegeName: '', ugCgpa: '',
    pgDegree: '', pgStream: '', pgYearOfPassing: '', pgCollegeName: '', pgCgpa: '',
  };
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.empId.trim())          e.empId          = 'Required';
    if (!form.sslcSchoolName.trim()) e.sslcSchoolName = 'Required';
    if (!form.sslcYearOfPassing)     e.sslcYearOfPassing = 'Required';
    if (!form.ugDegree.trim())       e.ugDegree       = 'Required';
    if (!form.ugCollegeName.trim())  e.ugCollegeName  = 'Required';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await client.post('/hrms/api/v1/employees/save/education-details', { empId: form.empId, ...form });
      onToast('success', 'Education details saved!');
      setForm(EMPTY);
    } catch (e) {
      onToast('error', e.response?.data?.message || 'Failed to save education details.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-1">
      <Field label="Employee ID" error={errors.empId} required>
        <input className="input w-full sm:w-64" placeholder="e.g. EMP001" value={form.empId} onChange={e => onChange('empId', e.target.value)} />
      </Field>

      <SectionTitle>Secondary (SSLC / 10th)</SectionTitle>
      <Grid>
        <Field label="School Name" error={errors.sslcSchoolName} required>
          <input className="input" placeholder="School name" value={form.sslcSchoolName} onChange={e => onChange('sslcSchoolName', e.target.value)} />
        </Field>
        <Field label="Year of Passing" error={errors.sslcYearOfPassing} required>
          <input className="input" type="number" placeholder="e.g. 2012" value={form.sslcYearOfPassing} onChange={e => onChange('sslcYearOfPassing', e.target.value)} />
        </Field>
      </Grid>

      <SectionTitle>Higher Secondary (HSC / 12th)</SectionTitle>
      <Grid>
        <Field label="School Name">
          <input className="input" placeholder="School name" value={form.hscSchoolName} onChange={e => onChange('hscSchoolName', e.target.value)} />
        </Field>
        <Field label="Year of Passing">
          <input className="input" type="number" placeholder="e.g. 2014" value={form.hscYearOfPassing} onChange={e => onChange('hscYearOfPassing', e.target.value)} />
        </Field>
      </Grid>

      <SectionTitle>Undergraduate</SectionTitle>
      <Grid cols={3}>
        <Field label="Degree" error={errors.ugDegree} required>
          <input className="input" placeholder="e.g. B.E" value={form.ugDegree} onChange={e => onChange('ugDegree', e.target.value)} />
        </Field>
        <Field label="Stream">
          <input className="input" placeholder="e.g. Computer Science" value={form.ugStream} onChange={e => onChange('ugStream', e.target.value)} />
        </Field>
        <Field label="Year of Passing">
          <input className="input" type="number" placeholder="e.g. 2018" value={form.ugYearOfPassing} onChange={e => onChange('ugYearOfPassing', e.target.value)} />
        </Field>
        <Field label="College Name" error={errors.ugCollegeName} required>
          <input className="input" placeholder="College name" value={form.ugCollegeName} onChange={e => onChange('ugCollegeName', e.target.value)} />
        </Field>
        <Field label="CGPA / Percentage">
          <input className="input" placeholder="e.g. 8.5" value={form.ugCgpa} onChange={e => onChange('ugCgpa', e.target.value)} />
        </Field>
      </Grid>

      <SectionTitle>Postgraduate (optional)</SectionTitle>
      <Grid cols={3}>
        <Field label="Degree">
          <input className="input" placeholder="e.g. M.E" value={form.pgDegree} onChange={e => onChange('pgDegree', e.target.value)} />
        </Field>
        <Field label="Stream">
          <input className="input" placeholder="e.g. Data Science" value={form.pgStream} onChange={e => onChange('pgStream', e.target.value)} />
        </Field>
        <Field label="Year of Passing">
          <input className="input" type="number" placeholder="e.g. 2020" value={form.pgYearOfPassing} onChange={e => onChange('pgYearOfPassing', e.target.value)} />
        </Field>
        <Field label="College Name">
          <input className="input" placeholder="College name" value={form.pgCollegeName} onChange={e => onChange('pgCollegeName', e.target.value)} />
        </Field>
        <Field label="CGPA / Percentage">
          <input className="input" placeholder="e.g. 9.1" value={form.pgCgpa} onChange={e => onChange('pgCgpa', e.target.value)} />
        </Field>
      </Grid>

      <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-surface-100">
        <button className="btn-secondary" onClick={() => { setForm(EMPTY); setErrors({}); }}>Reset</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Education Details'}
        </button>
      </div>
    </div>
  );
};

// ── Tab 4: Experience ─────────────────────────────────────────────────────────
const ExperienceForm = ({ onToast }) => {
  const EMPTY_EXP = { employerName: '', designation: '', fromDate: '', toDate: '', reasonForLeaving: '' };
  const EMPTY = {
    empId: '', overallExperience: '', relevantExperiences: '',
    reasonForGap: '', otherExperiences: '',
    additionalExperiences: [],
  };
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const addExp    = () => setForm(f => ({ ...f, additionalExperiences: [...f.additionalExperiences, { ...EMPTY_EXP }] }));
  const removeExp = (i) => setForm(f => ({ ...f, additionalExperiences: f.additionalExperiences.filter((_, idx) => idx !== i) }));
  const onExpChange = (i, field, val) => setForm(f => ({
    ...f,
    additionalExperiences: f.additionalExperiences.map((e, idx) => idx === i ? { ...e, [field]: val } : e),
  }));

  // Auto-calculate overall experience
  const calcOverall = () => {
    const exps = form.additionalExperiences.filter(e => e.fromDate && e.toDate);
    if (exps.length === 0) return '';
    const totalMs = exps.reduce((sum, e) => sum + (new Date(e.toDate) - new Date(e.fromDate)), 0);
    const years   = (totalMs / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
    return `${years} years`;
  };

  const validate = () => {
    const e = {};
    if (!form.empId.trim()) e.empId = 'Required';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const overall = calcOverall() || form.overallExperience;
      await client.post('/hrms/api/v1/employees/save/experience-details', {
        empId: form.empId,
        overallExperience:       overall,
        relevantExperiences:     form.relevantExperiences,
        reasonForGap:            form.reasonForGap,
        otherExperiences:        form.otherExperiences,
        additionalExperiences:   form.additionalExperiences,
      });
      onToast('success', 'Experience details saved!');
      setForm(EMPTY);
    } catch (e) {
      onToast('error', e.response?.data?.message || 'Failed to save experience details.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-1">
      <Field label="Employee ID" error={errors.empId} required>
        <input className="input w-full sm:w-64" placeholder="e.g. EMP001" value={form.empId} onChange={e => onChange('empId', e.target.value)} />
      </Field>

      <SectionTitle>Summary</SectionTitle>
      <Grid>
        <Field label="Overall Experience">
          <input className="input" placeholder="Auto-calculated or enter manually" value={form.overallExperience || calcOverall()} onChange={e => onChange('overallExperience', e.target.value)} />
        </Field>
        <Field label="Relevant Experience">
          <input className="input" placeholder="e.g. Software Development" value={form.relevantExperiences} onChange={e => onChange('relevantExperiences', e.target.value)} />
        </Field>
        <Field label="Reason for Gap (if any)">
          <input className="input" placeholder="e.g. Personal reasons" value={form.reasonForGap} onChange={e => onChange('reasonForGap', e.target.value)} />
        </Field>
        <Field label="Other Experiences">
          <input className="input" placeholder="e.g. Freelance work" value={form.otherExperiences} onChange={e => onChange('otherExperiences', e.target.value)} />
        </Field>
      </Grid>

      <SectionTitle>Previous Employment</SectionTitle>
      <div className="space-y-3">
        {form.additionalExperiences.map((exp, i) => (
          <div key={i} className="p-4 rounded-xl bg-surface-50 border border-surface-200 relative">
            <button
              onClick={() => removeExp(i)}
              className="absolute top-3 right-3 p-1 rounded-lg text-surface-400 hover:bg-surface-200 hover:text-danger"
            >
              <X size={14} />
            </button>
            <p className="text-xs font-semibold text-surface-500 mb-3">Experience #{i + 1}</p>
            <Grid>
              <Field label="Employer Name">
                <input className="input" placeholder="Company name" value={exp.employerName} onChange={e => onExpChange(i, 'employerName', e.target.value)} />
              </Field>
              <Field label="Designation">
                <input className="input" placeholder="Role/Title" value={exp.designation} onChange={e => onExpChange(i, 'designation', e.target.value)} />
              </Field>
              <Field label="From">
                <input className="input" type="date" value={exp.fromDate} onChange={e => onExpChange(i, 'fromDate', e.target.value)} />
              </Field>
              <Field label="To">
                <input className="input" type="date" value={exp.toDate} onChange={e => onExpChange(i, 'toDate', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Reason for Leaving">
                  <input className="input" placeholder="e.g. Better opportunity" value={exp.reasonForLeaving} onChange={e => onExpChange(i, 'reasonForLeaving', e.target.value)} />
                </Field>
              </div>
            </Grid>
          </div>
        ))}
        <button onClick={addExp} className="btn-secondary text-xs">
          + Add Previous Employment
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-surface-100">
        <button className="btn-secondary" onClick={() => { setForm(EMPTY); setErrors({}); }}>Reset</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Experience Details'}
        </button>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'personal',   label: 'Personal Details',  icon: User         },
  { id: 'work',       label: 'Work Details',       icon: Building2    },
  { id: 'education',  label: 'Education',          icon: GraduationCap},
  { id: 'experience', label: 'Experience',         icon: Briefcase    },
];

const UserProfileForm = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [toast,     setToast]     = useState(null);

  const onToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Employee</h1>
          <p className="page-subtitle">Fill in each section and save — then send the invite email from Personal Details</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100 mb-6 text-sm text-primary-800">
        <Send size={16} className="flex-shrink-0 mt-0.5 text-primary-600" />
        <p>Save <strong>Personal Details</strong> first — the invite email button appears after saving. Fill the other tabs at your own pace using the Employee ID.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-6 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-surface-0 text-surface-900 shadow-card' : 'text-surface-500 hover:text-surface-700'
              }`}>
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="card">
        {activeTab === 'personal'   && <PersonalForm   onToast={onToast} />}
        {activeTab === 'work'       && <EmployeeForm   onToast={onToast} />}
        {activeTab === 'education'  && <EducationForm  onToast={onToast} />}
        {activeTab === 'experience' && <ExperienceForm onToast={onToast} />}
      </div>
    </div>
  );
};

export default UserProfileForm;