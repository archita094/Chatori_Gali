import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ChefHat, Clock, CheckCircle, RefreshCw, AlertTriangle, Play, HelpCircle } from 'lucide-react';

const KitchenPrep = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'stock'
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [togglingMenuId, setTogglingMenuId] = useState(null);

  const fetchKitchenOrders = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await api.get(`/reservations/all?date=${date}`);
      // Filter out bookings that don't have any pre-ordered menu items
      const preOrdersOnly = data.filter((res) => res.menuItems && res.menuItems.length > 0 && res.status !== 'cancelled');
      setOrders(preOrdersOnly);
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
      setErrorMsg('Failed to load kitchen preparation tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
  }, [date]);

  const fetchMenuItems = async () => {
    if (!user || !user.restaurant) return;
    const restaurantId = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    setLoadingMenu(true);
    try {
      const { data } = await api.get(`/menu?restaurantId=${restaurantId}`);
      setMenuItems(data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setErrorMsg('Failed to load menu items.');
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock' && user) {
      fetchMenuItems();
    }
  }, [activeTab, user]);

  const handleToggleAvailability = async (item) => {
    setTogglingMenuId(item._id);
    try {
      const nextAvailable = !item.isAvailable;
      const { data } = await api.put(`/menu/${item._id}`, { isAvailable: nextAvailable });
      setMenuItems((prevItems) =>
        prevItems.map((i) => (i._id === item._id ? data : i))
      );
    } catch (err) {
      console.error('Error toggling availability:', err);
      setErrorMsg('Failed to update dish availability.');
    } finally {
      setTogglingMenuId(null);
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'not-started') {
      nextStatus = 'in-prep';
    } else if (currentStatus === 'in-prep') {
      nextStatus = 'ready';
    } else {
      return; // Already ready
    }

    setUpdatingId(id);
    try {
      await api.put(`/reservations/${id}/prep`, { prepStatus: nextStatus });
      // Update local state instead of full refetch
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === id ? { ...order, prepStatus: nextStatus } : order
        )
      );
    } catch (err) {
      console.error('Failed to update prep status:', err);
      setErrorMsg('Could not update preparation status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getUrgencyStatus = (timeSlot) => {
    // Basic urgency check: if arrival slot is near
    const currentHour = new Date().getHours();
    const [slotHour] = timeSlot.split(':').map(Number);
    
    // If today is selected and slot is within 2 hours or passed
    const isToday = date === new Date().toISOString().split('T')[0];
    if (isToday) {
      const diff = slotHour - currentHour;
      if (diff <= 1 && diff >= -1) {
        return 'high';
      } else if (diff <= 3 && diff > 1) {
        return 'medium';
      }
    }
    return 'low';
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Tab Navigation */}
      <div style={styles.tabsContainer}>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'board' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'board' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
          onClick={() => setActiveTab('board')}
        >
          Preparation Board
        </button>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'stock' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'stock' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
          onClick={() => setActiveTab('stock')}
        >
          Menu Stock Control
        </button>
      </div>

      {activeTab === 'board' ? (
        <>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Kitchen Board {user?.restaurant?.name ? `| ${user.restaurant.name}` : ''}</h1>
              <p style={styles.subtitle}>Manage dish pre-orders grouped by guests' arrival times.</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '160px', padding: '0.5rem 0.85rem' }}
              />
              <button onClick={fetchKitchenOrders} style={styles.refreshBtn} title="Refresh Tasks">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

          {loading ? (
            <div style={styles.loadingWrapper}>Loading chef preparation boards...</div>
          ) : orders.length === 0 ? (
            <div style={styles.emptyCard} className="glass-card">
              <ChefHat size={48} color="var(--text-muted)" />
              <h3>No Kitchen Pre-orders Today</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                There are no pre-ordered meals scheduled for preparation on {date}.
              </p>
            </div>
          ) : (
            <div style={styles.boardGrid}>
              {/* Column 1: Not Started */}
              <div style={styles.column}>
                <div style={{ ...styles.columnHeader, borderBottom: '2px solid var(--color-danger)' }}>
                  <span>Not Started ({orders.filter(o => o.prepStatus === 'not-started').length})</span>
                </div>
                <div style={styles.columnContent}>
                  {orders
                    .filter((o) => o.prepStatus === 'not-started')
                    .map((order) => (
                      <KitchenOrderCard
                        key={order._id}
                        order={order}
                        urgency={getUrgencyStatus(order.timeSlot)}
                        onUpdate={() => handleUpdateStatus(order._id, 'not-started')}
                        updating={updatingId === order._id}
                        actionLabel="Start Cooking"
                        actionIcon={<Play size={14} />}
                      />
                    ))}
                </div>
              </div>

              {/* Column 2: In Preparation */}
              <div style={styles.column}>
                <div style={{ ...styles.columnHeader, borderBottom: '2px solid var(--color-warning)' }}>
                  <span>In Preparation ({orders.filter(o => o.prepStatus === 'in-prep').length})</span>
                </div>
                <div style={styles.columnContent}>
                  {orders
                    .filter((o) => o.prepStatus === 'in-prep')
                    .map((order) => (
                      <KitchenOrderCard
                        key={order._id}
                        order={order}
                        urgency={getUrgencyStatus(order.timeSlot)}
                        onUpdate={() => handleUpdateStatus(order._id, 'in-prep')}
                        updating={updatingId === order._id}
                        actionLabel="Mark Ready"
                        actionIcon={<CheckCircle size={14} />}
                        isPrep
                      />
                    ))}
                </div>
              </div>

              {/* Column 3: Ready */}
              <div style={styles.column}>
                <div style={{ ...styles.columnHeader, borderBottom: '2px solid var(--color-success)' }}>
                  <span>Ready for Service ({orders.filter(o => o.prepStatus === 'ready').length})</span>
                </div>
                <div style={styles.columnContent}>
                  {orders
                    .filter((o) => o.prepStatus === 'ready')
                    .map((order) => (
                      <KitchenOrderCard
                        key={order._id}
                        order={order}
                        urgency="low"
                        updating={false}
                        isReady
                      />
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Menu Stock {user?.restaurant?.name ? `| ${user.restaurant.name}` : ''}</h1>
              <p style={styles.subtitle}>Toggle availability of gourmet dishes in real-time based on ingredient stock.</p>
            </div>
            <button onClick={fetchMenuItems} style={styles.refreshBtn} title="Refresh Menu">
              <RefreshCw size={18} />
            </button>
          </div>

          {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

          {loadingMenu ? (
            <div style={styles.loadingWrapper}>Loading menu items...</div>
          ) : (
            <div style={styles.stockCategories}>
              {['appetizers', 'mains', 'desserts', 'beverages'].map((cat) => {
                const catItems = menuItems.filter(item => item.category === cat);
                if (catItems.length === 0) return null;

                return (
                  <div key={cat} style={{ marginBottom: '2.5rem' }}>
                    <h3 style={styles.categoryTitle}>{cat}</h3>
                    <div style={styles.stockGrid}>
                      {catItems.map((item) => (
                        <div key={item._id} style={styles.stockCard} className="glass-card">
                          <div style={styles.stockCardHeader}>
                            <img src={item.imageUrl} alt={item.name} style={styles.stockImg} />
                            <div style={styles.stockInfo}>
                              <h4 style={styles.stockName}>{item.name}</h4>
                              <p style={styles.stockPrice}>₹{item.price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div style={styles.stockCardBody}>
                            <p style={styles.stockDesc}>{item.description}</p>
                          </div>
                          <div style={styles.stockCardFooter}>
                            <span style={{ display: 'inline-flex', alignSelf: 'center' }}>
                              {item.isAvailable ? (
                                <span className="badge badge-success">In Stock</span>
                              ) : (
                                <span className="badge badge-danger">Out of Stock</span>
                              )}
                            </span>
                            <button
                              className={`btn ${item.isAvailable ? 'btn-secondary' : 'btn-primary'}`}
                              style={styles.toggleBtn}
                              onClick={() => handleToggleAvailability(item)}
                              disabled={togglingMenuId === item._id}
                            >
                              {togglingMenuId === item._id ? 'Updating...' : item.isAvailable ? 'Mark Out of Stock' : 'Mark In Stock'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Sub-component for individual card item
const KitchenOrderCard = ({ order, urgency, onUpdate, updating, actionLabel, actionIcon, isPrep, isReady }) => {
  let cardBorder = '1px solid var(--border-color)';
  let cardBg = 'var(--glass-bg)';
  let urgencyIndicator = null;

  if (!isReady && urgency === 'high') {
    cardBorder = '1px solid var(--color-danger)';
    cardBg = 'rgba(239, 68, 68, 0.03)';
    urgencyIndicator = (
      <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
        <AlertTriangle size={12} /> URGENT ARRIVAL
      </span>
    );
  } else if (!isReady && urgency === 'medium') {
    cardBorder = '1px solid var(--color-warning)';
    cardBg = 'rgba(245, 158, 11, 0.02)';
  }

  return (
    <div style={{ ...styles.card, border: cardBorder, background: cardBg }} className="glass-card animate-slide-up">
      <div style={styles.cardHeader}>
        <div>
          <h4 style={{ fontSize: '1rem', color: '#fff' }}>Table {order.tableNumber}</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Guests: {order.guestsCount} • Name: {order.guestName}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} /> {order.timeSlot}
          </div>
          {urgencyIndicator}
        </div>
      </div>

      <div style={styles.cardBody}>
        {order.menuItems.map((itemObj, index) => {
          const item = itemObj.menuItem;
          const dietaryDetails = [];
          if (item?.dietaryInfo) {
            dietaryDetails.push(item.dietaryInfo.isVeg ? 'Veg' : 'Non-Veg');
            if (item.dietaryInfo.allergens?.length > 0) {
              dietaryDetails.push(`Allergens: ${item.dietaryInfo.allergens.join(', ')}`);
            }
          }
          const infoString = dietaryDetails.length > 0 ? ` (${dietaryDetails.join(' | ')})` : '';

          return (
            <div key={index} style={styles.itemRow}>
              <span style={styles.itemQty}>{itemObj.quantity}x</span>
              <span style={styles.itemName}>
                {item?.name || 'Unknown Dish'}
                {infoString && (
                  <span style={{ fontSize: '0.75rem', color: item.dietaryInfo?.allergens?.length > 0 ? 'var(--color-danger)' : 'var(--primary)', marginLeft: '0.4rem', fontWeight: '500' }}>
                    {infoString}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {!isReady && (
        <div style={styles.cardFooter}>
          <button
            className={`btn ${isPrep ? 'btn-primary' : 'btn-outline'}`}
            style={{ width: '100%', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            onClick={onUpdate}
            disabled={updating}
          >
            {updating ? 'Updating...' : <>{actionIcon} {actionLabel}</>}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingBottom: '4rem',
  },
  tabsContainer: {
    display: 'flex',
    gap: '2rem',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '2rem',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '0.75rem 0.5rem',
    fontSize: '1rem',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  categoryTitle: {
    textTransform: 'capitalize',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
    marginBottom: '1.25rem',
    color: 'var(--primary)',
    fontSize: '1.4rem',
  },
  stockGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  stockCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '1.25rem',
  },
  stockCardHeader: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '0.75rem',
  },
  stockImg: {
    width: '60px',
    height: '60px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    border: '1px solid var(--border-color)',
  },
  stockInfo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.2rem',
  },
  stockName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#fff',
  },
  stockPrice: {
    fontSize: '0.85rem',
    color: 'var(--primary)',
    fontWeight: '700',
  },
  stockCardBody: {
    flex: '1',
    marginBottom: '1rem',
  },
  stockDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  stockCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '0.75rem',
    marginTop: 'auto',
  },
  toggleBtn: {
    padding: '0.4rem 0.85rem',
    fontSize: '0.75rem',
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
    fontSize: '2.25rem',
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  refreshBtn: {
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all var(--transition-fast)',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.12)',
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
  boardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    alignItems: 'start',
  },
  column: {
    background: 'rgba(0, 0, 0, 0.12)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minHeight: '550px',
  },
  columnHeader: {
    paddingBottom: '0.75rem',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#fff',
  },
  columnContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    padding: '1.25rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px dashed var(--border-color)',
    paddingBottom: '0.75rem',
    marginBottom: '0.75rem',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    marginBottom: '1rem',
  },
  itemRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  itemQty: {
    color: 'var(--primary)',
    fontWeight: '700',
    fontSize: '0.9rem',
    minWidth: '22px',
  },
  itemName: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  cardFooter: {
    marginTop: 'auto',
  },
};

export default KitchenPrep;
export { KitchenOrderCard, styles as kitchenStyles };
