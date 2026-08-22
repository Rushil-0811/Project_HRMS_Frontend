import { Routes, Route, Navigate } from 'react-router-dom';
import Header  from './Header';
import Sidebar from './Sidebar';
import { useApp } from '../../context/AppContext';
import RoleBasedRoute from '../RoleBasedRoute';
import Unauthorized from '../../pages/Unauthorized';

// Pages — lazy could be added later
import Dashboard        from '../../pages/dashboard/Dashboard';
import UserProfile      from '../../pages/profile/UserProfile';
import UserProfileForm  from '../../pages/profile/UserProfileForm';
import EmployeeTable    from '../../pages/profile/EmployeeTable';
import HRDocApproval    from '../../pages/profile/HRDocApproval';
import LeaveModule      from '../../pages/workspace/LeaveModule';
import Attendance       from '../../pages/workspace/Attendance';
import TimeSheet        from '../../pages/workspace/TimeSheet';
import TimeSheet2       from '../../pages/workspace/TimeSheet2';
import HolidayList      from '../../pages/workspace/HolidayList';
import ShiftDetails     from '../../pages/workspace/ShiftDetails';
import PaySlip          from '../../pages/workspace/PaySlip';
import EmpDocForm       from '../../pages/workspace/EmpDocForm';
import AchievementForm  from '../../pages/workspace/AchievementForm';
import AnnouncementForm from '../../pages/workspace/AnnouncementForm';
import DocumentDetails  from '../../pages/workspace/DocumentDetails';
import ExcelUpload      from '../../pages/workspace/ExcelUpload';
import Inbox            from '../../pages/inbox/Inbox';

const HR_MGR = ['HR', 'Manager'];
const ALL    = ['Employee', 'HR', 'Manager'];

const AppLayout = () => {
  const { sidebarOpen } = useApp();

  return (
    <div className="min-h-screen bg-surface-50">
      <Header />
      <Sidebar />

      {/* Overlay for mobile when sidebar open */}
      <div
        className={`fixed inset-0 bg-surface-900/30 z-30 transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Main content shifts right when sidebar open */}
      <main
        className={`pt-14 transition-all duration-200 ${
          sidebarOpen ? 'lg:ml-52' : ''
        } min-h-screen`}
      >
        <div className="p-6 max-w-screen-2xl mx-auto">
          <Routes>
            <Route index                            element={<Dashboard />} />
            <Route path="dashboard"                 element={<Dashboard />} />
            <Route path="inbox"                     element={<Inbox />} />

            {/* Profile */}
            <Route path="profile/profile-info"      element={<UserProfile />} />
            <Route path="profile/profile-info-form" element={<RoleBasedRoute allowedRoles={['HR']}><UserProfileForm /></RoleBasedRoute>} />
            <Route path="profile/profile-info-table" element={<RoleBasedRoute allowedRoles={HR_MGR}><EmployeeTable /></RoleBasedRoute>} />
            <Route path="profile/doc-info-table"    element={<RoleBasedRoute allowedRoles={HR_MGR}><HRDocApproval /></RoleBasedRoute>} />

            {/* Workspace */}
            <Route path="calendar"                  element={<LeaveModule />} />
            <Route path="workspace/leave-tracker"   element={<LeaveModule />} />
            <Route path="workspace/attendance"      element={<Attendance />} />
            <Route path="workspace/timesheet"       element={<TimeSheet />} />
            <Route path="workspace/timesheet2"      element={<RoleBasedRoute allowedRoles={HR_MGR}><TimeSheet2 /></RoleBasedRoute>} />
            <Route path="workspace/holiday"         element={<HolidayList />} />
            <Route path="workspace/shift"           element={<ShiftDetails />} />
            <Route path="workspace/payslip"         element={<PaySlip />} />
            <Route path="workspace/empdocform"      element={<RoleBasedRoute allowedRoles={HR_MGR}><EmpDocForm /></RoleBasedRoute>} />
            <Route path="workspace/achievementForm" element={<RoleBasedRoute allowedRoles={ALL}><AchievementForm /></RoleBasedRoute>} />
            <Route path="workspace/announcementForm" element={<RoleBasedRoute allowedRoles={HR_MGR}><AnnouncementForm /></RoleBasedRoute>} />
            <Route path="workspace/documentdetails" element={<RoleBasedRoute allowedRoles={HR_MGR}><DocumentDetails /></RoleBasedRoute>} />
            <Route path="workspace/excelupload"     element={<RoleBasedRoute allowedRoles={HR_MGR}><ExcelUpload /></RoleBasedRoute>} />

            <Route path="unauthorized"              element={<Unauthorized />} />
            <Route path="*"                         element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
