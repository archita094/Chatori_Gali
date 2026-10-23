import Reservation from '../models/Reservation.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import crypto from 'crypto';

// Get busy hours for a specific date and restaurant
export const getBusyHours = async (req, res) => {
  const { date, restaurantId } = req.query; // YYYY-MM-DD
  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }
  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant ID is required' });
  }

  try {
    const reservations = await Reservation.find({ 
      date, 
      restaurant: restaurantId, 
      status: { $ne: 'cancelled' } 
    });
    
    // Define standard hourly slots
    const slots = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
    
    // Dynamically query available tables for this restaurant
    const totalTablesCount = await Table.countDocuments({ restaurant: restaurantId, isAvailable: true });
    const totalTablesLimit = totalTablesCount || 6; // Maximum tables available per slot (fallback to 6)

    const busyHoursData = slots.map((slot) => {
      // Find reservations matching this slot
      const count = reservations.filter((r) => r.timeSlot === slot).length;
      const occupancyPercentage = Math.round((count / totalTablesLimit) * 100);
      
      return {
        time: slot,
        reservationsCount: count,
        occupancy: Math.min(occupancyPercentage, 100),
      };
    });

    res.json(busyHoursData);
  } catch (error) {
    console.error('Fetch busy hours error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new reservation & menu pre-order
export const createReservation = async (req, res) => {
  const {
    guestName,
    guestEmail,
    guestsCount,
    date,
    timeSlot,
    tableNumber,
    menuItems, // Array of { menuItemId, quantity }
    paymentCardLast4,
    restaurantId,
    discountCode,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    isSimulatedPayment,
  } = req.body;

  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant ID is required' });
  }

  try {
    // 1. Check if table is already booked for this date and time slot in this restaurant
    const tableTaken = await Reservation.findOne({
      date,
      timeSlot,
      tableNumber,
      restaurant: restaurantId,
      status: { $ne: 'cancelled' },
    });

    if (tableTaken) {
      return res.status(400).json({
        message: `Table number ${tableNumber} is already reserved for ${timeSlot} on ${date}. Please select another table.`,
      });
    }

    // 2. Fetch menu item prices and verify
    let totalFoodAmount = 0;
    let cheapestDessertPrice = Infinity;
    const populatedMenuItems = [];

    if (menuItems && menuItems.length > 0) {
      for (const item of menuItems) {
        const menuItemDoc = await MenuItem.findById(item.menuItemId);
        if (!menuItemDoc) {
          return res.status(404).json({ message: `Menu item with ID ${item.menuItemId} not found` });
        }
        const itemTotal = menuItemDoc.price * item.quantity;
        totalFoodAmount += itemTotal;

        if (menuItemDoc.category === 'desserts') {
          if (menuItemDoc.price < cheapestDessertPrice) {
            cheapestDessertPrice = menuItemDoc.price;
          }
        }

        populatedMenuItems.push({
          menuItem: item.menuItemId,
          quantity: item.quantity,
          priceAtBooking: menuItemDoc.price,
        });
      }
    }

    // 3. Process promo code discounts
    let discountAmount = 0;
    const originalFoodAmount = totalFoodAmount;

    if (discountCode) {
      const code = discountCode.toUpperCase();
      if (code === 'PREORDER10') {
        discountAmount = Math.round(totalFoodAmount * 0.1 * 100) / 100;
      } else if (code === 'FREEDESSERT') {
        if (cheapestDessertPrice !== Infinity) {
          discountAmount = cheapestDessertPrice;
        } else {
          return res.status(400).json({
            message: 'The "FREEDESSERT" code requires at least one dessert in your pre-order cart.',
          });
        }
      }
    }

    const netFoodAmount = Math.max(0, totalFoodAmount - discountAmount);

    // 4. Calculate advance payment (60%)
    const advanceAmount = Math.round(netFoodAmount * 0.6 * 100) / 100;

    // 5. Payment details & validation
    let paymentDetails = {};

    if (advanceAmount > 0) {
      if (razorpayPaymentId) {
        // Razorpay Payment Flow
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        // Perform signature verification if it's not simulated and secret is set
        if (!isSimulatedPayment && keySecret && keySecret !== 'your_razorpay_key_secret_here') {
          const body = razorpayOrderId + '|' + razorpayPaymentId;
          const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body.toString())
            .digest('hex');

          if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ message: 'Payment signature verification failed. Transaction rejected.' });
          }
        }

        paymentDetails = {
          cardLast4: 'UPI',
          transactionId: razorpayPaymentId,
          paidAt: new Date(),
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        };
      } else if (paymentCardLast4) {
        // Legacy Card Fallback
        paymentDetails = {
          cardLast4: paymentCardLast4,
          transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          paidAt: new Date(),
        };
      } else {
        return res.status(400).json({ message: 'Payment confirmation details are required to complete reservation.' });
      }
    } else {
      // 0 advance amount (no food ordered)
      paymentDetails = {
        cardLast4: 'NONE',
        transactionId: 'FREE-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paidAt: new Date(),
      };
    }

    // 6. Create reservation record
    const reservation = new Reservation({
      user: req.user._id,
      restaurant: restaurantId,
      guestName,
      guestEmail,
      guestsCount,
      date,
      timeSlot,
      tableNumber: tableNumber || 1,
      menuItems: populatedMenuItems,
      totalFoodAmount: netFoodAmount,
      originalFoodAmount,
      discountCode: discountCode || '',
      discountAmount,
      advanceAmount,
      paymentStatus: advanceAmount > 0 ? 'paid' : 'pending',
      paymentDetails,
      status: 'confirmed',
      prepStatus: populatedMenuItems.length > 0 ? 'not-started' : 'not-applicable',
    });

    const savedReservation = await reservation.save();
    res.status(201).json(savedReservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current customer's reservations
export const getCustomerReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('restaurant', 'name cuisine address')
      .populate('menuItems.menuItem')
      .sort({ date: -1, timeSlot: -1 });
    res.json(reservations);
  } catch (error) {
    console.error('Fetch customer reservations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reservations - Scoped by restaurant
export const getAllReservations = async (req, res) => {
  try {
    const { date, restaurantId } = req.query;
    const filter = {};

    if (req.user.role === 'customer') {
      if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant ID is required for customers' });
      }
      filter.restaurant = restaurantId;
    } else {
      if (!req.user.restaurant) {
        return res.status(400).json({ message: 'User is not associated with any restaurant' });
      }
      filter.restaurant = req.user.restaurant;
    }

    if (date) {
      filter.date = date;
    }
    
    const reservations = await Reservation.find(filter)
      .populate('user', 'name email')
      .populate('menuItems.menuItem')
      .sort({ date: 1, timeSlot: 1 });
    res.json(reservations);
  } catch (error) {
    console.error('Fetch all reservations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update food prep status for kitchen screen
export const updatePrepStatus = async (req, res) => {
  const { id } = req.params;
  const { prepStatus } = req.body; // 'not-started', 'in-prep', 'ready'

  try {
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Scoping check
    if (!req.user.restaurant || reservation.restaurant.toString() !== req.user.restaurant.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this reservation' });
    }

    reservation.prepStatus = prepStatus;
    const updated = await reservation.save();
    res.json(updated);
  } catch (error) {
    console.error('Update prep status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Reservation dashboard stats for analytics
export const getDashboardStats = async (req, res) => {
  try {
    if (!req.user.restaurant) {
      return res.status(400).json({ message: 'User is not associated with any restaurant' });
    }

    const reservations = await Reservation.find({ 
      restaurant: req.user.restaurant,
      status: { $ne: 'cancelled' } 
    });
    
    // Total Revenue (60% advance paid is our collected revenue)
    const totalRevenue = reservations.reduce((acc, r) => acc + (r.advanceAmount || 0), 0);
    
    // Total Bookings count
    const totalBookings = reservations.length;
    
    // Count active prep items
    const pendingPrep = reservations.filter((r) => r.menuItems.length > 0 && r.prepStatus !== 'ready').length;

    // Monthly Analytics Mockup / Date distribution
    const dateDistribution = {};
    reservations.forEach((r) => {
      dateDistribution[r.date] = (dateDistribution[r.date] || 0) + 1;
    });

    const formattedDates = Object.keys(dateDistribution).map((d) => ({
      date: d,
      count: dateDistribution[d],
    })).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7); // Last 7 days

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalBookings,
      pendingPrep,
      weeklyStats: formattedDates,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new Razorpay Order for advance payment
export const createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ message: 'Amount is required and must be greater than 0' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const isSimulated = !keyId || !keySecret || keyId === 'your_razorpay_key_id_here' || keySecret === 'your_razorpay_key_secret_here';

  if (isSimulated) {
    return res.json({
      isSimulated: true,
      id: 'order_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      amount: Math.round(amount * 100),
      currency: 'INR',
    });
  }

  try {
    const Razorpay = (await import('razorpay')).default;
    const razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: 'rcpt_' + Math.random().toString(36).substr(2, 9),
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({
      isSimulated: false,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error) {
    console.error('Razorpay order creation failed, falling back to simulated:', error);
    res.json({
      isSimulated: true,
      id: 'order_fallback_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      amount: Math.round(amount * 100),
      currency: 'INR',
    });
  }
};
