import prisma from '../lib/prisma';

// Helper to transform restaurant data with proper waiting counts
async function getRestaurantsWithCounts(whereClause: object, limit: number, orderBy: object) {
  const restaurants = await prisma.restaurant.findMany({
    where: whereClause,
    include: {
      queues: {
        where: { isActive: true },
        include: {
          entries: {
            where: { status: 'WAITING' },
            select: { id: true },
          },
        },
      },
    },
    take: limit,
    orderBy,
  });

  // Transform to include waiting count
  return restaurants.map((restaurant) => ({
    ...restaurant,
    queues: restaurant.queues.map((queue) => ({
      id: queue.id,
      name: queue.name,
      isActive: queue.isActive,
      waitingCount: queue.entries.length,
    })),
  }));
}

/**
 * Search restaurants by name or address
 */
export async function searchRestaurants(query: string, limit: number = 20) {
  return getRestaurantsWithCounts(
    {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ],
    },
    limit,
    { name: 'asc' }
  );
}

/**
 * Get all restaurants (for browsing)
 */
export async function getAllRestaurants(limit: number = 50) {
  return getRestaurantsWithCounts({}, limit, { createdAt: 'desc' });
}

/**
 * Get restaurant by ID with active queues
 */
export async function getRestaurantById(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      queues: {
        where: { isActive: true },
        include: {
          entries: {
            where: { status: 'WAITING' },
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });

  if (!restaurant) return null;

  // Transform to include waiting count
  return {
    ...restaurant,
    queues: restaurant.queues.map((queue) => ({
      ...queue,
      waitingCount: queue.entries.length,
    })),
  };
}

/**
 * Update restaurant details (owner only)
 */
export async function updateRestaurant(
  restaurantId: string,
  ownerId: string,
  data: {
    name?: string;
    address?: string;
    type?: string;
    description?: string;
    longDescription?: string;
    menuText?: string;
  }
) {
  // Verify ownership
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  if (restaurant.ownerId !== ownerId) {
    throw new Error('Unauthorized: You do not own this restaurant');
  }

  // Update restaurant
  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data,
  });

  return updated;
}

/**
 * Get restaurant by owner ID
 */
export async function getRestaurantByOwnerId(ownerId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId },
  });

  return restaurant;
}

