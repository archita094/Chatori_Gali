import express from 'express';
import {
  getBusyHours,
  createReservation,
  getCustomerReservations,
  getAllReservations,
  updatePrepStatus,
  getDashboardStats,
  createRazorpayOrder,
} from '../controllers/reservationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/busy-hours', getBusyHours);
router.post('/', protect, createReservation);
router.post('/razorpay-order', protect, createRazorpayOrder);
router.get('/my-bookings', protect, getCustomerReservations);
router.get('/all', protect, authorize('admin', 'staff', 'customer'), getAllReservations);
router.put('/:id/prep', protect, authorize('admin', 'staff'), updatePrepStatus);
router.get('/dashboard-stats', protect, authorize('admin'), getDashboardStats);

export default router;
