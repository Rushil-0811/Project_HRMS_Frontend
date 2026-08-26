// src/pages/auth/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import client from '../../api/client';

const ForgotPassword = () => {
  const navigate     = useNavigate();
  const [email,      setEmail]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email address.');
    setError('');
    setLoading(true);
    try {
      await client.post('/api/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally { setLoading(false); }
  };

  // ── Sent state ─────────────────────────────────────────────────────────────
  if (sent) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="bg-surface-0 rounded-2xl shadow-card-md border border-surface-100 p-10 w-full max-w-sm text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
          <Mail size={30} className="text-primary-500" />
        </div>
        <h2 className="font-display font-bold text-surface-900 text-xl mb-2">Check your inbox</h2>
        <p className="text-surface-500 text-sm mb-2">
          If <span className="font-semibold text-surface-700">{email}</span> is registered, you'll receive a reset link shortly.
        </p>
        <p className="text-surface-400 text-xs mb-8">
          The link expires in 1 hour. Check your spam folder if you don't see it.
        </p>
        <button className="btn-secondary w-full justify-center" onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> Back to Login
        </button>
      </div>
    </div>
  );

  // ── Form ───────────────────────────────────────────────────────────────────
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
          <Mail size={20} className="text-primary-600" />
        </div>

        <h2 className="font-display font-bold text-surface-900 text-xl mb-1">Forgot password?</h2>
        <p className="text-surface-500 text-sm mb-6">
          Enter your work email and we'll send you a reset link.
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-5">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="input-label">Work Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              autoFocus
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-1">
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" />
              </svg>
            ) : <Mail size={15} />}
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-1.5 w-full mt-4 text-sm text-surface-500 hover:text-surface-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;