import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, User, Users, FileText, Calendar,
  Clock, CalendarDays, Umbrella, Building2, CreditCard,
  Upload, Trophy, Megaphone, FolderOpen, ChevronDown,
  LogOut, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { clearSession, getRole } from '../../utils/auth';
import clsx from 'clsx';

// tiny clsx polyfill if not installed
const cx = (...args) => args.filter(Boolean).join(' ');

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cx(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100',
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
    )}
  >
    <Icon size={16} className="flex-shrink-0" />
    <span className="truncate">{label}</span>
  </NavLink>
);

const NavGroup = ({ icon: Icon, label, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-all"
      >
        <Icon size={16} className="flex-shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown size={13} className={cx('transition-transform duration-200', open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="ml-4 pl-3 border-l border-surface-200 mt-0.5 flex flex-col gap-0.5">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { sidebarOpen } = useApp();
  const navigate = useNavigate();
  const role = getRole();

  const handleLogout = () => { clearSession(); navigate('/'); };

  return (
    <aside
      className={cx(
        'fixed left-0 top-14 bottom-0 z-40 w-52 bg-surface-0 shadow-sidebar flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 flex flex-col gap-0.5">

        {/* Section label */}
        <p className="text-2xs font-semibold uppercase tracking-widest text-surface-400 px-3 mb-1">Main</p>

        <NavItem to="/main/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/main/inbox"     icon={Inbox}           label="Inbox" />

        <p className="text-2xs font-semibold uppercase tracking-widest text-surface-400 px-3 mb-1 mt-4">People</p>

        {role === 'HR' ? (
          <NavGroup icon={User} label="Profile">
            <NavItem to="/main/profile/profile-info"       icon={User}        label="My Profile" />
            <NavItem to="/main/profile/profile-info-form"  icon={FileText}    label="Profile Form" />
            <NavItem to="/main/profile/profile-info-table" icon={Users}       label="Employee Master" />
            <NavItem to="/main/profile/doc-info-table"     icon={ShieldCheck} label="Doc Approvals" />
          </NavGroup>
        ) : (
          <NavItem to="/main/profile/profile-info" icon={User} label="My Profile" />
        )}

        <p className="text-2xs font-semibold uppercase tracking-widest text-surface-400 px-3 mb-1 mt-4">Workspace</p>

        <NavItem to="/main/workspace/leave-tracker" icon={Umbrella}     label="Leave Tracker" />
        <NavItem to="/main/workspace/timesheet"     icon={Clock}        label="Attendance" />

        {role === 'HR' && (
          <NavItem to="/main/workspace/timesheet2"  icon={CalendarDays} label="HR Attendance" />
        )}

        <NavItem to="/main/workspace/holiday"       icon={Calendar}     label="Holidays" />
        <NavItem to="/main/workspace/shift"         icon={Building2}    label="Shift Details" />
        <NavItem to="/main/workspace/payslip"       icon={CreditCard}   label="Pay Slip" />

        {(role === 'HR' || role === 'Manager') && (
          <>
            <p className="text-2xs font-semibold uppercase tracking-widest text-surface-400 px-3 mb-1 mt-4">HR Tools</p>
            <NavItem to="/main/workspace/empdocform"      icon={FolderOpen} label="Doc Form" />
            <NavItem to="/main/workspace/documentdetails" icon={FileText}   label="Documents" />
            <NavItem to="/main/workspace/excelupload"     icon={Upload}     label="Excel Upload" />
            <NavItem to="/main/workspace/announcementForm" icon={Megaphone} label="Announcements" />
          </>
        )}

        <NavItem to="/main/workspace/achievementForm" icon={Trophy} label="Achievements" />
      </nav>

      {/* Footer logout */}
      <div className="px-3 py-3 border-t border-surface-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-surface-500 hover:bg-red-50 hover:text-danger transition-colors"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
