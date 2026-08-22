import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn, LogOut, Clock, Calendar, Umbrella,
  Users, ChevronRight, Sun, Sunset, Moon, Star,
} from 'lucide-react';
import client from '../../api/client';
import { getEmpId, getUsername } from '../../utils/auth';

// ── helpers ──────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0');

const elapsed = (from, to = new Date()) => {
  const secs = Math.max(0, Math.floor((new Date(to) - new Date(from)) / 1000));
  return `${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`;
};

const progress = (from, to = new Date()) => {
  const secs = Math.max(0, Math.floor((new Date(to) - new Date(from)) / 1000));
  return Math.min(100, (secs / (9 * 3600)) * 100);
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun };
  if (h < 17) return { text: 'Good afternoon', Icon: Sunset };
  return { text: 'Good evening', Icon: Moon };
};

const fmtTime = dt => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = dt => dt ? new Date(dt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ── sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, iconBg, label, value, sub }) => (
  <div className="stat-card">
    <div className={`stat-icon ${iconBg}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-2xs uppercase tracking-widest font-semibold text-surface-400 mb-0.5">{label}</p>
      <p className="text-xl font-display font-bold text-surface-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const ProgressRing = ({ pct }) => {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <svg width="100" height="100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#eef0f6" strokeWidth="7" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="url(#grad)" strokeWidth="7"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5b52f5" />
          <stop offset="100%" stopColor="#818fff" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ── main component ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const empId    = getEmpId();
  const username = getUsername();
  const { text: greetText, Icon: GreetIcon } = greeting();

  const [emp,        setEmp]        = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [leaves,     setLeaves]     = useState(null);
  const [birthdays,  setBirthdays]  = useState([]);
  const [holidays,   setHolidays]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [timer,      setTimer]      = useState('00:00:00');
  const [pct,        setPct]        = useState(0);
  const [checking,   setChecking]   = useState(false);

  const intervalRef = useRef(null);

  // fetch employee profile
  useEffect(() => {
    client.get(`/hrms/api/v1/employees/profile/${empId}`)
      .then(r => setEmp(r.data))
      .catch(() => {});
  }, [empId]);

  // fetch attendance
  const fetchAttendance = () => {
    client.get(`/hrms/api/v1/employee/attendance/get-attendance-filters?empId=${empId}`)
      .then(r => {
        const today = new Date().toISOString().split('T')[0];
        const rec   = r.data.find(a => a.date === today) || null;
        setAttendance(rec);
      })
      .catch(() => {});
  };
  useEffect(() => { fetchAttendance(); }, [empId]);

  // fetch leave balance
  useEffect(() => {
    client.get(`/hrms/api/v1/employee/leaves/balance/${empId}`)
      .then(r => setLeaves(r.data))
      .catch(() => {});
  }, [empId]);

  // fetch birthdays
  useEffect(() => {
    client.get('/hrms/api/v1/employees/birthdays/upcoming')
      .then(r => setBirthdays(r.data?.slice(0, 4) || []))
      .catch(() => {});
  }, []);

  // fetch holidays
  useEffect(() => {
    client.get('/hrms/api/v1/holidays/upcoming')
      .then(r => setHolidays(r.data?.slice(0, 4) || []))
      .catch(() => {});
  }, []);

  // fetch announcements
  useEffect(() => {
    client.get('/hrms/api/v1/announcements')
      .then(r => setAnnouncements(r.data?.slice(0, 3) || []))
      .catch(() => {});
  }, []);

  // live timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (attendance?.checkInDateTime && !attendance?.checkOutDateTime) {
      intervalRef.current = setInterval(() => {
        setTimer(elapsed(attendance.checkInDateTime));
        setPct(progress(attendance.checkInDateTime));
      }, 1000);
    } else if (attendance?.checkInDateTime && attendance?.checkOutDateTime) {
      setTimer(elapsed(attendance.checkInDateTime, attendance.checkOutDateTime));
      setPct(progress(attendance.checkInDateTime, attendance.checkOutDateTime));
    }
    return () => clearInterval(intervalRef.current);
  }, [attendance]);

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      await client.post('/hrms/api/v1/employee/attendance/check-in', { empId });
      await fetchAttendance();
    } catch (e) {
      console.error(e);
    } finally { setChecking(false); }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    try {
      await client.post('/hrms/api/v1/employee/attendance/check-out', { empId });
      await fetchAttendance();
    } finally { setChecking(false); }
  };

  const checkedIn  = !!attendance?.checkInDateTime;
  const checkedOut = !!attendance?.checkOutDateTime;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Greeting banner ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-surface-400 text-sm mb-1">
            <GreetIcon size={14} />
            <span>{greetText}</span>
          </div>
          <h1 className="page-title">
            {emp?.name || username || 'Welcome back'} 👋
          </h1>
          <p className="page-subtitle">{fmtDate(new Date())}</p>
        </div>
        <button
          onClick={() => navigate('/main/workspace/leave-tracker')}
          className="btn-secondary hidden sm:flex"
        >
          <Umbrella size={14} /> Apply Leave
        </button>
      </div>

      {/* ── Top row: Check-in card + 3 stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Check-in / out card */}
        <div className="card sm:col-span-2 xl:col-span-1 flex flex-col items-center gap-4 py-6">
          <div className="relative flex items-center justify-center">
            <ProgressRing pct={pct} />
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-base font-bold text-surface-800 leading-none">{timer}</span>
              <span className="text-2xs text-surface-400 mt-0.5">elapsed</span>
            </div>
          </div>

          <div className="text-center">
            {checkedIn && (
              <p className="text-xs text-surface-500 mb-1">
                In: <span className="font-semibold text-surface-700">{fmtTime(attendance?.checkInDateTime)}</span>
                {checkedOut && (
                  <> · Out: <span className="font-semibold text-surface-700">{fmtTime(attendance?.checkOutDateTime)}</span></>
                )}
              </p>
            )}
          </div>

          {!checkedIn && (
            <button className="btn-primary w-full justify-center" onClick={handleCheckIn} disabled={checking}>
              <LogIn size={14} /> {checking ? 'Checking in…' : 'Check in'}
            </button>
          )}
          {checkedIn && !checkedOut && (
            <button className="btn-danger w-full justify-center" onClick={handleCheckOut} disabled={checking}>
              <LogOut size={14} /> {checking ? 'Checking out…' : 'Check out'}
            </button>
          )}
          {checkedIn && checkedOut && (
            <span className="badge-green w-full text-center justify-center py-1.5">Day complete</span>
          )}
        </div>

        {/* Stat cards */}
        <StatCard
          icon={Umbrella}
          iconBg="bg-primary-500"
          label="Leave Balance"
          value={leaves?.remainingLeaves ?? '—'}
          sub={`of ${leaves?.totalLeaves ?? '—'} days`}
        />
        <StatCard
          icon={Clock}
          iconBg="bg-accent-500"
          label="Today"
          value={checkedIn ? (checkedOut ? 'Done' : 'Active') : 'Not in'}
          sub={checkedIn ? `Checked in ${fmtTime(attendance?.checkInDateTime)}` : 'Haven\'t checked in yet'}
        />
        <StatCard
          icon={Calendar}
          iconBg="bg-emerald-500"
          label="Next Holiday"
          value={holidays[0]?.name ?? '—'}
          sub={holidays[0]?.date ? fmtDate(holidays[0].date) : ''}
        />
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Upcoming Holidays */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-surface-800 text-sm">Upcoming Holidays</h3>
            <button onClick={() => navigate('/main/workspace/holiday')} className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-0.5">
              All <ChevronRight size={12} />
            </button>
          </div>
          {holidays.length === 0
            ? <p className="text-surface-400 text-sm text-center py-6">No upcoming holidays</p>
            : (
              <ul className="space-y-3">
                {holidays.map((h, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Calendar size={14} className="text-primary-500" />
                      </div>
                      <span className="text-sm font-medium text-surface-800">{h.name}</span>
                    </div>
                    <span className="text-xs text-surface-400">{fmtDate(h.date)}</span>
                  </li>
                ))}
              </ul>
            )
          }
        </div>

        {/* Birthdays */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-surface-800 text-sm">Birthdays</h3>
            <Star size={14} className="text-accent-400" />
          </div>
          {birthdays.length === 0
            ? <p className="text-surface-400 text-sm text-center py-6">No upcoming birthdays</p>
            : (
              <ul className="space-y-3">
                {birthdays.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-sm flex-shrink-0">
                      {b.name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{b.name}</p>
                      <p className="text-xs text-surface-400">{fmtDate(b.dateOfBirth)}</p>
                    </div>
                    <span className="text-base">🎂</span>
                  </li>
                ))}
              </ul>
            )
          }
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-surface-800 text-sm">Announcements</h3>
          </div>
          {announcements.length === 0
            ? <p className="text-surface-400 text-sm text-center py-6">No announcements</p>
            : (
              <ul className="space-y-3">
                {announcements.map((a, i) => (
                  <li key={i} className="pb-3 border-b border-surface-100 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-surface-800 mb-0.5">{a.title}</p>
                    <p className="text-xs text-surface-500 line-clamp-2">{a.content}</p>
                    <p className="text-2xs text-surface-300 mt-1">{fmtDate(a.date)}</p>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
