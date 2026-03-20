import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiArrowRight } from 'react-icons/fi';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '',
    role: 'student', department: 'COMPS', year_of_study: 'FE'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setFormData({ ...formData, [field]: value });

  return (
    <div className="auth-page" id="register-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">
            <div className="brand-icon-lg">K</div>
          </div>
          <h1>Join KJSIT Connect</h1>
          <p>Create your account and become part of the KJSIT student community.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">🎓</span>
              <span>Student, Faculty & Alumni</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🔗</span>
              <span>Connect across departments</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">📖</span>
              <span>Share & access study materials</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>Create Account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {error && (
            <div className="auth-error animate-scale-in">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="register-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="reg-fname">First Name</label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input id="reg-fname" type="text" className="input-field" placeholder="First name"
                    value={formData.first_name} onChange={(e) => update('first_name', e.target.value)} required />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="reg-lname">Last Name</label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input id="reg-lname" type="text" className="input-field" placeholder="Last name"
                    value={formData.last_name} onChange={(e) => update('last_name', e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input id="reg-email" type="email" className="input-field" placeholder="your.email@somaiya.edu"
                  value={formData.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} className="input-field"
                  placeholder="Min. 6 characters" value={formData.password}
                  onChange={(e) => update('password', e.target.value)} required minLength={6} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="reg-role">I am a</label>
                <select id="reg-role" className="select-field" value={formData.role}
                  onChange={(e) => update('role', e.target.value)}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="reg-dept">Department</label>
                <select id="reg-dept" className="select-field" value={formData.department}
                  onChange={(e) => update('department', e.target.value)}>
                  <option value="AIDS">AI & Data Science</option>
                  <option value="COMPS">Computer Science</option>
                  <option value="IT">Information Technology</option>
                  <option value="EXTC">EXTC</option>
                </select>
              </div>
            </div>

            {formData.role === 'student' && (
              <div className="input-group">
                <label htmlFor="reg-year">Year of Study</label>
                <select id="reg-year" className="select-field" value={formData.year_of_study}
                  onChange={(e) => update('year_of_study', e.target.value)}>
                  <option value="FE">First Year (FE)</option>
                  <option value="SE">Second Year (SE)</option>
                  <option value="TE">Third Year (TE)</option>
                  <option value="BE">Fourth Year (BE)</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="register-submit">
              {loading ? <span className="btn-loader" /> : <>Create Account <FiArrowRight /></>}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
