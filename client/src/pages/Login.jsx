import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="login-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">
            <div className="brand-icon-lg">K</div>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to access your KJSIT Connect dashboard, notes, and department chat.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">📚</span>
              <span>Access shared notes & PYQs</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">💬</span>
              <span>Connect with your department</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🤖</span>
              <span>AI-powered study assistant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>Sign In</h2>
            <p>Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="auth-error animate-scale-in">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="your.email@somaiya.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <span className="btn-loader" />
              ) : (
                <>Sign In <FiArrowRight /></>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Create Account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
