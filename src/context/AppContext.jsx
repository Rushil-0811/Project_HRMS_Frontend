import { createContext, useContext, useState, useEffect } from 'react';

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [globalEmpData, setGlobalEmpData] = useState(null);

  // Collapse sidebar on small screens
  useEffect(() => {
    const handler = () => setSidebarOpen(window.innerWidth > 1080);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <AppContext.Provider value={{ sidebarOpen, setSidebarOpen, globalEmpData, setGlobalEmpData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
