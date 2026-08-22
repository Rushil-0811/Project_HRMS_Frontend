import { Navigate } from 'react-router-dom';
import { getRole } from '../utils/auth';

const RoleBasedRoute = ({ allowedRoles, children }) => {
  const role = getRole();
  if (!allowedRoles.includes(role)) return <Navigate to="/main/unauthorized" replace />;
  return children;
};

export default RoleBasedRoute;
