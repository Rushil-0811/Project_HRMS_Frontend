// src/pages/auth/SetPassword.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import client from '../../api/client';

const rules = [
  { label: 'At least 8 characters',       test: p => p.length >= 8            },
  { label: 'One uppercase letter',         test: p => /[A-Z]/.test(p)          },
  { label: 'One lowercase letter',         test: p => /[a-z]/.test(p)          },
  { label: 'One number',                   test: p => /[0-9]/.test(p)          },
  { label: 'One special character',        test: p => /[^A-Za-z0-9]/.test(p)  },
];

const StrengthBar = ({ password }) => {
  const passed = rules.filter(r => r.test(password)).length;
  const pct    = (passed / rules.length) * 100;
  const color  = pct <= 40 ? 'bg-red-400' : pct <= 70 ? 'bg-amber-400' : 'bg-green-500';
  const label  = pct <= 40 ? 'Weak' : pct <= 70 ? 'Fair' : pct <= 90 ? 'Good' : 'Strong';
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="w-full bg-surface-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-xs mt-1 font-medium ${pct <= 40 ? 'text-red-500' : pct <= 70 ? 'text-amber-500' : 'text-green-600'}`}>
        {label}
      </p>
    </div>
  );
};

const SetPassword = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token');
  const isReset    = params.get('mode') === 'reset';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!token) setError('Invalid or missing link. Please request a new one.');
  }, [token]);

  const allRulesPassed = rules.every(r => r.test(password));
  const matches        = password === confirm;
  const canSubmit      = allRulesPassed && matches && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const endpoint = isReset ? '/api/auth/reset-password' : '/api/auth/set-password';
      await client.post(endpoint, { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. The link may have expired.');
    } finally { setLoading(false); }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="bg-surface-0 rounded-2xl shadow-card-md border border-surface-100 p-10 w-full max-w-sm text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="font-display font-bold text-surface-900 text-xl mb-2">
          {isReset ? 'Password reset!' : 'Password set!'}
        </h2>
        <p className="text-surface-500 text-sm mb-6">
          You can now log in with your new password.
        </p>
        <button className="btn-primary w-full justify-center" onClick={() => navigate('/')}>
          Go to Login
        </button>
      </div>
    </div>
  );

  // ── Invalid token state ────────────────────────────────────────────────────
  if (!token) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="bg-surface-0 rounded-2xl shadow-card-md border border-surface-100 p-10 w-full max-w-sm text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="font-display font-bold text-surface-900 text-xl mb-2">Invalid Link</h2>
        <p className="text-surface-500 text-sm mb-6">
          This link is invalid or has expired. Request a new one from your HR team.
        </p>
        <button className="btn-secondary w-full justify-center" onClick={() => navigate('/')}>
          Back to Login
        </button>
      </div>
    </div>
  );

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="bg-surface-0 rounded-2xl shadow-card-md border border-surface-100 p-8 w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">H</span>
          </div>
          <span className="font-display font-bold text-surface-900">HRMS</span>
        </div>

        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
          <Lock size={20} className="text-primary-600" />
        </div>

        <h2 className="font-display font-bold text-surface-900 text-xl mb-1">
          {isReset ? 'Reset your password' : 'Set your password'}
        </h2>
        <p className="text-surface-500 text-sm mb-6">
          {isReset
            ? 'Choose a strong new password for your account.'
            : 'Welcome! Create a password to activate your account.'
          }
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-5 animate-fade-in">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Password */}
          <div>
            <label className="input-label">New Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <StrengthBar password={password} />
          </div>

          {/* Password rules */}
          {password.length > 0 && (
            <div className="bg-surface-50 rounded-xl p-3 space-y-1.5">
              {rules.map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    r.test(password) ? 'bg-green-100' : 'bg-surface-200'
                  }`}>
                    {r.test(password)
                      ? <CheckCircle size={11} className="text-green-600" />
                      : <div className="w-1.5 h-1.5 rounded-full bg-surface-400" />
                    }
                  </div>
                  <span className={`text-xs transition-colors ${r.test(password) ? 'text-green-700' : 'text-surface-500'}`}>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm */}
          <div>
            <label className="input-label">Confirm Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showCf ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
              />
              <button type="button" onClick={() => setShowCf(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirm.length > 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${matches ? 'text-green-600' : 'text-danger'}`}>
                {matches
                  ? <><CheckCircle size={11} /> Passwords match</>
                  : <><AlertCircle size={11} /> Passwords don't match</>
                }
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="btn-primary w-full justify-center py-2.5 mt-1"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" />
              </svg>
            ) : <Lock size={15} />}
            {loading ? 'Setting password…' : (isReset ? 'Reset Password' : 'Set Password & Activate')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;