import { Response, NextFunction } from 'express';
import { AuthRequest, CreateQueueInput, JoinQueueInput } from '../types';
import * as queueService from '../services/queue.service';
import { 
  broadcastQueueUpdate, 
  notifyUserCalled, 
  notifyPositionUpdate,
  notifyQueueDeleted,
  notifyUserQueueDeleted
} from '../sockets';

/**
 * Helper to send position notifications (position 1 and 3)
 */
async function sendPositionNotifications(queueId: string): Promise<void> {
  try {
    const entriesToNotify = await queueService.getEntriesForPositionNotification(queueId);
    
    for (const { entry, newPosition } of entriesToNotify) {
      if (entry.userId) {
        let message = '';
        if (newPosition === 1) {
          message = `🔔 You're next! Get ready at ${entry.queue.restaurant.name}`;
        } else if (newPosition === 3) {
          message = `⏳ Almost there! You're #3 in line at ${entry.queue.restaurant.name}`;
        }
        
        notifyPositionUpdate(entry.userId, {
          entryId: entry.id,
          queueId: entry.queueId,
          queueName: entry.queue.name,
          restaurantName: entry.queue.restaurant.name,
          newPosition,
          message,
        });
      }
    }
  } catch (error) {
    console.error('Failed to send position notifications:', error);
  }
}

/**
 * Get all active queue entries for the authenticated user
 * GET /api/queues/my-entries
 */
export async function getMyEntriesHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const entries = await queueService.getUserActiveEntries(req.user.userId);

    res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all queues for the authenticated owner
 * GET /api/queues/my-queues
 */
export async function getMyQueuesHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const queues = await queueService.getQueuesByOwnerId(req.user.userId);

    res.status(200).json({
      success: true,
      data: queues,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new queue
 * POST /api/queues
 */
export async function createQueueHandler(
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
    const restaurant = await queueService.getRestaurantByOwnerId(req.user.userId);

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found. Please create a restaurant first.' });
      return;
    }

    const data = req.body as CreateQueueInput;
    const queue = await queueService.createQueue(restaurant.id, data);

    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      data: queue,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get queue info
 * GET /api/queues/:queueId
 */
export async function getQueueInfoHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { queueId } = req.params;

    const queue = await queueService.getQueueById(queueId);

    res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Join a queue
 * POST /api/queues/:queueId/join
 */
export async function joinQueueHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { queueId } = req.params;
    const userId = req.user?.userId || null;
    const data = req.body as JoinQueueInput;

    const entry = await queueService.joinQueue(queueId, userId, data);

    // Broadcast queue update to all watchers
    const updatedQueue = await queueService.getQueueById(queueId);
    broadcastQueueUpdate(queueId, updatedQueue);

    res.status(201).json({
      success: true,
      message: 'Successfully joined the queue',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Leave a queue
 * POST /api/queues/entry/:entryId/leave
 */
export async function leaveQueueHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { entryId } = req.params;
    const userId = req.user.userId;

    const entry = await queueService.leaveQueue(entryId, userId);

    // Broadcast queue update to all watchers
    const updatedQueue = await queueService.getQueueById(entry.queueId);
    broadcastQueueUpdate(entry.queueId, updatedQueue);

    res.status(200).json({
      success: true,
      message: 'Successfully left the queue',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Call next person in queue
 * POST /api/queues/:queueId/call-next
 */
export async function callNextHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { queueId } = req.params;

    // Verify owner owns this queue
    await queueService.verifyQueueOwnership(queueId, req.user.userId);

    const entry = await queueService.callNext(queueId);

    if (!entry) {
      res.status(200).json({
        success: true,
        message: 'No one waiting in queue',
        data: null,
      });
      return;
    }

    // Notify the called user if they have a userId
    if (entry.userId) {
      notifyUserCalled(entry.userId, {
        entryId: entry.id,
        queueId,
        position: entry.position,
      });
    }

    // Broadcast queue update to all watchers
    const updatedQueue = await queueService.getQueueById(queueId);
    broadcastQueueUpdate(queueId, updatedQueue);

    // Send position notifications (position 1 and 3)
    await sendPositionNotifications(queueId);

    res.status(200).json({
      success: true,
      message: 'Called next person',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete/confirm a queue entry (mark as served)
 * POST /api/queues/entry/:entryId/complete
 */
export async function completeEntryHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { entryId } = req.params;

    // Get entry to find queue and verify ownership
    const entry = await queueService.completeEntry(entryId);

    // Verify owner owns this queue
    await queueService.verifyQueueOwnership(entry.queueId, req.user.userId);

    // Broadcast queue update to all watchers
    const updatedQueue = await queueService.getQueueById(entry.queueId);
    broadcastQueueUpdate(entry.queueId, updatedQueue);

    // Send position notifications (position 1 and 3)
    await sendPositionNotifications(entry.queueId);

    res.status(200).json({
      success: true,
      message: 'Entry completed successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove/cancel a queue entry by owner
 * POST /api/queues/entry/:entryId/remove
 */
export async function removeEntryHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { entryId } = req.params;

    // Remove the entry
    const entry = await queueService.removeEntry(entryId);

    // Verify owner owns this queue
    await queueService.verifyQueueOwnership(entry.queueId, req.user.userId);

    // Broadcast queue update to all watchers
    const updatedQueue = await queueService.getQueueById(entry.queueId);
    broadcastQueueUpdate(entry.queueId, updatedQueue);

    // Send position notifications (position 1 and 3)
    await sendPositionNotifications(entry.queueId);

    res.status(200).json({
      success: true,
      message: 'Entry removed successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a queue
 * DELETE /api/queues/:queueId
 */
export async function deleteQueueHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { queueId } = req.params;

    // Delete queue and get info for notifications
    const { queue, activeUserIds } = await queueService.deleteQueue(queueId, req.user.userId);

    // Notify all users in the queue room
    notifyQueueDeleted(queueId, {
      queueId,
      queueName: queue.name,
      restaurantName: queue.restaurant.name,
      message: `The queue "${queue.name}" at ${queue.restaurant.name} has been closed.`,
    });

    // Also notify each user directly in their personal room
    for (const userId of activeUserIds) {
      notifyUserQueueDeleted(userId, {
        queueId,
        queueName: queue.name,
        restaurantName: queue.restaurant.name,
        message: `The queue "${queue.name}" at ${queue.restaurant.name} has been closed. You have been removed from the queue.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Queue deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate QR code for queue
 * GET /api/queues/:queueId/qrcode
 */
export async function generateQueueQRCodeHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { queueId } = req.params;

    // Get queue to find restaurant ID
    const queue = await queueService.getQueueById(queueId);

    const buffer = await queueService.generateQueueQRCode(queueId, queue.restaurantId);

    // Send as PNG image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="queue-${queueId}.png"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}
