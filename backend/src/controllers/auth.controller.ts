import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import {
  RegisterCustomerInput,
  RegisterOwnerInput,
  LoginInput,
} from '../validators/auth.validators';

/**
 * Register a new customer
 * POST /api/auth/register-customer
 */
export async function registerCustomerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input: RegisterCustomerInput = req.body;
    const result = await authService.registerCustomer(input);

    res.status(201).json({
      success: true,
      message: 'Customer registration successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new owner
 * POST /api/auth/register-owner
 */
export async function registerOwnerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input: RegisterOwnerInput = req.body;
    const result = await authService.registerOwner(input);

    res.status(201).json({
      success: true,
      message: 'Owner registration successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input: LoginInput = req.body;
    const result = await authService.login(input);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function meHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await authService.getCurrentUser(req.user.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
