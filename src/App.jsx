import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { isLoggedIn } from './utils/auth';
import Login     from './pages/auth/Login';
import AppLayout from './components/layout/AppLayout';

const PrivateRoute = ({ children }) =>
  isLoggedIn() ? children : <Navigate to="/" replace />;

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"      element={<Login />} />
          <Route path="/main/*" element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
