import { Router } from 'express';
import {
  registerCustomerHandler,
  registerOwnerHandler,
  loginHandler,
  meHandler,
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  registerCustomerSchema,
  registerOwnerSchema,
  loginSchema,
} from '../validators/auth.validators';

const router = Router();

// Public routes
router.post('/register-customer', validate(registerCustomerSchema), registerCustomerHandler);
router.post('/register-owner', validate(registerOwnerSchema), registerOwnerHandler);
router.post('/login', validate(loginSchema), loginHandler);

// Protected routes
router.get('/me', authenticate, meHandler);

// Test routes for role-based authorization
router.get('/test-owner', authenticate, authorize('OWNER'), (_req, res) => {
  res.json({ success: true, message: 'You are an authenticated OWNER!' });
});

router.get('/test-customer', authenticate, authorize('CUSTOMER'), (_req, res) => {
  res.json({ success: true, message: 'You are an authenticated CUSTOMER!' });
});

export default router;
