export const getAuthToken  = () => localStorage.getItem('accessToken');
export const getEmpId      = () => localStorage.getItem('EmpId');
export const getRole       = () => localStorage.getItem('Role');
export const getUsername   = () => localStorage.getItem('username');

export const isLoggedIn    = () => !!getAuthToken();

export const clearSession  = () => {
  ['accessToken', 'refreshToken', 'EmpId', 'username', 'Role', 'authToken'].forEach(
    k => localStorage.removeItem(k)
  );
};

export const saveSession = ({ token, refreshToken, empId, username, role }) => {
  localStorage.setItem('accessToken',   token);
  localStorage.setItem('refreshToken',  refreshToken ?? '');
  localStorage.setItem('EmpId',         empId);
  localStorage.setItem('username',      username);
  localStorage.setItem('Role',          role);
};
