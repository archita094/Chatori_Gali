import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { Calendar, Users, ShoppingBag, CreditCard, ChevronRight, ChevronLeft, Check, AlertCircle, Sparkles, X, ShieldCheck } from 'lucide-react';

const ReservationFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const location = useLocation();

  // Step state
  const [step, setStep] = useState(1);

  // Form selections
  const [selectedDate, setSelectedDate] = useState(location.state?.date || new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(location.state?.preferredTime || '');
  const [guestsCount, setGuestsCount] = useState(location.state?.guests || 2);
  const [selectedTable, setSelectedTable] = useState('');
  const [cart, setCart] = useState({}); // { menuItemId: quantity }

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'card'
  
  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Simulated Razorpay Modal visibility
  const [showSimulatedRazorpay, setShowSimulatedRazorpay] = useState(false);
  const [simulatedPaymentMethod, setSimulatedPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [simulatedUpiId, setSimulatedUpiId] = useState('');
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [simulatedOrderId, setSimulatedOrderId] = useState('');
  const [simulatedOrderAmount, setSimulatedOrderAmount] = useState(0);
  
  // Payment card info
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // API loaded states
  const [restaurant, setRestaurant] = useState(null);
  const [busyHours, setBusyHours] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reservedTables, setReservedTables] = useState([]);
  
  // Interface states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Standard table definitions (12 tables total) - used as static fallback
  const staticTables = [
    { _id: '1', number: 1, capacity: 2, type: 'Window Side', isAvailable: true },
    { _id: '2', number: 2, capacity: 4, type: 'Garden View', isAvailable: true },
    { _id: '3', number: 3, capacity: 2, type: 'Cozy Corner', isAvailable: true },
    { _id: '4', number: 4, capacity: 6, type: 'Family Table', isAvailable: true },
    { _id: '5', number: 5, capacity: 4, type: 'Center Lounge', isAvailable: true },
    { _id: '6', number: 6, capacity: 2, type: 'Bar High-top', isAvailable: true },
    { _id: '7', number: 7, capacity: 4, type: 'Garden View', isAvailable: true },
    { _id: '8', number: 8, capacity: 8, type: 'VIP Private Alcove', isAvailable: true },
    { _id: '9', number: 9, capacity: 2, type: 'Window Side', isAvailable: true },
    { _id: '10', number: 10, capacity: 4, type: 'Center Lounge', isAvailable: true },
    { _id: '11', number: 11, capacity: 6, type: 'Family Table', isAvailable: true },
    { _id: '12', number: 12, capacity: 2, type: 'Cozy Corner', isAvailable: true },
  ];

  const [tables, setTables] = useState(staticTables);

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const { data } = await api.get(`/restaurants/${restaurantId}`);
        setRestaurant(data);
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
      }
    };
    if (restaurantId) {
      fetchRestaurantDetails();
    }
  }, [restaurantId]);

  // Fetch tables on load scoped to restaurant
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const { data } = await api.get(`/tables?restaurantId=${restaurantId}`);
        if (data && data.length > 0) {
          setTables(data);
        }
      } catch (err) {
        console.error('Failed to load tables from database, using fallback layout:', err);
      }
    };
    if (restaurantId) {
      fetchTables();
    }
  }, [restaurantId]);

  // Fetch busy hours scoped to restaurant when date changes
  useEffect(() => {
    const fetchBusyHours = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/reservations/busy-hours?date=${selectedDate}&restaurantId=${restaurantId}`);
        setBusyHours(data);
      } catch (err) {
        console.error('Error fetching busy hours:', err);
        setErrorMessage('Failed to load busy hours analytics.');
      } finally {
        setLoading(false);
      }
    };
    if (selectedDate && restaurantId) {
      fetchBusyHours();
    }
  }, [selectedDate, restaurantId]);

  // Fetch menu items and occupied tables for date & timeslot
  useEffect(() => {
    const fetchMenuAndTables = async () => {
      try {
        // Fetch menu scoped to restaurant
        const menuRes = await api.get(`/menu?restaurantId=${restaurantId}`);
        setMenuItems(menuRes.data);

        // Fetch all reservations for the day to check occupied tables
        if (selectedDate && selectedTimeSlot && restaurantId) {
          const resRes = await api.get(`/reservations/all?date=${selectedDate}&restaurantId=${restaurantId}`);
          // Find table numbers that are reserved in the selected slot
          const occupied = resRes.data
            .filter((r) => r.timeSlot === selectedTimeSlot && r.status !== 'cancelled')
            .map((r) => r.tableNumber);
          setReservedTables(occupied);
        }
      } catch (err) {
        console.error('Error loading step details:', err);
      }
    };
    
    if (step >= 2 && restaurantId) {
      fetchMenuAndTables();
    }
  }, [step, selectedDate, selectedTimeSlot, restaurantId]);

  // Cart actions
  const updateQuantity = (itemId, quantity) => {
    const qty = Math.max(0, quantity);
    setCart((prev) => {
      const updated = { ...prev };
      if (qty === 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = qty;
      }
      return updated;
    });
  };

  // Load preselected menu item from AI Dietary Assistant
  useEffect(() => {
    if (location.state && location.state.preselectedItem && menuItems.length > 0) {
      const itemId = location.state.preselectedItem;
      const itemExists = menuItems.find((m) => m._id === itemId);
      if (itemExists) {
        setCart((prev) => ({ ...prev, [itemId]: 1 }));
      }
    }
  }, [location.state, menuItems]);

  // Load Razorpay checkout SDK dynamically when on checkout step
  useEffect(() => {
    if (step === 4) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        const checkScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (checkScript) {
          document.body.removeChild(checkScript);
        }
      };
    }
  }, [step]);

  // Calculations
  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, qty]) => {
      const item = menuItems.find((m) => m._id === itemId);
      return total + (item ? item.price * qty : 0);
    }, 0);
  };
  const cartTotal = getCartTotal();

  // Recalculate discount whenever cart or applied code changes
  useEffect(() => {
    if (!appliedPromoCode) {
      setDiscountAmount(0);
      setPromoSuccess('');
      return;
    }

    if (appliedPromoCode === 'PREORDER10') {
      const discount = Math.round(cartTotal * 0.1 * 100) / 100;
      setDiscountAmount(discount);
      setPromoSuccess(`10% discount applied! You save $${discount.toFixed(2)}`);
      setPromoError('');
    } else if (appliedPromoCode === 'FREEDESSERT') {
      let cheapestDessert = Infinity;
      Object.entries(cart).forEach(([itemId, qty]) => {
        const item = menuItems.find((m) => m._id === itemId);
        if (item && item.category === 'desserts') {
          if (item.price < cheapestDessert) {
            cheapestDessert = item.price;
          }
        }
      });

      if (cheapestDessert !== Infinity) {
        setDiscountAmount(cheapestDessert);
        setPromoSuccess(`Free dessert applied! You save $${cheapestDessert.toFixed(2)}`);
        setPromoError('');
      } else {
        setDiscountAmount(0);
        setAppliedPromoCode('');
        setPromoError('Please add a dessert from the menu to your pre-order cart to apply FREEDESSERT.');
        setPromoSuccess('');
      }
    }
  }, [cart, appliedPromoCode, cartTotal, menuItems]);

  const handleApplyPromo = () => {
    setPromoError('');
    setPromoSuccess('');
    const code = promoCodeInput.trim().toUpperCase();

    if (!code) {
      setPromoError('Please enter a promo code.');
      return;
    }

    if (code !== 'PREORDER10' && code !== 'FREEDESSERT') {
      setPromoError('Invalid promo code. Try "PREORDER10" or "FREEDESSERT".');
      return;
    }

    if (cartTotal === 0) {
      setPromoError('Add items to your cart before applying a promo code.');
      return;
    }

    setAppliedPromoCode(code);
  };

  const handleRemovePromo = () => {
    setAppliedPromoCode('');
    setPromoCodeInput('');
    setDiscountAmount(0);
    setPromoError('');
    setPromoSuccess('');
  };

  const advanceAmount = Math.round(Math.max(0, cartTotal - discountAmount) * 0.6 * 100) / 100;

  // Handle final submission
  const handlePaymentSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    const formattedMenuItems = Object.entries(cart).map(([menuItemId, qty]) => ({
      menuItemId,
      quantity: qty,
    }));

    // If no food is ordered (deposit is $0), submit directly
    if (advanceAmount === 0) {
      try {
        const payload = {
          guestName: user.name,
          guestEmail: user.email,
          guestsCount,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          tableNumber: Number(selectedTable),
          menuItems: formattedMenuItems,
          restaurantId,
          discountCode: appliedPromoCode,
        };
        const { data } = await api.post('/reservations', payload);
        setSuccessData(data);
        setStep(5);
      } catch (err) {
        setErrorMessage(err.response?.data?.message || 'Booking failed.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Handle legacy card checkout option
    if (paymentMethod === 'card') {
      try {
        const payload = {
          guestName: user.name,
          guestEmail: user.email,
          guestsCount,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          tableNumber: Number(selectedTable),
          menuItems: formattedMenuItems,
          paymentCardLast4: cardNumber.slice(-4) || '4242',
          restaurantId,
          discountCode: appliedPromoCode,
        };
        const { data } = await api.post('/reservations', payload);
        setSuccessData(data);
        setStep(5);
      } catch (err) {
        setErrorMessage(err.response?.data?.message || 'Card payment failed.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Razorpay Flow
    try {
      const { data: orderData } = await api.post('/reservations/razorpay-order', { amount: advanceAmount });

      if (orderData.isSimulated) {
        // Trigger simulated Razorpay overlay
        setSimulatedOrderId(orderData.id);
        setSimulatedOrderAmount(orderData.amount / 100);
        setShowSimulatedRazorpay(true);
        setSubmitting(false);
        return;
      }

      // Real Razorpay modal initialization
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: restaurant?.name || 'Chatori Gali',
        description: 'Seat Reservation & Pre-Order Deposit',
        order_id: orderData.id,
        handler: async (response) => {
          setSubmitting(true);
          try {
            const payload = {
              guestName: user.name,
              guestEmail: user.email,
              guestsCount,
              date: selectedDate,
              timeSlot: selectedTimeSlot,
              tableNumber: Number(selectedTable),
              menuItems: formattedMenuItems,
              restaurantId,
              discountCode: appliedPromoCode,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              isSimulatedPayment: false,
            };
            const { data } = await api.post('/reservations', payload);
            setSuccessData(data);
            setStep(5);
          } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#d4af37',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setErrorMessage(response.error.description || 'Razorpay payment failed.');
        setSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay check failed, falling back:', err);
      setErrorMessage('Failed to initialize Razorpay checkout.');
      setSubmitting(false);
    }
  };

  // Triggers Simulated Razorpay transaction execution
  const executeSimulatedPayment = async () => {
    setSubmitting(true);
    setSimulatedProgress(10);
    
    const interval = setInterval(() => {
      setSimulatedProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 30;
      });
    }, 450);

    setTimeout(async () => {
      clearInterval(interval);
      try {
        const formattedMenuItems = Object.entries(cart).map(([menuItemId, qty]) => ({
          menuItemId,
          quantity: qty,
        }));
        
        const payload = {
          guestName: user.name,
          guestEmail: user.email,
          guestsCount,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          tableNumber: Number(selectedTable),
          menuItems: formattedMenuItems,
          restaurantId,
          discountCode: appliedPromoCode,
          razorpayOrderId: simulatedOrderId,
          razorpayPaymentId: 'pay_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          razorpaySignature: 'sim_sig_' + Math.random().toString(36).substr(2, 16),
          isSimulatedPayment: true,
        };

        const { data } = await api.post('/reservations', payload);
        setSuccessData(data);
        setShowSimulatedRazorpay(false);
        setStep(5);
      } catch (err) {
        setErrorMessage(err.response?.data?.message || 'Simulated payment failed.');
        setShowSimulatedRazorpay(false);
      } finally {
        setSubmitting(false);
        setSimulatedProgress(0);
      }
    }, 1800);
  };

  const nextStep = () => {
    setErrorMessage('');
    if (step === 1 && !selectedTimeSlot) {
      setErrorMessage('Please select a preferred dining time slot.');
      return;
    }
    if (step === 2 && !selectedTable) {
      setErrorMessage('Please select an available dining table.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMessage('');
    setStep((prev) => prev - 1);
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Steps Indicator */}
      {step <= 4 && (
        <div style={styles.stepper}>
          <div style={{ ...styles.stepIndicator, color: step >= 1 ? 'var(--primary)' : 'var(--text-muted)' }}>
            <Calendar size={18} />
            <span>Time Slot</span>
          </div>
          <ChevronRight size={14} color="var(--text-muted)" />
          <div style={{ ...styles.stepIndicator, color: step >= 2 ? 'var(--primary)' : 'var(--text-muted)' }}>
            <Users size={18} />
            <span>Table</span>
          </div>
          <ChevronRight size={14} color="var(--text-muted)" />
          <div style={{ ...styles.stepIndicator, color: step >= 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
            <ShoppingBag size={18} />
            <span>Pre-Order</span>
          </div>
          <ChevronRight size={14} color="var(--text-muted)" />
          <div style={{ ...styles.stepIndicator, color: step >= 4 ? 'var(--primary)' : 'var(--text-muted)' }}>
            <CreditCard size={18} />
            <span>Checkout</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div style={styles.errorAlert}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Date & Time Selector */}
      {step === 1 && (
        <div style={styles.contentCard} className="glass-card animate-slide-up">
          <h2 style={styles.title}>Select Date & Time {restaurant && `at ${restaurant.name}`}</h2>
          <p style={styles.subtitle}>Choose your preferred day and check the live occupancy chart for {restaurant?.name || 'the restaurant'} to avoid peak crowd hours.</p>

          <div style={styles.row}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <label className="form-label">Dining Date</label>
              <input
                type="date"
                className="form-control"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTimeSlot('');
                }}
                style={{ fontSize: '1.1rem', padding: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.2rem', color: '#ffffff', fontSize: '0.92rem' }}>
                  Live Table Occupancy & Available Slots
                </label>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: 0 }}>
                  Select your preferred dining time slot. Green indicates relaxed dining, while amber/red indicates lively rush hours.
                </p>
              </div>

              {/* Occupancy Legend */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', fontSize: '0.74rem', color: '#cbd5e1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  Relaxed (0-40%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
                  Lively (41-70%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                  Rush (71%+)
                </span>
              </div>
            </div>

            {loading ? (
              <div style={styles.loadingWrapper}>Loading live busy hours...</div>
            ) : (
              <div style={styles.chartWrapper}>
                {busyHours.map((slot) => {
                  const isSelected = selectedTimeSlot === slot.time;
                  let gradient = 'linear-gradient(to top, #059669, #34d399)';
                  let glowColor = 'rgba(16, 185, 129, 0.4)';
                  let statusText = 'Relaxed';
                  let statusColor = '#34d399';

                  if (slot.occupancy > 70) {
                    gradient = 'linear-gradient(to top, #dc2626, #f87171)';
                    glowColor = 'rgba(239, 68, 68, 0.4)';
                    statusText = 'Rush';
                    statusColor = '#f87171';
                  } else if (slot.occupancy > 40) {
                    gradient = 'linear-gradient(to top, #d97706, #fbbf24)';
                    glowColor = 'rgba(245, 158, 11, 0.4)';
                    statusText = 'Lively';
                    statusColor = '#fbbf24';
                  }

                  if (isSelected) {
                    gradient = 'linear-gradient(to top, #d97706, #ffd700)';
                    glowColor = 'rgba(255, 215, 0, 0.6)';
                  }

                  return (
                    <div
                      key={slot.time}
                      style={{
                        ...styles.chartBarContainer,
                        background: isSelected ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        borderColor: isSelected ? '#ffd700' : 'rgba(255, 215, 0, 0.18)',
                        boxShadow: isSelected ? '0 8px 24px rgba(255, 215, 0, 0.25)' : 'none',
                        transform: isSelected ? 'translateY(-4px)' : 'none',
                      }}
                      onClick={() => setSelectedTimeSlot(slot.time)}
                    >
                      {isSelected && (
                        <div style={styles.selectedPillBadge}>
                          <Check size={11} color="#142232" />
                          <span>SELECTED</span>
                        </div>
                      )}

                      <div style={styles.barBackground}>
                        {/* Reference guidelines */}
                        <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                        <div
                          style={{
                            ...styles.barFill,
                            height: `${Math.max(slot.occupancy, 8)}%`,
                            background: gradient,
                            boxShadow: `0 0 12px ${glowColor}`,
                          }}
                        />
                      </div>

                      <span style={{
                        ...styles.barTimeLabel,
                        color: isSelected ? '#ffd700' : '#ffffff',
                        fontWeight: '800',
                      }}>
                        {slot.time}
                      </span>

                      <div style={{
                        ...styles.barOccupancyPill,
                        background: isSelected ? '#ffd700' : 'rgba(255,255,255,0.07)',
                        color: isSelected ? '#142232' : statusColor,
                      }}>
                        {slot.occupancy}% • {statusText}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={styles.actionRow}>
            <div />
            <button className="btn btn-primary" onClick={nextStep}>
              Choose Seating <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Table Selection */}
      {step === 2 && (
        <div style={styles.contentCard} className="glass-card animate-slide-up">
          <h2 style={styles.title}>Select Your Seating</h2>
          <p style={styles.subtitle}>Choose an available table. Fully booked slots will display reserved tables as unavailable.</p>

          <div style={styles.filterRow}>
            <div className="form-group" style={{ margin: 0, flex: '1', maxWidth: '300px' }}>
              <label className="form-label">Number of Guests</label>
              <select
                className="form-control"
                value={guestsCount}
                onChange={(e) => {
                  setGuestsCount(Number(e.target.value));
                  setSelectedTable('');
                }}
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5 Guests</option>
                <option value="6">6 Guests</option>
                <option value="8">8 Guests</option>
              </select>
            </div>
            <div style={styles.bookingStatusLegend}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }} /> Available
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--primary)' }} /> Selected
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.15)', border: '1px dashed var(--color-danger)' }} /> Reserved
              </div>
            </div>
          </div>

          <div style={styles.tableGrid}>
            {tables.map((table) => {
              const isUnavailable = table.isAvailable === false;
              const isOccupied = reservedTables.includes(table.number);
              const isTooSmall = table.capacity < guestsCount;
              const isSelected = selectedTable === String(table.number);
              
              let cardBg = 'rgba(255, 255, 255, 0.02)';
              let borderStyle = '1px solid var(--border-color)';
              let cursor = 'pointer';
              let opacity = 1;

              if (isUnavailable) {
                cardBg = 'rgba(239, 68, 68, 0.04)';
                borderStyle = '1px dashed rgba(239, 68, 68, 0.3)';
                cursor = 'not-allowed';
                opacity = 0.35;
              } else if (isOccupied) {
                cardBg = 'rgba(239, 68, 68, 0.05)';
                borderStyle = '1px dashed var(--color-danger)';
                cursor = 'not-allowed';
                opacity = 0.5;
              } else if (isTooSmall) {
                opacity = 0.4;
                cursor = 'not-allowed';
              } else if (isSelected) {
                cardBg = 'var(--primary-glow)';
                borderStyle = '2px solid var(--primary)';
              }

              const handleTableClick = () => {
                if (isUnavailable || isOccupied || isTooSmall) return;
                setSelectedTable(String(table.number));
              };

              return (
                <div
                  key={table._id || table.id || table.number}
                  style={{
                    ...styles.tableCard,
                    background: cardBg,
                    border: borderStyle,
                    cursor,
                    opacity,
                  }}
                  onClick={handleTableClick}
                >
                  <h4 style={{ fontSize: '1.25rem', color: isSelected ? 'var(--primary)' : '#fff' }}>Table {table.number}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{table.type}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: isUnavailable || isTooSmall ? 'var(--color-danger)' : 'var(--primary)',
                    marginTop: '0.5rem'
                  }}>
                    {isUnavailable ? 'Out of Service' : `Max ${table.capacity} Guests`}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={styles.actionRow}>
            <button className="btn btn-secondary" onClick={prevStep}>
              <ChevronLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={nextStep} disabled={!selectedTable}>
              Pre-Order Food <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Pre-Order Menu */}
      {step === 3 && (
        <div style={styles.contentCard} className="glass-card animate-slide-up">
          <h2 style={styles.title}>Browse Gourmet Menu</h2>
          <p style={styles.subtitle}>Select dishes to pre-order. You will only pay a 60% advance reservation deposit on pre-selected food.</p>

          <div style={styles.menuLayout}>
            {/* Left menu column */}
            <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {['appetizers', 'mains', 'desserts', 'beverages'].map((category) => {
                const items = menuItems.filter((item) => item.category === category);
                if (items.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 style={{ textTransform: 'capitalize', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                      {category}
                    </h3>
                    <div style={styles.menuList}>
                      {items.map((item) => {
                        const qty = cart[item._id] || 0;
                        return (
                          <div key={item._id} style={styles.menuItemCard} className="glass-card">
                            <img src={item.imageUrl} alt={item.name} style={styles.menuItemImg} />
                            <div style={styles.menuItemInfo}>
                              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '0.5rem' }}>
                                {item.description}
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                                {item.dietaryInfo?.isVeg ? (
                                  <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>VEG</span>
                                ) : (
                                  <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>NON-VEG</span>
                                )}
                                {item.dietaryInfo?.spicyLevel > 0 && (
                                  <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                    {'🌶️'.repeat(item.dietaryInfo.spicyLevel)}
                                  </span>
                                )}
                                {item.dietaryInfo?.calories > 0 && (
                                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                                    {item.dietaryInfo.calories} kcal
                                  </span>
                                )}
                                {item.dietaryInfo?.protein > 0 && (
                                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                                    {item.dietaryInfo.protein}g protein
                                  </span>
                                )}
                              </div>
                              {item.dietaryInfo?.allergens?.length > 0 && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                  <span style={{ fontWeight: '600' }}>Contains:</span> {item.dietaryInfo.allergens.join(', ')}
                                </div>
                              )}
                              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                ₹{item.price.toFixed(2)}
                              </span>
                            </div>
                            <div style={styles.qtyControl}>
                              {qty > 0 ? (
                                <>
                                  <button onClick={() => updateQuantity(item._id, qty - 1)} style={styles.qtyBtn}>-</button>
                                  <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                                  <button onClick={() => updateQuantity(item._id, qty + 1)} style={styles.qtyBtn}>+</button>
                                </>
                              ) : (
                                <button onClick={() => updateQuantity(item._id, 1)} style={styles.addBtn}>Add</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Summary Column */}
            <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={styles.summaryBox} className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag size={18} color="var(--primary)" /> Pre-Order Cart
                </h3>
                
                {Object.keys(cart).length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                    No food pre-ordered. You can proceed without pre-ordering dishes.
                  </p>
                ) : (
                  <div style={styles.cartItemsList}>
                    {Object.entries(cart).map(([itemId, qty]) => {
                      const item = menuItems.find((m) => m._id === itemId);
                      if (!item) return null;
                      return (
                        <div key={itemId} style={styles.cartItemRow}>
                          <span style={{ fontSize: '0.85rem' }}>{qty}x {item.name}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>₹{(item.price * qty).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div style={styles.divider} />
                    <div style={styles.cartTotalRow}>
                      <span>Total Dishes Value:</span>
                      <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div style={{ ...styles.cartItemRow, color: 'var(--color-success)', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                        <span>Discount Applied:</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={styles.cartAdvanceRow}>
                      <span>60% Deposit Amount:</span>
                      <span style={{ color: 'var(--primary)', fontSize: '1.15rem', fontWeight: '800' }}>
                        ₹{advanceAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* Promo Code input */}
                    <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.25rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Sparkles size={12} color="var(--primary)" style={{ display: 'inline', marginRight: '0.25rem' }} /> Apply Promo Code
                      </label>
                      
                      {!appliedPromoCode ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="e.g. PREORDER10"
                            className="form-control"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleApplyPromo}
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                          >
                            Apply
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212,175,55,0.06)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>{appliedPromoCode}</span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleRemovePromo}
                            style={{ padding: '0.25rem', border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {promoError && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                          {promoError}
                        </div>
                      )}
                      
                      {promoSuccess && (
                        <div style={{ color: 'var(--color-success)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                          {promoSuccess}
                        </div>
                      )}

                      {/* Available promo codes list */}
                      <div style={{ marginTop: '0.85rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Available Offers:</span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => { setPromoCodeInput('PREORDER10'); setPromoError(''); }}
                            style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            PREORDER10 (10% Off)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPromoCodeInput('FREEDESSERT'); setPromoError(''); }}
                            style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            FREEDESSERT (Free Dessert)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={styles.actionRow}>
            <button className="btn btn-secondary" onClick={prevStep}>
              <ChevronLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={nextStep}>
              Proceed to Payment <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Checkout & Simulated Payment */}
      {step === 4 && (
        <div style={styles.contentCard} className="glass-card animate-slide-up" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h2 style={styles.title}>Confirm & Secure Booking</h2>
          <p style={styles.subtitle}>Review your reservation details and complete the 60% advance payment to finalize booking.</p>

          <div style={styles.checkoutSummary} className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1rem' }}>Booking Summary</h3>
            <div style={styles.summaryGrid}>
              <div><strong>Restaurant:</strong> {restaurant?.name || 'Selected Restaurant'}</div>
              <div><strong>Dining Date:</strong> {selectedDate}</div>
              <div><strong>Dining Time:</strong> {selectedTimeSlot}</div>
              <div><strong>Reserved Seating:</strong> Table {selectedTable} ({guestsCount} guests)</div>
              <div>
                <strong>Deposit Amount:</strong>{' '}
                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>₹{advanceAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={{
                flex: '1 1 200px',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: paymentMethod === 'razorpay' ? 'var(--primary)' : 'var(--border-color)',
                background: paymentMethod === 'razorpay' ? 'var(--primary-glow)' : 'transparent',
                color: paymentMethod === 'razorpay' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onClick={() => setPaymentMethod('razorpay')}
            >
              <ShieldCheck size={16} /> Razorpay Checkout (UPI, GPay, Card)
            </button>
            <button
              type="button"
              style={{
                flex: '1 1 200px',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: paymentMethod === 'card' ? 'var(--primary)' : 'var(--border-color)',
                background: paymentMethod === 'card' ? 'var(--primary-glow)' : 'transparent',
                color: paymentMethod === 'card' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard size={16} /> Credit/Debit Card (Simulated)
            </button>
          </div>

          {paymentMethod === 'razorpay' ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <Sparkles size={32} color="var(--primary)" style={{ margin: '0 auto 1.25rem', display: 'block' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>Secure payment via Razorpay</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: '1.5' }}>
                Complete your 60% pre-order deposit of <strong style={{ color: 'var(--primary)' }}>₹{advanceAmount.toFixed(2)}</strong> via Razorpay. Supports PhonePe, GPay, UPI, Netbanking, and Wallets.
              </p>
              
              <div style={{ ...styles.actionRow, marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" onClick={prevStep} disabled={submitting}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button type="button" className="btn btn-primary" onClick={handlePaymentSubmit} disabled={submitting}>
                  {submitting ? 'Connecting to Razorpay...' : `Pay ₹${advanceAmount.toFixed(2)} with Razorpay`}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="var(--primary)" /> Credit Card Information
              </h3>

              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="4242 4242 4242 4242"
                  maxLength="16"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label className="form-label">Expiry Date (MM/YY)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="12/28"
                    maxLength="5"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label className="form-label">CVV</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="•••"
                    maxLength="3"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <div style={{ ...styles.actionRow, marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" onClick={prevStep} disabled={submitting}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Processing Deposit...' : `Pay ₹${advanceAmount.toFixed(2)} & Confirm`}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* STEP 5: Success Screen */}
      {step === 5 && successData && (
        <div style={styles.successCard} className="glass-card animate-scale-in">
          <div style={styles.successCheckmark}>
            <Check size={40} color="#000" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Reservation Confirmed!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '450px' }}>
            Your 60% advance payment has been validated. The kitchen has queued your orders for preparation based on your seating time.
          </p>

          <div style={styles.receiptDetails}>
            <div style={styles.receiptRow}>
              <span>Transaction ID:</span>
              <strong style={{ color: 'var(--primary)' }}>{successData.paymentDetails?.transactionId}</strong>
            </div>
            <div style={styles.receiptRow}>
              <span>Restaurant:</span>
              <strong>{restaurant?.name || 'Selected Restaurant'}</strong>
            </div>
            <div style={styles.receiptRow}>
              <span>Table Number:</span>
              <strong>Table {successData.tableNumber}</strong>
            </div>
            <div style={styles.receiptRow}>
              <span>Date & Time:</span>
              <strong>{successData.date} @ {successData.timeSlot}</strong>
            </div>
            <div style={styles.receiptRow}>
              <span>Paid (60% Deposit):</span>
              <strong style={{ color: 'var(--color-success)' }}>₹{successData.advanceAmount?.toFixed(2)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
              View My Bookings
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Go Home
            </button>
          </div>
        </div>
      )}

      {/* SIMULATED RAZORPAY MODAL OVERLAY */}
      {showSimulatedRazorpay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#14161d',
            border: '1px solid var(--primary)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '440px',
            padding: '2rem',
            position: 'relative',
            boxShadow: 'var(--shadow-glow)',
          }} className="animate-scale-in">
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: '800', letterSpacing: '1px' }}>Razorpay Checkout</span>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#fff' }}>{restaurant?.name || 'Chatori Gali'}</h3>
              </div>
              <button
                onClick={() => setShowSimulatedRazorpay(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* Payment Details Summary */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Order ID:</span>
                <strong style={{ color: '#fff' }}>{simulatedOrderId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Deposit Due:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '800' }}>₹{simulatedOrderAmount.toFixed(2)}</strong>
              </div>
            </div>

            {/* Simulated Payment progress */}
            {simulatedProgress > 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ height: '100%', width: `${simulatedProgress}%`, background: 'var(--primary)', transition: 'width 0.4s' }} />
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Processing secure mock transaction...</p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>Payment Option:</span>
                
                {/* Method selector */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {['upi', 'card', 'netbanking'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSimulatedPaymentMethod(m)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: simulatedPaymentMethod === m ? 'var(--primary)' : 'var(--border-color)',
                        background: simulatedPaymentMethod === m ? 'var(--primary-glow)' : 'transparent',
                        color: simulatedPaymentMethod === m ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Form fields based on payment method */}
                {simulatedPaymentMethod === 'upi' && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated UPI ID (e.g. phonepe@ybl / gpay@okaxis)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="phonepe-user@ybl"
                      value={simulatedUpiId}
                      onChange={(e) => setSimulatedUpiId(e.target.value)}
                    />
                  </div>
                )}

                {simulatedPaymentMethod === 'card' && (
                  <div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated Card Number</label>
                      <input type="text" className="form-control" placeholder="4242 4242 4242 4242" disabled />
                    </div>
                  </div>
                )}

                {simulatedPaymentMethod === 'netbanking' && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Bank</label>
                    <select className="form-control" style={{ background: '#14161d', border: '1px solid var(--border-color)', color: '#fff' }} disabled>
                      <option>State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                    </select>
                  </div>
                )}

                {/* Simulated Payment Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setShowSimulatedRazorpay(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    onClick={executeSimulatedPayment}
                    disabled={submitting || (simulatedPaymentMethod === 'upi' && !simulatedUpiId)}
                  >
                    Pay ₹{simulatedOrderAmount.toFixed(2)} (Mock)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    paddingBottom: '4rem',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 2rem',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '2rem',
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  contentCard: {
    padding: '2.5rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#ffffff',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginBottom: '2rem',
    maxWidth: '650px',
  },
  row: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  chartWrapper: {
    display: 'flex',
    gap: '1rem',
    padding: '1.75rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    overflowX: 'auto',
    background: 'rgba(10, 18, 30, 0.6)',
    border: '1.5px solid rgba(255, 215, 0, 0.22)',
    boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.4)',
  },
  chartBarContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.1rem 0.85rem 0.85rem 0.85rem',
    borderRadius: '16px',
    border: '1.5px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    flex: '1',
    minWidth: '95px',
  },
  selectedPillBadge: {
    position: 'absolute',
    top: '-10px',
    background: '#ffd700',
    color: '#142232',
    fontSize: '0.62rem',
    fontWeight: '800',
    padding: '0.15rem 0.5rem',
    borderRadius: 'var(--radius-full)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
    letterSpacing: '0.04em',
    boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
  },
  barBackground: {
    position: 'relative',
    width: '28px',
    height: '110px',
    background: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 'var(--radius-full)',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
    marginBottom: '0.85rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  barFill: {
    width: '100%',
    borderRadius: 'var(--radius-full)',
    transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  barTimeLabel: {
    fontSize: '0.88rem',
    marginBottom: '0.35rem',
  },
  barOccupancyPill: {
    fontSize: '0.68rem',
    fontWeight: '700',
    borderRadius: 'var(--radius-full)',
    padding: '0.2rem 0.55rem',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  },
  loadingWrapper: {
    textAlign: 'center',
    padding: '3rem 0',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  bookingStatusLegend: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'center',
  },
  tableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2.5rem',
  },
  tableCard: {
    padding: '1.5rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all var(--transition-normal)',
  },
  menuLayout: {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    marginBottom: '2.5rem',
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  menuItemCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1rem',
    flexWrap: 'wrap',
  },
  menuItemImg: {
    width: '70px',
    height: '70px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  menuItemInfo: {
    flex: '1',
    minWidth: '200px',
  },
  qtyControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '1.1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
  },
  addBtn: {
    padding: '0.4rem 1.25rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--primary)',
    background: 'transparent',
    color: 'var(--primary)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  summaryBox: {
    padding: '1.5rem',
    position: 'sticky',
    top: '100px',
  },
  cartItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  cartItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)',
  },
  divider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '0.5rem 0',
  },
  cartTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  cartAdvanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: '0.5rem',
  },
  checkoutSummary: {
    padding: '1.5rem',
    background: 'rgba(212, 175, 55, 0.03)',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    fontSize: '0.9rem',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-danger)',
    padding: '0.85rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  successCard: {
    textAlign: 'center',
    padding: '4rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '550px',
    margin: '3rem auto',
  },
  successCheckmark: {
    width: '70px',
    height: '70px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    boxShadow: 'var(--shadow-glow)',
  },
  receiptDetails: {
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    textAlign: 'left',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
  },
};

export default ReservationFlow;
export { styles as flowStyles };
