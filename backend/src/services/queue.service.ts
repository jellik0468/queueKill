import QRCode from 'qrcode';
import prisma from '../lib/prisma';
import { config } from '../config';
import { CreateQueueInput, JoinQueueInput } from '../types';

/**
 * Create a new queue for a restaurant
 */
export async function createQueue(restaurantId: string, data: CreateQueueInput) {
  // Ensure restaurant exists
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  // Create queue
  const queue = await prisma.queue.create({
    data: {
      name: data.name,
      restaurantId,
    },
  });

  return queue;
}

/**
 * Get queue by ID with restaurant and entries
 */
export async function getQueueById(queueId: string) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      restaurant: true,
      entries: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!queue) {
    throw new Error('Queue not found');
  }

  return queue;
}

/**
 * Check if user is already in a queue (waiting or called status)
 */
export async function getUserActiveEntry(queueId: string, userId: string) {
  const entry = await prisma.queueEntry.findFirst({
    where: {
      queueId,
      userId,
      status: { in: ['WAITING', 'CALLED'] },
    },
  });
  return entry;
}

/**
 * Join a queue (customer or anonymous)
 */
export async function joinQueue(queueId: string, userId: string | null, data: JoinQueueInput) {
  // Load queue with entries
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      entries: true,
    },
  });

  if (!queue) {
    throw new Error('Queue not found');
  }

  if (!queue.isActive) {
    throw new Error('Queue is not active');
  }

  // Check if authenticated user is already in this queue
  if (userId) {
    const existingEntry = await getUserActiveEntry(queueId, userId);
    if (existingEntry) {
      throw new Error('You are already in this queue');
    }
  }

  // Determine next position
  const nextPosition =
    queue.entries.length === 0
      ? 1
      : Math.max(...queue.entries.map((e) => e.position)) + 1;

  // Create queue entry
  const entry = await prisma.queueEntry.create({
    data: {
      queueId,
      userId,
      name: data.name,
      phone: data.phone,
      groupSize: data.groupSize,
      position: nextPosition,
      status: 'WAITING',
    },
  });

  return entry;
}

/**
 * Leave a queue (cancel entry)
 */
export async function leaveQueue(entryId: string, userId: string) {
  // Find entry
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    throw new Error('Queue entry not found');
  }

  // Validate ownership - only the user who created the entry can cancel it
  if (entry.userId !== userId) {
    throw new Error('Unauthorized: You can only cancel your own queue entry');
  }

  // Update entry status to CANCELLED
  const updatedEntry = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  return updatedEntry;
}

/**
 * Call next person in queue (owner action)
 */
export async function callNext(queueId: string) {
  // Find next waiting entry
  const nextEntry = await prisma.queueEntry.findFirst({
    where: {
      queueId,
      status: 'WAITING',
    },
    orderBy: { position: 'asc' },
  });

  if (!nextEntry) {
    return null; // No one waiting
  }

  // Update status to CALLED
  const calledEntry = await prisma.queueEntry.update({
    where: { id: nextEntry.id },
    data: {
      status: 'CALLED',
      calledAt: new Date(),
    },
  });

  return calledEntry;
}

/**
 * Complete/confirm a queue entry (owner action - marks as served)
 */
export async function completeEntry(entryId: string) {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    throw new Error('Queue entry not found');
  }

  if (entry.status === 'COMPLETED') {
    throw new Error('Entry is already completed');
  }

  if (entry.status === 'CANCELLED') {
    throw new Error('Cannot complete a cancelled entry');
  }

  const updatedEntry = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  return updatedEntry;
}

/**
 * Remove/cancel a queue entry by owner (no-show or manual removal)
 */
export async function removeEntry(entryId: string) {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    throw new Error('Queue entry not found');
  }

  if (entry.status === 'COMPLETED' || entry.status === 'CANCELLED') {
    throw new Error('Entry is already completed or cancelled');
  }

  const updatedEntry = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  return updatedEntry;
}

/**
 * Generate QR code for queue
 */
export async function generateQueueQRCode(queueId: string, restaurantId: string) {
  // Construct URL for the queue join page
  const url = `${config.app.frontendUrl}/restaurant/${restaurantId}/queue/${queueId}`;

  // Generate PNG buffer
  const buffer = await QRCode.toBuffer(url, {
    type: 'png',
    margin: 1,
    width: 300,
  });

  return buffer;
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

/**
 * Get all queues for an owner's restaurant
 */
export async function getQueuesByOwnerId(ownerId: string) {
  // First get the restaurant
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId },
  });

  if (!restaurant) {
    return [];
  }

  // Get all queues for this restaurant with entries
  const queues = await prisma.queue.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      restaurant: true,
      entries: {
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return queues;
}

/**
 * Get all active queue entries for a user (WAITING or CALLED)
 */
export async function getUserActiveEntries(userId: string) {
  const entries = await prisma.queueEntry.findMany({
    where: {
      userId,
      status: { in: ['WAITING', 'CALLED'] },
    },
    include: {
      queue: {
        include: {
          restaurant: true,
          entries: {
            where: { status: 'WAITING' },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform to include position ahead
  return entries.map((entry) => {
    const waitingAhead = entry.queue.entries.filter(
      (e) => e.position < entry.position
    ).length;

    return {
      ...entry,
      positionAhead: waitingAhead,
      estimatedWait: waitingAhead * 5,
    };
  });
}

/**
 * Verify queue belongs to restaurant
 */
export async function verifyQueueOwnership(queueId: string, ownerId: string) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { restaurant: true },
  });

  if (!queue) {
    throw new Error('Queue not found');
  }

  if (queue.restaurant.ownerId !== ownerId) {
    throw new Error('Unauthorized: You do not own this queue');
  }

  return queue;
}

/**
 * Delete a queue (owner only)
 * Returns the queue with active entries for notification purposes
 */
export async function deleteQueue(queueId: string, ownerId: string) {
  // Verify ownership first
  const queue = await verifyQueueOwnership(queueId, ownerId);

  // Get active entries with user IDs for notifications
  const activeEntries = await prisma.queueEntry.findMany({
    where: {
      queueId,
      status: { in: ['WAITING', 'CALLED'] },
      userId: { not: null },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  // Delete all entries first (due to foreign key constraints)
  await prisma.queueEntry.deleteMany({
    where: { queueId },
  });

  // Delete the queue
  await prisma.queue.delete({
    where: { id: queueId },
  });

  return {
    queue,
    activeUserIds: activeEntries
      .filter((e) => e.userId)
      .map((e) => e.userId as string),
  };
}

/**
 * Get entries that should be notified of position change
 * Returns entries at position 1 and 3 that have user IDs
 */
export async function getEntriesForPositionNotification(queueId: string) {
  const entries = await prisma.queueEntry.findMany({
    where: {
      queueId,
      status: 'WAITING',
      userId: { not: null },
    },
    orderBy: { position: 'asc' },
    include: {
      queue: {
        include: {
          restaurant: true,
        },
      },
    },
  });

  // Get entries at position 1 and 3 (index 0 and 2)
  const result: Array<{
    entry: typeof entries[0];
    newPosition: number;
  }> = [];

  if (entries[0]) {
    result.push({ entry: entries[0], newPosition: 1 });
  }
  if (entries[2]) {
    result.push({ entry: entries[2], newPosition: 3 });
  }

  return result;
}
