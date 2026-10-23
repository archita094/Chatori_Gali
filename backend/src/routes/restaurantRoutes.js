import express from 'express';
import { getRestaurants, getRestaurantById } from '../controllers/restaurantController.js';

const router = express.Router();

router.route('/')
  .get(getRestaurants);

router.route('/:id')
  .get(getRestaurantById);

export default router;
