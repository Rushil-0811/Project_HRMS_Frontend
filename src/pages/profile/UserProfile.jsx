import { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, Mail, Phone, Building2, Clock, Shield,
  GraduationCap, Briefcase, Network, FileText,
  Pencil, X, AlertCircle,
} from 'lucide-react';
import client from '../../api/client';
import { getEmpId, getUsername } from '../../utils/auth';

// helpers
const fmt = v => (!v || v === 'N/A' || v === '--') ? '—' : v;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const titleCase = s => s ? s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : '—';
const formatDuration = (dur) => {
  if (!dur) return 'N/A';
  const str = String(dur).toLowerCase().replace('years','').trim();
  const total = parseFloat(str);
  if (isNaN(total)) return str;
  if (total === 0) return '0 months';
  let years = Math.floor(total), months = Math.round((total - years) * 12);
  if (months === 12) { years++; months = 0; }
  return [years > 0 ? years+'y' : '', months > 0 ? months+'m' : ''].filter(Boolean).join(' ');
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-0.5">{label}</p>
    <p className="text-sm text-surface-800 font-medium">{value || '—'}</p>
  </div>
);
const Grid = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">{children}</div>;
const SectionCard = ({ id, title, icon: Icon, onEdit, children, isEmpty }) => (
  <div id={id} className="card mb-4 scroll-mt-4">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon size={15} className="text-primary-600" />
        </div>
        <h3 className="font-display font-bold text-surface-900 text-sm">{title}</h3>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="btn-ghost text-xs py-1.5 px-2.5">
          <Pencil size={12} /> Edit
        </button>
      )}
    </div>
    {isEmpty ? <p className="text-sm text-surface-400 text-center py-4">No information added yet.</p> : children}
  </div>
);
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-surface-0 rounded-2xl shadow-card-md w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-down">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
        <h3 className="font-display font-bold text-surface-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100"><X size={16} /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);
const FormField = ({ label, name, value, onChange, type='text', options }) => (
  <div>
    <label className="input-label">{label}</label>
    {options ? (
      <select className="input" name={name} value={value||''} onChange={onChange}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input className="input" type={type} name={name} value={value||''} onChange={onChange} />
    )}
  </div>
);

const useEmployeeData = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/hrms/api/v1/employees/search/all?empId='+getEmpId());
      setData(res.data?.content?.[0] || null);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
};

const PersonalSection = ({ data, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const startEdit = () => { setForm({ firstName: data?.firstName||'', lastName: data?.lastName||'', dateOfBirth: data?.dateOfBirth||'', gender: data?.gender||'', bloodGroup: data?.bloodGroup||'', maritalStatus: data?.maritalStatus||'' }); setOpen(true); };
  const handleSave = async () => { setSaving(true); try { await client.put('/hrms/api/v1/employees/basic-info/'+getEmpId(), form); onSaved(); setOpen(false); } catch(e){} finally { setSaving(false); } };
  const onChange = e => setForm(f => ({...f, [e.target.name]: e.target.value}));
  return (
    <>
      <SectionCard id="personal" title="Basic Information" icon={User} onEdit={startEdit} isEmpty={!data?.firstName && !data?.dateOfBirth}>
        <Grid>
          <Field label="First Name"     value={fmt(data?.firstName)} />
          <Field label="Last Name"      value={fmt(data?.lastName)} />
          <Field label="Date of Birth"  value={fmtDate(data?.dateOfBirth)} />
          <Field label="Age"            value={fmt(data?.age)} />
          <Field label="Gender"         value={titleCase(data?.gender)} />
          <Field label="Blood Group"    value={fmt(data?.bloodGroup)} />
          <Field label="Marital Status" value={titleCase(data?.maritalStatus)} />
        </Grid>
      </SectionCard>
      {open && <Modal title="Edit Basic Information" onClose={() => setOpen(false)}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" name="firstName" value={form.firstName} onChange={onChange} />
          <FormField label="Last Name" name="lastName" value={form.lastName} onChange={onChange} />
          <FormField label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} type="date" />
          <FormField label="Gender" name="gender" value={form.gender} onChange={onChange} options={['Male','Female','Other']} />
          <FormField label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={onChange} options={['A+','A-','B+','B-','O+','O-','AB+','AB-']} />
          <FormField label="Marital Status" name="maritalStatus" value={form.maritalStatus} onChange={onChange} options={['Single','Married','Divorced','Widowed']} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </Modal>}
    </>
  );
};

const ContactSection = ({ data, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const startEdit = () => { setForm({ mobileNumber: data?.mobileNumber||'', personalMailId: data?.personalMailId||'', emergencyContactPerson: data?.emergencyContactPerson||'', emergencyContactNumber: data?.emergencyContactNumber||'', presentAddress: data?.presentAddress||'', permanentAddress: data?.permanentAddress||'' }); setOpen(true); };
  const handleSave = async () => { setSaving(true); try { await client.put('/hrms/api/v1/employees/contact-info/'+getEmpId(), form); onSaved(); setOpen(false); } catch(e){} finally { setSaving(false); } };
  const onChange = e => setForm(f => ({...f, [e.target.name]: e.target.value}));
  return (
    <>
      <SectionCard id="contact" title="Contact Information" icon={Phone} onEdit={startEdit} isEmpty={!data?.mobileNumber && !data?.personalMailId}>
        <Grid>
          <Field label="Mobile Number"      value={fmt(data?.mobileNumber)} />
          <Field label="Personal Email"     value={fmt(data?.personalMailId)} />
          <Field label="Emergency Contact"  value={fmt(data?.emergencyContactPerson)} />
          <Field label="Emergency Number"   value={fmt(data?.emergencyContactNumber)} />
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Present Address"   value={fmt(data?.presentAddress)} /></div>
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Permanent Address" value={fmt(data?.permanentAddress)} /></div>
        </Grid>
      </SectionCard>
      {open && <Modal title="Edit Contact Information" onClose={() => setOpen(false)}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Mobile Number" name="mobileNumber" value={form.mobileNumber} onChange={onChange} />
          <FormField label="Personal Email" name="personalMailId" value={form.personalMailId} onChange={onChange} type="email" />
          <FormField label="Emergency Contact" name="emergencyContactPerson" value={form.emergencyContactPerson} onChange={onChange} />
          <FormField label="Emergency Number" name="emergencyContactNumber" value={form.emergencyContactNumber} onChange={onChange} />
          <div className="col-span-2"><label className="input-label">Present Address</label><textarea className="input min-h-[80px] resize-none" name="presentAddress" value={form.presentAddress} onChange={onChange} /></div>
          <div className="col-span-2"><label className="input-label">Permanent Address</label><textarea className="input min-h-[80px] resize-none" name="permanentAddress" value={form.permanentAddress} onChange={onChange} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </Modal>}
    </>
  );
};

const IdentitySection = ({ data, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const startEdit = () => { setForm({ uanNumber: data?.uanNumber||'', aadharNumber: data?.aadharNumber||'', panNumber: data?.panNumber||'' }); setOpen(true); };
  const handleSave = async () => { setSaving(true); try { await client.put('/hrms/api/v1/employees/identity-info/'+getEmpId(), form); onSaved(); setOpen(false); } catch(e){} finally { setSaving(false); } };
  const onChange = e => setForm(f => ({...f, [e.target.name]: e.target.value}));
  return (
    <>
      <SectionCard id="identity" title="Identity Information" icon={Shield} onEdit={startEdit} isEmpty={!data?.uanNumber && !data?.aadharNumber && !data?.panNumber}>
        <Grid>
          <Field label="UAN Number"    value={fmt(data?.uanNumber)} />
          <Field label="Aadhar Number" value={fmt(data?.aadharNumber)} />
          <Field label="PAN Number"    value={fmt(data?.panNumber)} />
        </Grid>
      </SectionCard>
      {open && <Modal title="Edit Identity Information" onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <FormField label="UAN Number" name="uanNumber" value={form.uanNumber} onChange={onChange} />
          <FormField label="Aadhar Number" name="aadharNumber" value={form.aadharNumber} onChange={onChange} />
          <FormField label="PAN Number" name="panNumber" value={form.panNumber} onChange={onChange} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </Modal>}
    </>
  );
};

const WorkSection = ({ data }) => (
  <SectionCard id="work" title="Work Information" icon={Building2} isEmpty={!data?.deptName && !data?.currentDesignation && !data?.doj}>
    <Grid>
      <Field label="Department"        value={titleCase(data?.deptName || data?.department)} />
      <Field label="Designation"       value={fmt(data?.currentDesignation || data?.designation)} />
      <Field label="Employment Type"   value={titleCase(data?.employmentType)} />
      <Field label="Date of Joining"   value={fmtDate(data?.doj)} />
      <Field label="Location"          value={fmt(data?.location)} />
      <Field label="Shift"             value={titleCase(data?.shift)} />
      <Field label="Official Email"    value={fmt(data?.officialEmailWork)} />
      <Field label="Work Phone"        value={fmt(data?.workPhoneNumber)} />
      <Field label="Reporting Manager" value={fmt(data?.reportingManager)} />
    </Grid>
  </SectionCard>
);

const EducationSection = ({ onSaved }) => {
  const [eduData, setEduData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const fetchEdu = useCallback(async () => {
    setLoading(true);
    try { const res = await client.get('/hrms/api/v1/employees/education/'+getEmpId()); setEduData(res.data); }
    catch(e){} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchEdu(); }, [fetchEdu]);
  const levels = [
    {key:'postgraduate',label:'Postgraduate'},{key:'undergraduate',label:'Undergraduate'},
    {key:'diploma',label:'Diploma'},{key:'higherSecondary',label:'Higher Secondary (12th)'},{key:'secondary',label:'Secondary (10th)'}
  ];
  const startEdit = () => { setForm(levels.reduce((a,l) => ({...a,[l.key]:eduData?.[l.key]||''}),{})); setOpen(true); };
  const handleSave = async () => { setSaving(true); try { await client.put('/hrms/api/v1/employees/education/'+getEmpId(), form); await fetchEdu(); onSaved(); setOpen(false); } catch(e){} finally { setSaving(false); } };
  const onChange = e => setForm(f => ({...f,[e.target.name]:e.target.value}));
  return (
    <>
      <SectionCard id="education" title="Education" icon={GraduationCap} onEdit={startEdit} isEmpty={!loading && !eduData}>
        {loading ? <div className="py-4 text-center text-surface-400 text-sm">Loading…</div> : (
          <div className="space-y-3">
            {levels.map(l => eduData?.[l.key] && (
              <div key={l.key} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 border border-surface-100">
                <div><p className="text-sm font-semibold text-surface-800">{l.label}</p><p className="text-xs text-surface-500 mt-0.5">{eduData[l.key]}</p></div>
                <span className="badge-blue">{l.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {open && <Modal title="Edit Education" onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          {levels.map(l => <FormField key={l.key} label={l.label} name={l.key} value={form[l.key]} onChange={onChange} />)}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </Modal>}
    </>
  );
};

const ExperienceSection = ({ onSaved }) => {
  const [expData, setExpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const fetchExp = useCallback(async () => {
    setLoading(true);
    try { const res = await client.get('/hrms/api/v1/employees/experience/'+getEmpId()); setExpData(res.data); }
    catch(e){} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchExp(); }, [fetchExp]);
  const entries = Array.isArray(expData) ? expData : (expData ? [expData] : []);
  const startEdit = () => { setForm({ totalExperience: expData?.totalExperience||'', previousCompany: expData?.previousCompany||'', previousRole: expData?.previousRole||'', fromDate: expData?.fromDate||'', toDate: expData?.toDate||'' }); setOpen(true); };
  const handleSave = async () => { setSaving(true); try { await client.put('/hrms/api/v1/employees/experience/'+getEmpId(), form); await fetchExp(); onSaved(); setOpen(false); } catch(e){} finally { setSaving(false); } };
  const onChange = e => setForm(f => ({...f,[e.target.name]:e.target.value}));
  return (
    <>
      <SectionCard id="experience" title="Experience" icon={Briefcase} onEdit={startEdit} isEmpty={!loading && entries.length===0}>
        {loading ? <div className="py-4 text-center text-surface-400 text-sm">Loading…</div> : (
          <div className="space-y-3">
            {entries.map((exp,i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-surface-800">{fmt(exp.previousRole||exp.role)}</p>
                    <p className="text-xs text-surface-500">{fmt(exp.previousCompany||exp.company)}</p>
                  </div>
                  <span className="badge-purple">{formatDuration(exp.totalExperience||exp.duration)}</span>
                </div>
                <p className="text-xs text-surface-400">{fmtDate(exp.fromDate)} → {exp.toDate ? fmtDate(exp.toDate) : 'Present'}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {open && <Modal title="Edit Experience" onClose={() => setOpen(false)}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Total Experience" name="totalExperience" value={form.totalExperience} onChange={onChange} />
          <FormField label="Previous Company" name="previousCompany" value={form.previousCompany} onChange={onChange} />
          <FormField label="Previous Role"    name="previousRole"    value={form.previousRole}    onChange={onChange} />
          <FormField label="From Date"        name="fromDate"        value={form.fromDate}        onChange={onChange} type="date" />
          <FormField label="To Date"          name="toDate"          value={form.toDate}          onChange={onChange} type="date" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </Modal>}
    </>
  );
};

const HierarchyTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    client.get('/hrms/api/v1/employees/hierarchy/employee?empId='+getEmpId())
      .then(r => setData(r.data)).catch(()=>{}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="py-12 text-center text-surface-400 text-sm">Loading hierarchy…</div>;
  if (!data)   return <div className="py-12 text-center text-surface-400 text-sm">No hierarchy data available.</div>;
  const renderNode = (node, depth=0) => (
    <div key={node.empId} className={depth > 0 ? 'ml-8 mt-2' : ''}>
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${depth===0?'bg-primary-50 border-primary-200':depth===1?'bg-surface-50 border-surface-200':'bg-surface-0 border-surface-100'}`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${depth===0?'bg-primary-600 text-white':'bg-surface-200 text-surface-700'}`}>
          {node.name?.[0] ?? '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-surface-900">{node.name}</p>
          <p className="text-xs text-surface-500">{node.designation || node.empId}</p>
        </div>
        {depth===0 && <span className="ml-auto badge-blue">You</span>}
        {depth===1 && <span className="ml-auto badge-gray text-2xs">Manager</span>}
      </div>
      {node.reportees?.map(r => renderNode(r, depth+1))}
    </div>
  );
  return <div className="card"><h3 className="font-display font-bold text-surface-900 mb-4 text-sm">Reporting Structure</h3>{renderNode(data)}</div>;
};

const DocumentsTab = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    client.get('/hrms/api/v1/employees/documents/'+getEmpId())
      .then(r => setDocs(r.data||[])).catch(()=>{}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="py-12 text-center text-surface-400 text-sm">Loading…</div>;
  if (docs.length===0) return (
    <div className="card flex flex-col items-center py-12 text-center">
      <FileText size={32} className="text-surface-300 mb-3" />
      <p className="text-surface-500 text-sm">No documents uploaded yet.</p>
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {docs.map((doc,i) => (
        <div key={i} className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-800 truncate">{doc.documentType||doc.name}</p>
            <p className="text-xs text-surface-400">{doc.status||'Uploaded'}</p>
          </div>
          <span className={doc.status==='Approved'?'badge-green':doc.status==='Rejected'?'badge-red':'badge-amber'}>{doc.status||'Pending'}</span>
        </div>
      ))}
    </div>
  );
};

const TABS = [{id:'overview',label:'Profile Overview'},{id:'hierarchy',label:'Hierarchy'},{id:'documents',label:'Documents'}];
const SECTIONS = [{id:'personal',label:'Basic Info'},{id:'contact',label:'Contact'},{id:'identity',label:'Identity'},{id:'work',label:'Work Info'},{id:'education',label:'Education'},{id:'experience',label:'Experience'}];

const UserProfile = () => {
  const { data, loading, error, refetch } = useEmployeeData();
  const [activeTab, setActiveTab]         = useState('overview');
  const [activeSection, setActiveSection] = useState('personal');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (activeTab !== 'overview') return;
    const el = scrollRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).map(e => ({id:e.target.id,ratio:e.intersectionRatio})).sort((a,b)=>b.ratio-a.ratio);
      if (visible[0]) setActiveSection(visible[0].id);
    }, { root: el, rootMargin: '-10% 0px -60% 0px', threshold: [0,0.25,0.5,1] });
    SECTIONS.forEach(s => { const el2=document.getElementById(s.id); if(el2) observer.observe(el2); });
    return () => observer.disconnect();
  }, [activeTab, loading]);

  const scrollTo = id => { setActiveSection(id); document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}); };

  const profilePic = data?.profilePicture ? `data:image/jpeg;base64,${data.profilePicture}` : null;
  const managerPic = data?.reportingManagerProfilePicture ? `data:image/jpeg;base64,${data.reportingManagerProfilePicture}` : null;

  if (error) return (
    <div className="flex items-center gap-2 text-danger text-sm p-4 bg-red-50 rounded-xl border border-red-200">
      <AlertCircle size={16} /> Failed to load profile data.
    </div>
  );

  return (
    <div className="flex gap-5 animate-fade-in" style={{height:'calc(100vh - 5.5rem)'}}>
      <div className="w-72 flex-shrink-0 flex-col overflow-hidden rounded-xl shadow-card border border-surface-100 bg-surface-0 hidden lg:flex">
        <div className="h-24 bg-gradient-to-br from-primary-700 to-primary-950 relative">
          <div className="absolute -bottom-10 left-5">
            <div className="w-20 h-20 rounded-2xl border-4 border-surface-0 overflow-hidden bg-surface-200">
              {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center bg-primary-100"><User size={28} className="text-primary-400" /></div>}
            </div>
          </div>
        </div>
        <div className="pt-14 px-5 pb-5 flex-1 overflow-y-auto bg-surface-50">
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 bg-surface-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-surface-100 rounded animate-pulse w-1/2" />
            </div>
          ) : (
            <>
              <h2 className="font-display font-bold text-surface-900 text-lg leading-tight line-clamp-2">
                {data?.fullName || data?.firstName || getUsername() || '—'}
              </h2>
              <p className="text-xs text-surface-500 mt-1">{fmt(data?.currentDesignation || data?.designation)} · {data?.empId || getEmpId()}</p>
              <div className="mt-5 space-y-3">
                {[
                  {Icon:Building2, value:titleCase(data?.department||data?.deptName), label:'Department'},
                  {Icon:Mail,      value:fmt(data?.officialEmailWork),                label:'Official Email'},
                  {Icon:Phone,     value:fmt(data?.mobileNumber||data?.workPhoneNumber), label:'Mobile'},
                  {Icon:Clock,     value:titleCase(data?.shift),                      label:'Shift'},
                ].map(({Icon,value,label}) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={13} className="text-surface-500" />
                    </div>
                    <div>
                      <p className="text-sm text-surface-800">{value}</p>
                      <p className="text-2xs text-surface-400">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-surface-200">
                <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-3">Reporting Manager</p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-0 border border-surface-100">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-200 flex-shrink-0 flex items-center justify-center">
                    {managerPic ? <img src={managerPic} alt="Manager" className="w-full h-full object-cover" /> : <User size={14} className="text-surface-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800">{fmt(data?.reportingManagerName)}</p>
                    <p className="text-xs text-surface-500">{fmt(data?.reportingManagerDesignation)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex gap-1 mb-4 bg-surface-100 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab===t.id?'bg-surface-0 text-surface-900 shadow-card':'text-surface-500 hover:text-surface-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="flex gap-1.5 flex-wrap mb-4">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeSection===s.id?'bg-primary-600 text-white':'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-4 bg-surface-200 rounded w-1/3 mb-4" />
                      <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_,j) => <div key={j}><div className="h-2 bg-surface-100 rounded w-1/2 mb-2"/><div className="h-4 bg-surface-200 rounded w-3/4"/></div>)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <PersonalSection  data={data} onSaved={refetch} />
                  <ContactSection   data={data} onSaved={refetch} />
                  <IdentitySection  data={data} onSaved={refetch} />
                  <WorkSection      data={data} />
                  <EducationSection onSaved={refetch} />
                  <ExperienceSection onSaved={refetch} />
                </>
              )}
            </div>
          </>
        )}
        {activeTab === 'hierarchy' && <div className="flex-1 overflow-y-auto"><HierarchyTab /></div>}
        {activeTab === 'documents' && <div className="flex-1 overflow-y-auto"><DocumentsTab /></div>}
      </div>
    </div>
  );
};

export default UserProfile;