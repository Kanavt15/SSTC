import { useAuth } from '../context/AuthContext';
import { FiMail, FiMapPin, FiCalendar, FiLinkedin, FiGithub, FiEdit2 } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();

  const getDeptChipClass = (dept) => `chip chip-dept-${(dept || 'comps').toLowerCase()}`;

  return (
    <div className="page-wrapper" id="profile-page">
      <div className="container">
        <div className="profile-layout">
          {/* Profile Card */}
          <div className="profile-card card animate-fade-in">
            <div className="profile-banner">
              <div className="profile-banner-art" />
            </div>
            <div className="profile-info">
              <div className="avatar avatar-xl profile-avatar">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <h2 className="profile-name">{user?.first_name} {user?.last_name}</h2>
              <div className="profile-tags">
                <span className={getDeptChipClass(user?.department)}>{user?.department}</span>
                <span className="chip chip-outline">{user?.role}</span>
                {user?.year_of_study && user.year_of_study !== 'NA' && (
                  <span className="chip chip-outline">{user?.year_of_study}</span>
                )}
              </div>
              {user?.bio && <p className="profile-bio">{user.bio}</p>}
              <div className="profile-details">
                <div className="profile-detail">
                  <FiMail /> <span>{user?.email}</span>
                </div>
                <div className="profile-detail">
                  <FiMapPin /> <span>K.J. Somaiya Institute of Technology, Mumbai</span>
                </div>
                <div className="profile-detail">
                  <FiCalendar /> <span>Joined {new Date(user?.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="profile-links">
                {user?.linkedin_url && (
                  <a href={user.linkedin_url} className="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
                    <FiLinkedin /> LinkedIn
                  </a>
                )}
                {user?.github_url && (
                  <a href={user.github_url} className="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
                    <FiGithub /> GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="profile-stats animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="profile-stat-card card">
              <span className="profile-stat-value">12</span>
              <span className="profile-stat-label">Notes Shared</span>
            </div>
            <div className="profile-stat-card card">
              <span className="profile-stat-value">45</span>
              <span className="profile-stat-label">Connections</span>
            </div>
            <div className="profile-stat-card card">
              <span className="profile-stat-value">128</span>
              <span className="profile-stat-label">Downloads</span>
            </div>
            <div className="profile-stat-card card">
              <span className="profile-stat-value">4.8</span>
              <span className="profile-stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
