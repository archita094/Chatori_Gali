import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LayoutDashboard, Users, Calendar, DollarSign, IndianRupee, ChefHat, RefreshCw, BarChart2, CheckCircle2, Clock, Plus, Edit2, Trash2, X } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservations, setReservations] = useState([]);
  const [busyHours, setBusyHours] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'menu', 'tables'
  
  // Menu Management State
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('all');
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [menuFormMode, setMenuFormMode] = useState('add'); // 'add' or 'edit'
  const [menuFormId, setMenuFormId] = useState(null);
  const [menuFormName, setMenuFormName] = useState('');
  const [menuFormDescription, setMenuFormDescription] = useState('');
  const [menuFormPrice, setMenuFormPrice] = useState(10);
  const [menuFormCategory, setMenuFormCategory] = useState('mains');
  const [menuFormImageUrl, setMenuFormImageUrl] = useState('');
  const [menuFormAvailable, setMenuFormAvailable] = useState(true);
  const [menuFormIsVeg, setMenuFormIsVeg] = useState(true);
  const [menuFormSpicyLevel, setMenuFormSpicyLevel] = useState(0);
  const [menuFormCalories, setMenuFormCalories] = useState(0);
  const [menuFormProtein, setMenuFormProtein] = useState(0);
  const [menuFormAllergens, setMenuFormAllergens] = useState('');
  const [menuError, setMenuError] = useState('');
  const [menuSuccess, setMenuSuccess] = useState('');

  // Table Management State
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableFormMode, setTableFormMode] = useState('add'); // 'add' or 'edit'
  const [tableFormId, setTableFormId] = useState(null);
  const [tableFormNumber, setTableFormNumber] = useState('');
  const [tableFormCapacity, setTableFormCapacity] = useState('');
  const [tableFormType, setTableFormType] = useState('Center Lounge');
  const [tableFormAvailable, setTableFormAvailable] = useState(true);
  const [tableError, setTableError] = useState('');
  const [tableSuccess, setTableSuccess] = useState('');

  const fetchStats = async () => {
    if (!user || !user.restaurant) return;
    setLoadingStats(true);
    try {
      const { data } = await api.get('/reservations/dashboard-stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchReservationsAndBusyHours = async () => {
    if (!user || !user.restaurant) return;
    const restaurantId = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    setLoadingReservations(true);
    setErrorMsg('');
    try {
      // Fetch bookings list for selected date
      const resRes = await api.get(`/reservations/all?date=${selectedDate}`);
      setReservations(resRes.data);

      // Fetch busy hours for selected date
      const busyRes = await api.get(`/reservations/busy-hours?date=${selectedDate}&restaurantId=${restaurantId}`);
      setBusyHours(busyRes.data);
    } catch (err) {
      console.error('Error fetching reservations data:', err);
      setErrorMsg('Failed to load reservations data for the selected date.');
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReservationsAndBusyHours();
    }
  }, [selectedDate, user]);

  const handleRefresh = () => {
    if (user) {
      fetchStats();
      fetchReservationsAndBusyHours();
    }
  };

  const fetchMenuItems = async () => {
    if (!user || !user.restaurant) return;
    const restaurantId = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    setLoadingMenu(true);
    setMenuError('');
    try {
      const { data } = await api.get(`/menu?restaurantId=${restaurantId}`);
      setMenuItems(data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setMenuError('Failed to load menu items.');
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchTables = async () => {
    if (!user || !user.restaurant) return;
    const restaurantId = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    setLoadingTables(true);
    setTableError('');
    try {
      const { data } = await api.get(`/tables?restaurantId=${restaurantId}`);
      setTables(data.sort((a, b) => a.number - b.number));
    } catch (err) {
      console.error('Error fetching tables:', err);
      setTableError('Failed to load tables.');
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (activeTab === 'menu') {
        fetchMenuItems();
      } else if (activeTab === 'tables') {
        fetchTables();
      }
    }
  }, [activeTab, user]);

  // Open Add/Edit Menu Form
  const openMenuForm = (mode, item = null) => {
    setMenuError('');
    setMenuSuccess('');
    setMenuFormMode(mode);
    if (mode === 'edit' && item) {
      setMenuFormId(item._id);
      setMenuFormName(item.name);
      setMenuFormDescription(item.description);
      setMenuFormPrice(item.price);
      setMenuFormCategory(item.category);
      setMenuFormImageUrl(item.imageUrl);
      setMenuFormAvailable(item.isAvailable);
      setMenuFormIsVeg(item.dietaryInfo?.isVeg ?? true);
      setMenuFormSpicyLevel(item.dietaryInfo?.spicyLevel ?? 0);
      setMenuFormCalories(item.dietaryInfo?.calories ?? 0);
      setMenuFormProtein(item.dietaryInfo?.protein ?? 0);
      setMenuFormAllergens(item.dietaryInfo?.allergens?.join(', ') ?? '');
    } else {
      setMenuFormId(null);
      setMenuFormName('');
      setMenuFormDescription('');
      setMenuFormPrice(10);
      setMenuFormCategory('mains');
      setMenuFormImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80');
      setMenuFormAvailable(true);
      setMenuFormIsVeg(true);
      setMenuFormSpicyLevel(0);
      setMenuFormCalories(0);
      setMenuFormProtein(0);
      setMenuFormAllergens('');
    }
    setShowMenuForm(true);
  };

  // Submit Menu Form
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setMenuError('');
    setMenuSuccess('');

    const payload = {
      name: menuFormName,
      description: menuFormDescription,
      price: Number(menuFormPrice),
      category: menuFormCategory,
      imageUrl: menuFormImageUrl,
      isAvailable: menuFormAvailable,
      dietaryInfo: {
        isVeg: menuFormIsVeg,
        spicyLevel: Number(menuFormSpicyLevel),
        calories: Number(menuFormCalories),
        protein: Number(menuFormProtein),
        allergens: menuFormAllergens.split(',').map(s => s.trim()).filter(Boolean),
      }
    };

    try {
      if (menuFormMode === 'add') {
        const { data } = await api.post('/menu', payload);
        setMenuItems([...menuItems, data]);
        setMenuSuccess('Menu item created successfully.');
      } else {
        const { data } = await api.put(`/menu/${menuFormId}`, payload);
        setMenuItems(menuItems.map((item) => (item._id === menuFormId ? data : item)));
        setMenuSuccess('Menu item updated successfully.');
      }
      setShowMenuForm(false);
    } catch (err) {
      console.error('Menu submit error:', err);
      setMenuError(err.response?.data?.message || 'Failed to save menu item.');
    }
  };

  // Delete Menu Item
  const handleMenuDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    setMenuError('');
    setMenuSuccess('');
    try {
      await api.delete(`/menu/${id}`);
      setMenuItems(menuItems.filter((item) => item._id !== id));
      setMenuSuccess('Menu item deleted successfully.');
    } catch (err) {
      console.error('Menu delete error:', err);
      setMenuError('Failed to delete menu item.');
    }
  };

  // Open Add/Edit Table Form
  const openTableForm = (mode, table = null) => {
    setTableError('');
    setTableSuccess('');
    setTableFormMode(mode);
    if (mode === 'edit' && table) {
      setTableFormId(table._id);
      setTableFormNumber(table.number);
      setTableFormCapacity(table.capacity);
      setTableFormType(table.type);
      setTableFormAvailable(table.isAvailable);
    } else {
      setTableFormId(null);
      setTableFormNumber(tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1);
      setTableFormCapacity(4);
      setTableFormType('Center Lounge');
      setTableFormAvailable(true);
    }
    setShowTableForm(true);
  };

  // Submit Table Form
  const handleTableSubmit = async (e) => {
    e.preventDefault();
    setTableError('');
    setTableSuccess('');

    const payload = {
      number: Number(tableFormNumber),
      capacity: Number(tableFormCapacity),
      type: tableFormType,
      isAvailable: tableFormAvailable,
    };

    try {
      if (tableFormMode === 'add') {
        const { data } = await api.post('/tables', payload);
        setTables([...tables, data].sort((a, b) => a.number - b.number));
        setTableSuccess('Table added successfully.');
      } else {
        const { data } = await api.put(`/tables/${tableFormId}`, payload);
        setTables(tables.map((t) => (t._id === tableFormId ? data : t)).sort((a, b) => a.number - b.number));
        setTableSuccess('Table updated successfully.');
      }
      setShowTableForm(false);
    } catch (err) {
      console.error('Table submit error:', err);
      setTableError(err.response?.data?.message || 'Failed to save table.');
    }
  };

  // Delete Table
  const handleTableDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this table?')) return;
    setTableError('');
    setTableSuccess('');
    try {
      await api.delete(`/tables/${id}`);
      setTables(tables.filter((t) => t._id !== id));
      setTableSuccess('Table removed successfully.');
    } catch (err) {
      console.error('Table delete error:', err);
      setTableError('Failed to remove table.');
    }
  };

  const getPrepBadge = (status) => {
    switch (status) {
      case 'ready':
        return <span className="badge badge-success">Ready</span>;
      case 'in-prep':
        return <span className="badge badge-warning">Cooking</span>;
      case 'not-started':
        return <span className="badge badge-danger">Queued</span>;
      default:
        return <span className="badge badge-info">None</span>;
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Tab Navigation */}
      <div style={styles.tabsContainer}>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'overview' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Analytics
        </button>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'menu' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'menu' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
          onClick={() => setActiveTab('menu')}
        >
          Menu Management
        </button>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'tables' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'tables' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
          onClick={() => setActiveTab('tables')}
        >
          Table Seating Layout
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Management Dashboard {user?.restaurant?.name ? `| ${user.restaurant.name}` : ''}</h1>
              <p style={styles.subtitle}>Analyze peak busy hours, track guest bookings, and optimize prep workflows.</p>
            </div>
            <button onClick={handleRefresh} style={styles.refreshBtn}>
              <RefreshCw size={16} /> Refresh Metrics
            </button>
          </div>

          {/* Quick stats boxes */}
          {loadingStats ? (
            <div style={styles.loadingWrapper}>Loading stats...</div>
          ) : (
            stats && (
              <div style={styles.statsGrid}>
                <div style={styles.statCard} className="glass-card">
                  <div style={styles.statInfo}>
                    <span style={styles.statLabel}>Total Confirmed Bookings</span>
                    <span style={styles.statValue}>{stats.totalBookings}</span>
                  </div>
                  <div style={styles.statIconCircle}>
                    <Calendar size={20} color="var(--primary)" />
                  </div>
                </div>

                <div style={styles.statCard} className="glass-card">
                  <div style={styles.statInfo}>
                    <span style={styles.statLabel}>Advance Deposits Collected</span>
                    <span style={styles.statValue}>₹{stats.totalRevenue?.toFixed(2)}</span>
                  </div>
                  <div style={styles.statIconCircle}>
                    <IndianRupee size={20} color="var(--primary)" />
                  </div>
                </div>

                <div style={styles.statCard} className="glass-card">
                  <div style={styles.statInfo}>
                    <span style={styles.statLabel}>Active Kitchen Pre-Orders</span>
                    <span style={styles.statValue}>{stats.pendingPrep}</span>
                  </div>
                  <div style={styles.statIconCircle}>
                    <ChefHat size={20} color="var(--color-warning)" />
                  </div>
                </div>
              </div>
            )
          )}

          {/* Dashboard Main Content */}
          <div style={styles.mainGrid}>
            
            {/* Left Side: Daily occupancy bar chart & Date Picker */}
            <div style={{ flex: '1', minWidth: '350px' }}>
              <div style={styles.sectionCard} className="glass-card">
                <div style={styles.sectionTitleRow}>
                  <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                    <BarChart2 size={18} color="var(--primary)" /> Peak Hours Monitoring
                  </h3>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: '150px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  />
                </div>
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Occupancy percentage per slot on {selectedDate}. Helps optimize kitchen shift planning and table rotations.
                </p>

                <div style={styles.verticalChart}>
                  {busyHours.map((slot) => {
                    let gradientFill = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
                    let glowColor = 'rgba(16, 185, 129, 0.4)';
                    let badgeLabel = 'Relaxed';
                    let badgeStyle = {
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    };

                    if (slot.occupancy > 70) {
                      gradientFill = 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)';
                      glowColor = 'rgba(239, 68, 68, 0.5)';
                      badgeLabel = 'Peak Rush';
                      badgeStyle = {
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      };
                    } else if (slot.occupancy > 40) {
                      gradientFill = 'linear-gradient(90deg, #f59e0b 0%, #ffd700 100%)';
                      glowColor = 'rgba(245, 158, 11, 0.45)';
                      badgeLabel = 'Lively';
                      badgeStyle = {
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fde047',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      };
                    }

                    return (
                      <div key={slot.time} style={styles.horizontalBarCard}>
                        <div style={styles.barTopRow}>
                          <div style={styles.timeTag}>
                            <Clock size={13} color="var(--primary)" />
                            <span>{slot.time}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ ...styles.statusPill, ...badgeStyle }}>{badgeLabel}</span>
                            <span style={styles.percentageText}>{slot.occupancy}%</span>
                          </div>
                        </div>
                        <div style={styles.horizontalBarTrack}>
                          <div
                            style={{
                              ...styles.horizontalBarFill,
                              width: `${Math.max(slot.occupancy, 3)}%`,
                              background: gradientFill,
                              boxShadow: `0 0 12px ${glowColor}`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side: Reservations list table */}
            <div style={{ flex: '1.5', minWidth: '380px' }}>
              <div style={styles.sectionCard} className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--primary)" /> Reservations for {selectedDate}
                </h3>

                {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

                {loadingReservations ? (
                  <div style={styles.loadingWrapper}>Loading reservations list...</div>
                ) : reservations.length === 0 ? (
                  <p style={styles.emptyText}>No reservations recorded for this date.</p>
                ) : (
                  <div style={styles.tableResponsive}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Time</th>
                          <th style={styles.th}>Table</th>
                          <th style={styles.th}>Guest</th>
                          <th style={styles.th}>Size</th>
                          <th style={styles.th}>Pre-order Prep</th>
                          <th style={styles.th}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map((res) => (
                          <tr key={res._id} style={styles.tr}>
                            <td style={styles.td}><strong>{res.timeSlot}</strong></td>
                            <td style={styles.td}>T - {res.tableNumber}</td>
                            <td style={styles.td}>
                              <div>{res.guestName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{res.guestEmail}</div>
                            </td>
                            <td style={styles.td}>{res.guestsCount} guests</td>
                            <td style={styles.td}>{getPrepBadge(res.prepStatus)}</td>
                            <td style={styles.td}>
                              <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                                ₹{res.advanceAmount?.toFixed(2)}
                              </span>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                of ₹{res.totalFoodAmount?.toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {activeTab === 'menu' && (
        <>
          <div style={{ ...styles.menuFilterBar, borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Gourmet Menu {user?.restaurant?.name ? `| ${user.restaurant.name}` : ''}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configure active dishes, prices, categories, and inventory status.</p>
            </div>
          </div>
          <div style={styles.menuFilterBar}>
            <div style={styles.filterBtnGroup}>
              {['all', 'appetizers', 'mains', 'desserts', 'beverages'].map((cat) => (
                <button
                  key={cat}
                  className={`btn ${selectedMenuCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={styles.filterBtn}
                  onClick={() => setSelectedMenuCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => openMenuForm('add')}>
              <Plus size={16} /> Add Gourmet Dish
            </button>
          </div>

          {menuError && <div style={styles.errorAlert}>{menuError}</div>}
          {menuSuccess && <div style={{ ...styles.errorAlert, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{menuSuccess}</div>}

          {loadingMenu ? (
            <div style={styles.loadingWrapper}>Loading gourmet menu...</div>
          ) : (
            <div style={styles.adminGrid}>
              {menuItems
                .filter(item => selectedMenuCategory === 'all' || item.category === selectedMenuCategory)
                .map((item) => (
                  <div key={item._id} style={styles.adminCard} className="glass-card">
                    <div style={styles.adminCardHeader}>
                      <img src={item.imageUrl} alt={item.name} style={styles.adminCardImg} />
                      <div style={styles.adminCardInfo}>
                        <h4 style={styles.adminCardName}>{item.name}</h4>
                        <p style={styles.adminCardPrice}>₹{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div style={styles.adminCardBody}>
                      <p style={styles.adminCardDesc}>{item.description}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                        {item.dietaryInfo?.isVeg ? (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>VEG</span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>NON-VEG</span>
                        )}
                        {item.dietaryInfo?.spicyLevel > 0 && (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                            {'🌶️'.repeat(item.dietaryInfo.spicyLevel)} Spicy
                          </span>
                        )}
                        {item.dietaryInfo?.calories > 0 && (
                          <span className="badge" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            {item.dietaryInfo.calories} kcal
                          </span>
                        )}
                        {item.dietaryInfo?.protein > 0 && (
                          <span className="badge" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            {item.dietaryInfo.protein}g protein
                          </span>
                        )}
                      </div>
                      {item.dietaryInfo?.allergens?.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span style={{ fontWeight: '600' }}>⚠️ Contains:</span> {item.dietaryInfo.allergens.join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={styles.adminCardFooter}>
                      <span>
                        {item.isAvailable ? (
                          <span className="badge badge-success">Available</span>
                        ) : (
                          <span className="badge badge-danger">Out of Stock</span>
                        )}
                      </span>
                      <div style={styles.cardActions}>
                        <button style={styles.actionIconBtn} title="Edit" onClick={() => openMenuForm('edit', item)}>
                          <Edit2 size={15} color="var(--primary)" />
                        </button>
                        <button style={styles.actionIconBtn} title="Delete" onClick={() => handleMenuDelete(item._id)}>
                          <Trash2 size={15} color="var(--color-danger)" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'tables' && (
        <>
          <div style={styles.menuFilterBar}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Seating Layout {user?.restaurant?.name ? `| ${user.restaurant.name}` : ''}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage dining tables, seating capacities, and location views.</p>
            </div>
            <button className="btn btn-primary" onClick={() => openTableForm('add')}>
              <Plus size={16} /> Add Seating Table
            </button>
          </div>

          {tableError && <div style={styles.errorAlert}>{tableError}</div>}
          {tableSuccess && <div style={{ ...styles.errorAlert, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{tableSuccess}</div>}

          {loadingTables ? (
            <div style={styles.loadingWrapper}>Loading seating layout...</div>
          ) : (
            <div style={styles.tableDetailsGrid}>
              {tables.map((table) => (
                <div key={table._id} style={styles.tableBox} className="glass-card">
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                    <div style={styles.cardActions}>
                      <button style={styles.actionIconBtn} title="Edit Table" onClick={() => openTableForm('edit', table)}>
                        <Edit2 size={14} color="var(--primary)" />
                      </button>
                      <button style={styles.actionIconBtn} title="Remove Table" onClick={() => handleTableDelete(table._id)}>
                        <Trash2 size={14} color="var(--color-danger)" />
                      </button>
                    </div>
                  </div>
                  <div style={styles.tableNumber}>{table.number}</div>
                  <div style={styles.tableMeta}>{table.type}</div>
                  <div style={styles.tableCapacity}>Up to {table.capacity} Guests</div>
                  <div style={styles.tableStatusBadge}>
                    {table.isAvailable ? (
                      <span className="badge badge-success">In Service</span>
                    ) : (
                      <span className="badge badge-danger">Out of Service</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Forms Overlay Modals */}
      {showMenuForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card animate-scale-in">
            <div style={styles.modalHeader}>
              <h3>{menuFormMode === 'add' ? 'Add Gourmet Dish' : 'Edit Dish Details'}</h3>
              <button onClick={() => setShowMenuForm(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleMenuSubmit} style={styles.form}>
              <div className="form-group">
                <label className="form-label">Dish Name</label>
                <input type="text" className="form-control" value={menuFormName} onChange={e => setMenuFormName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: '1' }}>
                  <label className="form-label">Category</label>
                  <select className="form-control" value={menuFormCategory} onChange={e => setMenuFormCategory(e.target.value)}>
                    <option value="appetizers">Appetizers</option>
                    <option value="mains">Mains</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                  <label className="form-label">Price (₹)</label>
                  <input type="number" step="0.01" min="0" className="form-control" value={menuFormPrice} onChange={e => setMenuFormPrice(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="text" className="form-control" value={menuFormImageUrl} onChange={e => setMenuFormImageUrl(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows="3" className="form-control" style={{ resize: 'vertical' }} value={menuFormDescription} onChange={e => setMenuFormDescription(e.target.value)} required></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                  <input type="checkbox" id="menuFormIsVeg" checked={menuFormIsVeg} onChange={e => setMenuFormIsVeg(e.target.checked)} style={{ cursor: 'pointer' }} />
                  <label htmlFor="menuFormIsVeg" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Vegetarian (Veg)</label>
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                  <label className="form-label">Spice Level (0-3)</label>
                  <select className="form-control" value={menuFormSpicyLevel} onChange={e => setMenuFormSpicyLevel(e.target.value)} style={{ background: '#14161d', color: '#fff' }}>
                    <option value="0">0 - None</option>
                    <option value="1">1 - Mild</option>
                    <option value="2">2 - Medium</option>
                    <option value="3">3 - Hot</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: '1' }}>
                  <label className="form-label">Calories (kcal)</label>
                  <input type="number" min="0" className="form-control" value={menuFormCalories} onChange={e => setMenuFormCalories(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                  <label className="form-label">Protein (g)</label>
                  <input type="number" min="0" className="form-control" value={menuFormProtein} onChange={e => setMenuFormProtein(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Allergens (comma separated)</label>
                <input type="text" className="form-control" placeholder="e.g. Gluten, Dairy, Nuts" value={menuFormAllergens} onChange={e => setMenuFormAllergens(e.target.value)} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input type="checkbox" id="menuFormAvailable" checked={menuFormAvailable} onChange={e => setMenuFormAvailable(e.target.checked)} style={{ cursor: 'pointer' }} />
                <label htmlFor="menuFormAvailable" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Item is Available to Order</label>
              </div>
              <div style={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMenuForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Dish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTableForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card animate-scale-in" style={{ maxWidth: '450px' }}>
            <div style={styles.modalHeader}>
              <h3>{tableFormMode === 'add' ? 'Add Dining Table' : 'Edit Table Details'}</h3>
              <button onClick={() => setShowTableForm(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleTableSubmit} style={styles.form}>
              <div className="form-group">
                <label className="form-label">Table Number</label>
                <input type="number" min="1" className="form-control" value={tableFormNumber} onChange={e => setTableFormNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Seating Capacity (Guests)</label>
                <input type="number" min="1" className="form-control" value={tableFormCapacity} onChange={e => setTableFormCapacity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Location / View Type</label>
                <select className="form-control" value={tableFormType} onChange={e => setTableFormType(e.target.value)}>
                  <option value="Window Side">Window Side</option>
                  <option value="Garden View">Garden View</option>
                  <option value="Cozy Corner">Cozy Corner</option>
                  <option value="Family Table">Family Table</option>
                  <option value="Center Lounge">Center Lounge</option>
                  <option value="Bar High-top">Bar High-top</option>
                  <option value="VIP Private Alcove">VIP Private Alcove</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input type="checkbox" id="tableFormAvailable" checked={tableFormAvailable} onChange={e => setTableFormAvailable(e.target.checked)} style={{ cursor: 'pointer' }} />
                <label htmlFor="tableFormAvailable" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Table is Available for Reservation</label>
              </div>
              <div style={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTableForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Table</button>
              </div>
            </form>
          </div>
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.2rem',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
  },
  statCard: {
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#fff',
  },
  statIconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainGrid: {
    display: 'flex',
    gap: '1.75rem',
    flexWrap: 'wrap',
  },
  sectionCard: {
    padding: '1.75rem',
    height: '100%',
  },
  sectionTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  verticalChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  horizontalBarCard: {
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    background: 'rgba(10, 18, 30, 0.55)',
    border: '1px solid rgba(255, 215, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    transition: 'all 0.2s ease',
  },
  barTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: '0.02em',
  },
  statusPill: {
    padding: '0.15rem 0.55rem',
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  percentageText: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#ffffff',
    minWidth: '38px',
    textAlign: 'right',
  },
  horizontalBarTrack: {
    width: '100%',
    height: '10px',
    background: 'rgba(15, 23, 42, 0.95)',
    borderRadius: '999px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  horizontalBarFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  tableResponsive: {
    overflowX: 'auto',
    marginTop: '0.5rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'background var(--transition-fast)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  loadingWrapper: {
    textAlign: 'center',
    padding: '3rem 0',
    color: 'var(--text-secondary)',
  },
  emptyText: {
    textAlign: 'center',
    padding: '3rem 0',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--color-danger)',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
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
  menuFilterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  filterBtnGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '0.4rem 1rem',
    fontSize: '0.85rem',
  },
  adminGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  adminCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem',
    height: '100%',
  },
  adminCardHeader: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '0.75rem',
  },
  adminCardImg: {
    width: '70px',
    height: '70px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    border: '1px solid var(--border-color)',
  },
  adminCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  adminCardName: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '0.15rem',
  },
  adminCardPrice: {
    fontSize: '0.9rem',
    color: 'var(--primary)',
    fontWeight: '700',
  },
  adminCardBody: {
    flex: '1',
    marginBottom: '1.25rem',
  },
  adminCardDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.45',
  },
  adminCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '0.75rem',
    marginTop: 'auto',
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionIconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0.35rem',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  modalContent: {
    width: '100%',
    maxWidth: '550px',
    padding: '2rem',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0.2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.25rem',
  },
  tableDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  tableBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem',
    textAlign: 'center',
    position: 'relative',
  },
  tableNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    lineHeight: '1',
    color: '#fff',
    marginBottom: '0.5rem',
  },
  tableMeta: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  tableCapacity: {
    fontSize: '0.8rem',
    color: 'var(--primary)',
    fontWeight: '600',
    marginTop: '0.25rem',
  },
  tableStatusBadge: {
    marginTop: '0.75rem',
  },
};

export default AdminDashboard;
