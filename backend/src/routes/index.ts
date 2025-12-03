import { Router } from 'express';
import authRoutes from './auth.routes';

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

// Add more routes here as your application grows
// router.use('/users', userRoutes);
// router.use('/queues', queueRoutes);

export default router;

