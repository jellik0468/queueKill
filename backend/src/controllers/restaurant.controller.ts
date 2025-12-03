import { Request, Response, NextFunction } from 'express';
import * as restaurantService from '../services/restaurant.service';
import { AuthRequest } from '../types';

/**
 * Search restaurants
 * GET /api/restaurants/search?q=query
 */
export async function searchRestaurantsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;

    const restaurants = await restaurantService.searchRestaurants(query, limit);

    res.status(200).json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all restaurants
 * GET /api/restaurants
 */
export async function getAllRestaurantsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const restaurants = await restaurantService.getAllRestaurants(limit);

    res.status(200).json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get restaurant by ID
 * GET /api/restaurants/:restaurantId
 */
export async function getRestaurantByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { restaurantId } = req.params;

    const restaurant = await restaurantService.getRestaurantById(restaurantId);

    if (!restaurant) {
      res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get owner's restaurant
 * GET /api/restaurants/my-restaurant
 */
export async function getMyRestaurantHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const restaurant = await restaurantService.getRestaurantByOwnerId(req.user.userId);

    if (!restaurant) {
      res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update owner's restaurant
 * PATCH /api/restaurants/my-restaurant
 */
export async function updateMyRestaurantHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Get owner's restaurant
    const restaurant = await restaurantService.getRestaurantByOwnerId(req.user.userId);

    if (!restaurant) {
      res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
      return;
    }

    const { name, address, type, description, longDescription, menuText } = req.body;

    const updated = await restaurantService.updateRestaurant(restaurant.id, req.user.userId, {
      name,
      address,
      type,
      description,
      longDescription,
      menuText,
    });

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

