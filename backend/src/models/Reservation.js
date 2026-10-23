import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  guestName: {
    type: String,
    required: true,
  },
  guestEmail: {
    type: String,
    required: true,
  },
  guestsCount: {
    type: Number,
    required: true,
    min: 1,
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
  },
  timeSlot: {
    type: String, // format: HH:MM (e.g. "18:00", "19:30")
    required: true,
  },
  tableNumber: {
    type: Number,
    required: true,
  },
  menuItems: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      priceAtBooking: {
        type: Number,
        required: true,
      },
    },
  ],
  totalFoodAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  originalFoodAmount: {
    type: Number,
    default: 0,
  },
  discountCode: {
    type: String,
    default: '',
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  advanceAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentDetails: {
    cardLast4: String,
    transactionId: String,
    paidAt: Date,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'confirmed', // since they paid advance, auto-confirmed
  },
  prepStatus: {
    type: String,
    enum: ['not-started', 'in-prep', 'ready'],
    default: 'not-started',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;
