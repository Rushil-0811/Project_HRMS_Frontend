import { useEffect, useState } from 'react';
import { Menu, Bell, AlignLeft, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { clearSession, getUsername, getEmpId } from '../../utils/auth';
import client from '../../api/client';

const Header = () => {
  const { setSidebarOpen, sidebarOpen } = useApp();
  const navigate  = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen]         = useState(false);
  const username = getUsername();

  useEffect(() => {
    const empId = getEmpId();
    if (!empId) return;
    client.get(`/hrms/api/v1/employees/profile/${empId}`)
      .then(res => {
        if (res.data.profilePicture)
          setProfileImage(`data:image/jpeg;base64,${res.data.profilePicture}`);
      })
      .catch(() => {});
  }, []);

  // Auto-logout at midnight
  useEffect(() => {
    const now    = new Date();
    const target = new Date(); target.setHours(23, 59, 59, 0);
    const ms     = target - now;
    if (ms > 0) {
      const t = setTimeout(handleLogout, ms);
      return () => clearTimeout(t);
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-0 border-b border-surface-100 flex items-center px-4 gap-3">
      {/* Hamburger */}
      <button
        onClick={() => setSidebarOpen(o => !o)}
        className="p-2 rounded-lg text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-colors"
      >
        <AlignLeft size={18} />
      </button>

      {/* Logo wordmark */}
      <div className="flex items-center gap-2 mr-auto">
        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
          <span className="text-white text-xs font-display font-bold">H</span>
        </div>
        <span className="font-display font-bold text-surface-900 text-sm tracking-tight hidden sm:block">
          HRMS
        </span>
      </div>

      {/* Right actions */}
      <button className="p-2 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors relative">
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-500 rounded-full" />
      </button>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-surface-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-primary-100 flex items-center justify-center">
            {profileImage
              ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              : <User size={15} className="text-primary-500" />
            }
          </div>
          <span className="text-xs font-medium text-surface-700 hidden sm:block max-w-[80px] truncate">
            {username || 'Account'}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 w-44 bg-surface-0 rounded-xl shadow-card-md border border-surface-100 py-1 animate-slide-down z-50">
            <button
              onClick={() => { setMenuOpen(false); navigate('/main/profile/profile-info'); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            >
              <User size={14} /> My Profile
            </button>
            <div className="border-t border-surface-100 my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
