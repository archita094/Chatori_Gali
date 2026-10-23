import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { Calendar, RefreshCw, ShoppingBag, CreditCard, ChevronRight, User, Compass } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await api.get('/reservations/my-bookings');
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setErrorMsg('Failed to load your reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const getPrepStatusBadgeClass = (status) => {
    switch (status) {
      case 'ready':
        return 'badge-success';
      case 'in-prep':
        return 'badge-warning';
      case 'not-started':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getPrepStatusLabel = (status) => {
    switch (status) {
      case 'ready':
        return 'Ready for Table';
      case 'in-prep':
        return 'Cooking in Kitchen';
      case 'not-started':
        return 'Queued (Not Started)';
      default:
        return 'No Pre-Order';
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Welcome back, {user?.name}</h1>
          <p style={styles.subtitle}>Track your upcoming reservations and kitchen pre-order status</p>
        </div>
        <button onClick={fetchReservations} style={styles.refreshBtn} title="Refresh Bookings">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Status
        </button>
      </div>

      {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

      {loading ? (
        <div style={styles.loadingWrapper}>Loading your dining plans...</div>
      ) : reservations.length === 0 ? (
        <div style={styles.emptyCard} className="glass-card">
          <Compass size={48} color="var(--primary)" />
          <h3>No Reservations Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '350px' }}>
            It looks like you haven't reserved a table yet. Browse our menu and lock in a dining spot.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Book a Table Now
          </button>
        </div>
      ) : (
        <div style={styles.reservationsList}>
          {reservations.map((res) => (
            <div key={res._id} style={styles.resCard} className="glass-card">
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={styles.iconCircle}>
                    <Calendar size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>
                      {res.restaurant?.name || 'Chatori Gali'}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', margin: '0.2rem 0' }}>
                      {res.date} @ {res.timeSlot}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Table {res.tableNumber} • {res.guestsCount} Guests {res.restaurant?.cuisine ? `• ${res.restaurant.cuisine}` : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <span className={`badge ${getPrepStatusBadgeClass(res.prepStatus)}`}>
                    {getPrepStatusLabel(res.prepStatus)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Payment ID: {res.paymentDetails?.transactionId}
                  </span>
                </div>
              </div>

              <div style={styles.cardBody}>
                {res.menuItems.length > 0 ? (
                  <div style={styles.orderDetails}>
                    <h4 style={styles.sectionHeader}>
                      <ShoppingBag size={14} color="var(--primary)" /> Pre-Ordered Dishes
                    </h4>
                    <div style={styles.foodList}>
                      {res.menuItems.map((itemObj) => (
                        <div key={itemObj._id} style={styles.foodItem}>
                          <span>
                            {itemObj.quantity}x {itemObj.menuItem?.name || 'Deleted Dish'}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            ₹{(itemObj.priceAtBooking * itemObj.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No dishes pre-ordered for this visit.
                  </p>
                )}

                <div style={styles.billingSummary}>
                  <h4 style={styles.sectionHeader}>
                    <CreditCard size={14} color="var(--primary)" /> Billing & Deposit
                  </h4>
                  <div style={styles.billDetails}>
                    <div style={styles.billRow}>
                      <span>Total Pre-Ordered Food Value:</span>
                      <span>₹{res.totalFoodAmount?.toFixed(2)}</span>
                    </div>
                    <div style={styles.billRow}>
                      <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>60% Advance Paid (Confirmed):</span>
                      <strong style={{ color: 'var(--color-success)' }}>₹{res.advanceAmount?.toFixed(2)}</strong>
                    </div>
                    <div style={styles.billRow}>
                      <span>Balance Due at Table:</span>
                      <strong>₹{(res.totalFoodAmount - res.advanceAmount).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    paddingBottom: '4rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-danger)',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
  },
  loadingWrapper: {
    textAlign: 'center',
    padding: '4rem 0',
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '4rem 2rem',
    gap: '1rem',
  },
  reservationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  resCard: {
    padding: '2rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  iconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--primary-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
  },
  cardBody: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2.5rem',
    marginTop: '1.5rem',
  },
  orderDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionHeader: {
    fontSize: '0.95rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginBottom: '0.5rem',
  },
  foodList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    background: 'rgba(0, 0, 0, 0.15)',
    padding: '1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
  },
  foodItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  billingSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  billDetails: {
    background: 'rgba(0, 0, 0, 0.15)',
    padding: '1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  billRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
};

export default CustomerDashboard;
