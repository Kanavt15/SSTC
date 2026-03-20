import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiLogOut, FiUser, FiBookOpen, FiMessageSquare, FiUsers, FiHome } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = user ? [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/connect', label: 'Connect', icon: <FiUsers /> },
    { path: '/notes', label: 'Notes', icon: <FiBookOpen /> },
    { path: '/chat', label: 'Chat', icon: <FiMessageSquare /> },
  ] : [
    { path: '/', label: 'Home', icon: <FiHome /> },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} id="main-navbar">
      <div className="navbar-container">
        <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
          <div className="brand-icon">K</div>
          <div className="brand-text">
            <span className="brand-name">KJSIT Connect</span>
            <span className="brand-sub">Student Portal</span>
          </div>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-avatar-btn">
                <div className="avatar avatar-nav">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <span className="user-name">{user.first_name}</span>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
                <FiLogOut />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
