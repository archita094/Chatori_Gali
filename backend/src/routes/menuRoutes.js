import express from 'express';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getDietaryAssistantRecommendations,
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dietary-assistant', getDietaryAssistantRecommendations);

router.route('/')
  .get(getMenuItems)
  .post(protect, authorize('admin'), createMenuItem);

router.route('/:id')
  .put(protect, authorize('admin', 'staff'), updateMenuItem)
  .delete(protect, authorize('admin'), deleteMenuItem);

export default router;
