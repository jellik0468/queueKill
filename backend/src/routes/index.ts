import { Router } from 'express';
import authRoutes from './auth.routes';
import queueRoutes from './queue.routes';
import restaurantRoutes from './restaurant.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/queues', queueRoutes);
router.use('/restaurants', restaurantRoutes);

export default router;

