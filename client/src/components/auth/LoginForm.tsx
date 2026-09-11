import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import './LoginForm.css';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
      setAuth(data.user, data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password123');
    setError('');
    setIsSubmitting(true);

    try {
      const data = await login(presetEmail, 'password123');
      setAuth(data.user, data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow" />
      <div className="login-container animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1>ProjectHub</h1>
          </div>
          <p className="login-subtitle">Agency Project Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error animate-slide-down">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="label" htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={isSubmitting}>
            {isSubmitting ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <LogIn size={18} />}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-login">
          <p className="quick-login-title">Quick Login (Demo)</p>
          <div className="quick-login-grid">
            <button onClick={() => quickLogin('admin@agency.com')} className="quick-login-btn admin-btn">
              <span className="quick-role">Admin</span>
              <span className="quick-name">Arjun Mehta</span>
            </button>
            <button onClick={() => quickLogin('priya@agency.com')} className="quick-login-btn pm-btn">
              <span className="quick-role">PM</span>
              <span className="quick-name">Priya Sharma</span>
            </button>
            <button onClick={() => quickLogin('rahul@agency.com')} className="quick-login-btn pm-btn">
              <span className="quick-role">PM</span>
              <span className="quick-name">Rahul Gupta</span>
            </button>
            <button onClick={() => quickLogin('ravi@agency.com')} className="quick-login-btn dev-btn">
              <span className="quick-role">Dev</span>
              <span className="quick-name">Ravi Kumar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
