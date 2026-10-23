import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Compass, Calendar, User, LogOut, Utensils, ChefHat, LayoutDashboard, LogIn, Sparkles } from 'lucide-react';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={isHome ? styles.headerFloating : styles.headerStandard}>
      <nav style={isHome ? styles.navContainerPill : styles.navContainerStandard}>
        {/* Left Links */}
        <div style={styles.leftNavLinks}>
          <a href="#restaurants" style={styles.link}>Heritage Tables</a>
          <a href="#curated-menu" style={styles.link}>Chef's Tasting</a>
          
          {user && user.role === 'customer' && (
            <Link to="/dietary-assistant" style={styles.link}>
              <Sparkles size={14} color="#ffd700" /> AI Dietary
            </Link>
          )}

          {user && (user.role === 'admin' || user.role === 'staff') && (
            <Link to="/kitchen" style={styles.link}>
              <ChefHat size={15} /> Kitchen
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin" style={styles.link}>
              <LayoutDashboard size={15} /> Admin
            </Link>
          )}
        </div>

        {/* Center Brand Identity */}
        <Link to="/" style={styles.logo}>
          <div style={styles.logoBadge}>
            <Compass size={18} color="#ffd700" />
          </div>
          <span style={styles.logoText}>
            CHATORI <span style={{ color: '#ffd700', fontStyle: 'italic' }}>GALI</span>
          </span>
        </Link>

        {/* Right Actions */}
        <div style={styles.authSection}>
          <button
            type="button"
            onClick={() => {
              const trigger = document.getElementById('ai-concierge-trigger');
              if (trigger) trigger.click();
            }}
            style={styles.aiConciergeBtn}
            title="Open AI Dining Concierge"
          >
            <Sparkles size={14} color="#ffd700" />
            <span style={styles.aiBtnText}>AI Concierge</span>
          </button>

          {user ? (
            <div style={styles.userInfo}>
              <Link to="/my-bookings" style={styles.myBookingsLink} title="My Table Reservations">
                <Utensils size={14} />
                <span style={styles.bookingsText}>Bookings</span>
              </Link>
              <div style={styles.userBadge}>
                <User size={13} color="#ffd700" />
                <span style={styles.userNameText}>{user.name}</span>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <Link to="/login" style={styles.loginBtn}>
                <LogIn size={14} /> Sign In
              </Link>
              <Link to="/register" style={styles.registerBtn}>
                Reserve Table
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

const styles = {
  /* Floating Header for Home Page (Floating pill island over hero photo) */
  headerFloating: {
    position: 'fixed',
    top: '1.25rem',
    left: 0,
    right: 0,
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 1.5rem',
    pointerEvents: 'none',
  },
  navContainerPill: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: '1360px',
    background: 'rgba(16, 28, 44, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '9999px',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.12)',
    border: '1.5px solid rgba(255, 215, 0, 0.28)',
    padding: '0.65rem 1.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    transition: 'all var(--transition-normal)',
  },

  /* Standard Sticky Header for internal pages */
  headerStandard: {
    position: 'sticky',
    top: 0,
    width: '100%',
    zIndex: 1000,
    background: 'rgba(16, 28, 44, 0.96)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1.5px solid rgba(255, 215, 0, 0.2)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  navContainerStandard: {
    maxWidth: '1360px',
    margin: '0 auto',
    padding: '0.8rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    textDecoration: 'none',
  },
  logoBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(255, 215, 0, 0.12)',
    border: '1px solid rgba(255, 215, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 10px rgba(255, 215, 0, 0.2)',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.25rem',
    letterSpacing: '0.04em',
    color: '#ffffff',
  },
  leftNavLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.35rem',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#e2e8f0',
    transition: 'color var(--transition-fast)',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  aiConciergeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(245, 158, 11, 0.22) 100%)',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    padding: '0.45rem 0.95rem',
    borderRadius: 'var(--radius-full)',
    color: '#ffd700',
    fontWeight: '700',
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
    boxShadow: '0 0 12px rgba(255, 215, 0, 0.18)',
  },
  aiBtnText: {
    display: 'inline',
  },
  authSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  myBookingsLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.84rem',
    fontWeight: '600',
    color: '#f8fafc',
    padding: '0.35rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  bookingsText: {
    display: 'inline',
  },
  userBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    background: 'rgba(255, 215, 0, 0.15)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    padding: '0.35rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.84rem',
    fontWeight: '600',
    color: '#ffd700',
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userNameText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'color var(--transition-fast)',
    padding: '0.3rem',
  },
  loginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.45rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#f8fafc',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.35)',
    transition: 'all var(--transition-fast)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  registerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#142232',
    background: 'linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)',
    border: '1px solid #ffd700',
    borderRadius: 'var(--radius-full)',
    transition: 'all var(--transition-fast)',
    boxShadow: '0 4px 14px rgba(255, 215, 0, 0.3)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
};

export default NavBar;
export { styles as navStyles };

