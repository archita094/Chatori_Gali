import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { UserPlus, Mail, Lock, User, Briefcase, ChevronDown, Check } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Restaurant fields for non-customers
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [registerNewRestaurant, setRegisterNewRestaurant] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantCuisine, setNewRestaurantCuisine] = useState('');
  const [newRestaurantAddress, setNewRestaurantAddress] = useState('');
  const [newRestaurantDesc, setNewRestaurantDesc] = useState('');
  const [newRestaurantImageUrl, setNewRestaurantImageUrl] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurantsList = async () => {
      try {
        const { data } = await api.get('/restaurants');
        setRestaurants(data);
        if (data.length > 0) {
          setSelectedRestaurantId(data[0]._id);
        }
      } catch (err) {
        console.error('Error loading restaurants list:', err);
      }
    };
    fetchRestaurantsList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const additionalData = {};
    if (role === 'admin' || role === 'staff') {
      if (role === 'admin' && registerNewRestaurant) {
        if (!newRestaurantName || !newRestaurantCuisine || !newRestaurantAddress) {
          setErrorMsg('Please enter all required restaurant details.');
          return;
        }
        additionalData.restaurantData = {
          name: newRestaurantName,
          cuisine: newRestaurantCuisine,
          address: newRestaurantAddress,
          description: newRestaurantDesc || `${newRestaurantName} fine dining experience`,
          imageUrl: newRestaurantImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
        };
      } else {
        if (!selectedRestaurantId) {
          setErrorMsg('Please select a restaurant to join.');
          return;
        }
        additionalData.restaurantId = selectedRestaurantId;
      }
    }

    const res = await register(name, email, password, role, additionalData);
    if (res.success) {
      navigate('/');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={{ ...styles.card, maxWidth: (role === 'admin' && registerNewRestaurant) ? '650px' : '420px' }} className="glass-card">
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <UserPlus size={24} color="var(--primary)" />
          </div>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join us to start booking seats and dishes</p>
        </div>

        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            
            {/* User basic details */}
            <div style={{ flex: '1', minWidth: '250px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <div style={styles.inputWrapper}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role">Account Type</label>
                <div style={styles.inputWrapper}>
                  <Briefcase size={16} style={styles.inputIcon} />
                  <select
                    id="role"
                    className="form-control"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setErrorMsg('');
                    }}
                    style={{ paddingLeft: '2.5rem', background: '#14161d', color: '#fff' }}
                  >
                    <option value="customer">Customer (Dine In & Pre-Order)</option>
                    <option value="staff">Kitchen Staff (Food Preparation)</option>
                    <option value="admin">Administrator (Dashboard & Analytics)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Restaurant specific choices */}
            {(role === 'admin' || role === 'staff') && (
              <div style={{ flex: '1', minWidth: '250px', borderLeft: (role === 'admin' && registerNewRestaurant) ? '1px dashed var(--border-color)' : 'none', paddingLeft: (role === 'admin' && registerNewRestaurant) ? '1.5rem' : '0' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1rem' }}>Restaurant Association</h3>

                {role === 'admin' && (
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <input
                      type="checkbox"
                      id="newRestCheckbox"
                      checked={registerNewRestaurant}
                      onChange={(e) => setRegisterNewRestaurant(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="newRestCheckbox" className="form-label" style={{ margin: 0, cursor: 'pointer', color: '#fff', fontWeight: '600' }}>
                      Register a New Restaurant
                    </label>
                  </div>
                )}

                {(!registerNewRestaurant || role === 'staff') ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="restaurantSelect">Select Restaurant to Join</label>
                    <select
                      id="restaurantSelect"
                      className="form-control"
                      value={selectedRestaurantId}
                      onChange={(e) => setSelectedRestaurantId(e.target.value)}
                      style={{ background: '#14161d', color: '#fff' }}
                    >
                      {restaurants.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name} ({r.cuisine})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Restaurant Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Bella Italia"
                        value={newRestaurantName}
                        onChange={(e) => setNewRestaurantName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Cuisine Type *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Italian Fine Dining"
                        value={newRestaurantCuisine}
                        onChange={(e) => setNewRestaurantCuisine(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Street Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 123 Pasta Street"
                        value={newRestaurantAddress}
                        onChange={(e) => setNewRestaurantAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Brief summary..."
                        value={newRestaurantDesc}
                        onChange={(e) => setNewRestaurantDesc(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Image URL</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://..."
                        value={newRestaurantImageUrl}
                        onChange={(e) => setNewRestaurantImageUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
            Register
          </button>
        </form>

        <div style={styles.footer}>
          <span>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    minHeight: 'calc(100vh - 120px)',
  },
  card: {
    width: '100%',
    padding: '2.5rem 2rem',
    transition: 'max-width var(--transition-normal)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  iconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--primary-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  formGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-danger)',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
};

export default Register;
