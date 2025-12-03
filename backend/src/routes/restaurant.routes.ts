import { Router } from 'express';
import {
  searchRestaurantsHandler,
  getAllRestaurantsHandler,
  getRestaurantByIdHandler,
  getMyRestaurantHandler,
  updateMyRestaurantHandler,
} from '../controllers/restaurant.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Owner's restaurant routes (must be before /:restaurantId)
router.get('/my-restaurant', authenticate, authorize('OWNER'), getMyRestaurantHandler);
router.patch('/my-restaurant', authenticate, authorize('OWNER'), updateMyRestaurantHandler);

// Search restaurants (public)
router.get('/search', searchRestaurantsHandler);

// Get all restaurants (public)
router.get('/', getAllRestaurantsHandler);

// Get restaurant by ID (public)
router.get('/:restaurantId', getRestaurantByIdHandler);

export default router;

