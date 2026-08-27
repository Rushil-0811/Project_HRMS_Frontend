import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import client from '../../api/client';
import { saveSession } from '../../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/login', {
        username: form.username,
        password: form.password,
      });
      saveSession({
        token:        data.accessToken,
        refreshToken: data.refreshToken,
        empId:        data.empId,
        username:     data.username,
        role:         data.role,
      });
      navigate('/main/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-primary-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background geometry */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent-500 rounded-full translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-300 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <span className="text-white font-display font-bold text-base">H</span>
            </div>
            <span className="text-white font-display font-bold text-xl">HRMS</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            People ops,<br />
            <span className="text-primary-300">simplified.</span>
          </h1>
          <p className="text-primary-200 text-base leading-relaxed max-w-sm">
            Attendance, leaves, payslips, and documents — everything your team needs, in one place.
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
          {[['98%', 'Uptime'], ['< 2s', 'Load time'], ['256-bit', 'Encryption']].map(([val, lbl]) => (
            <div key={lbl}>
              <p className="text-white font-display font-bold text-xl">{val}</p>
              <p className="text-primary-300 text-xs">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="text-white font-display font-bold">H</span>
            </div>
            <span className="font-display font-bold text-surface-900 text-lg">HRMS</span>
          </div>

          <h2 className="text-2xl font-display font-bold text-surface-900 mb-1">Welcome back</h2>
          <p className="text-surface-500 text-sm mb-8">Sign in to your workspace</p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-6 animate-fade-in">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="input-label">Username</label>
              <input
                className="input"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={show ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-1"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" />
                </svg>
              ) : (
                <LogIn size={15} />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-surface-400 hover:text-primary-600 transition-colors"
            >
              Forgot your password?
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
