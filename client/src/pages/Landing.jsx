import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiBookOpen, FiMessageSquare, FiCpu, FiFileText, FiAward, FiArrowRight, FiChevronDown } from 'react-icons/fi';
import './Landing.css';

const Landing = () => {
  const featuresRef = useRef(null);

  useEffect(() => {
    // Particle animation
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = 700;

    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 180, 171, ${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255, 180, 171, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 700;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const features = [
    { icon: <FiUsers />, title: 'Faculty Connect', desc: 'Connect directly with professors and mentors for guidance and academic support.' },
    { icon: <FiAward />, title: 'Alumni Network', desc: 'Build connections with alumni for career advice, internships, and industry insights.' },
    { icon: <FiBookOpen />, title: 'Notes Sharing', desc: 'Share and access study materials, lecture notes, and reference documents.' },
    { icon: <FiMessageSquare />, title: 'Department Chat', desc: 'Real-time chat rooms for AIDS, COMPS, IT, and EXTC departments.' },
    { icon: <FiCpu />, title: 'AI Study Bot', desc: 'AI-powered chatbot to summarize notes, generate quizzes, and explain concepts.' },
    { icon: <FiFileText />, title: 'Previous Year Papers', desc: 'Access previous year question papers organized by subject and semester.' },
  ];

  const departments = [
    { code: 'AIDS', name: 'AI & Data Science', desc: 'Artificial Intelligence, Machine Learning, Data Analytics', color: '#0369a1', bg: '#e0f2fe', members: '240+' },
    { code: 'COMPS', name: 'Computer Science', desc: 'Software Development, Algorithms, System Design', color: '#be185d', bg: '#fce7f3', members: '300+' },
    { code: 'IT', name: 'Information Technology', desc: 'Web Technologies, Cloud Computing, Cybersecurity', color: '#047857', bg: '#ecfdf5', members: '260+' },
    { code: 'EXTC', name: 'Electronics & Telecom', desc: 'Signal Processing, IoT, Communication Systems', color: '#92400e', bg: '#fef3c7', members: '200+' },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <canvas id="hero-canvas" className="hero-canvas" />
        <div className="hero-overlay" />
        <div className="hero-content container">
          <div className="hero-badge animate-fade-in">
            <span className="badge-dot" />
            K.J. Somaiya Institute of Technology
          </div>
          <h1 className="hero-title animate-fade-in" style={{ animationDelay: '100ms' }}>
            Connect. Learn.<br />
            <span className="hero-accent">Grow Together.</span>
          </h1>
          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '200ms' }}>
            The unified platform for KJSIT students, faculty, and alumni to collaborate,
            share knowledge, and build meaningful connections across departments.
          </p>
          <div className="hero-actions animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Join Now <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg" style={{ borderColor: '#fff', color: '#fff' }}>
              Sign In
            </Link>
          </div>
          <div className="hero-stats animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="stat-item">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">80+</span>
              <span className="stat-label">Faculty</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Notes Shared</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">4</span>
              <span className="stat-label">Departments</span>
            </div>
          </div>
        </div>
        <button
          className="scroll-indicator"
          onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="Scroll down"
        >
          <FiChevronDown />
        </button>
      </section>

      {/* Features Section */}
      <section className="section" ref={featuresRef} id="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2>Everything You Need in <span style={{ color: 'var(--primary)' }}>One Place</span></h2>
            <p className="section-desc">
              From notes sharing to real-time department chat, we've built the ultimate student companion.
            </p>
          </div>
          <div className="grid-3 stagger" id="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card card animate-fade-in">
                <div className="feature-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="section section-alt" id="departments-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Departments</span>
            <h2>Four Branches, <span style={{ color: 'var(--primary)' }}>One Community</span></h2>
            <p className="section-desc">
              Join your department community, connect with peers, and access branch-specific resources.
            </p>
          </div>
          <div className="grid-4 stagger" id="departments-grid">
            {departments.map((d, i) => (
              <div key={i} className="dept-card card animate-fade-in" style={{ '--dept-color': d.color, '--dept-bg': d.bg }}>
                <div className="dept-badge" style={{ background: d.bg, color: d.color }}>{d.code}</div>
                <h4>{d.name}</h4>
                <p>{d.desc}</p>
                <div className="dept-members">
                  <span className="member-count">{d.members}</span>
                  <span className="member-label">Members</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to Connect with Your Campus?</h2>
            <p>Join thousands of KJSIT students already using the platform to learn, share, and grow.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Account <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="navbar-brand" style={{ marginBottom: '1rem' }}>
                <div className="brand-icon">K</div>
                <div className="brand-text">
                  <span className="brand-name" style={{ color: 'white' }}>KJSIT Connect</span>
                  <span className="brand-sub" style={{ color: 'rgba(255,255,255,0.5)' }}>Student Portal</span>
                </div>
              </div>
              <p className="footer-desc">
                K.J. Somaiya Institute of Technology's unified student platform for academic excellence and community building.
              </p>
            </div>
            <div className="footer-links-group">
              <h5>Platform</h5>
              <ul>
                <li><Link to="/notes">Notes Sharing</Link></li>
                <li><Link to="/chat">Department Chat</Link></li>
                <li><Link to="/connect">Connect</Link></li>
              </ul>
            </div>
            <div className="footer-links-group">
              <h5>Departments</h5>
              <ul>
                <li><span>AI & Data Science</span></li>
                <li><span>Computer Science</span></li>
                <li><span>Information Technology</span></li>
                <li><span>EXTC</span></li>
              </ul>
            </div>
            <div className="footer-links-group">
              <h5>Contact</h5>
              <ul>
                <li><span>K.J. Somaiya Institute of Technology</span></li>
                <li><span>Vidyanagar, Vidyavihar East</span></li>
                <li><span>Mumbai - 400077</span></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 KJSIT Connect. All rights reserved.</p>
            <p>Made with ❤️ by KJSIT Students</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
