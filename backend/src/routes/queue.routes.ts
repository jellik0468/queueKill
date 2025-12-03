import { Router } from 'express';
import {
  createQueueHandler,
  getMyEntriesHandler,
  getMyQueuesHandler,
  getQueueInfoHandler,
  joinQueueHandler,
  leaveQueueHandler,
  callNextHandler,
  completeEntryHandler,
  removeEntryHandler,
  deleteQueueHandler,
  generateQueueQRCodeHandler,
} from '../controllers/queue.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createQueueSchema, joinQueueSchema } from '../validators/queue.validators';

const router = Router();

// Get user's active queue entries (must be before /:queueId to avoid conflict)
router.get('/my-entries', authenticate, getMyEntriesHandler);

// Get owner's queues (must be before /:queueId to avoid conflict)
router.get('/my-queues', authenticate, authorize('OWNER'), getMyQueuesHandler);

// Create a queue (owner only)
router.post('/', authenticate, authorize('OWNER'), validate(createQueueSchema), createQueueHandler);

// Get queue info (public)
router.get('/:queueId', getQueueInfoHandler);

// Join a queue (optional auth - can be anonymous or logged in customer)
router.post('/:queueId/join', optionalAuth, validate(joinQueueSchema), joinQueueHandler);

// Leave a queue (authenticated customer only)
router.post('/entry/:entryId/leave', authenticate, authorize('CUSTOMER'), leaveQueueHandler);

// Complete/confirm entry (owner only - marks as served)
router.post('/entry/:entryId/complete', authenticate, authorize('OWNER'), completeEntryHandler);

// Remove entry (owner only - no-show or manual removal)
router.post('/entry/:entryId/remove', authenticate, authorize('OWNER'), removeEntryHandler);

// Call next in queue (owner only)
router.post('/:queueId/call-next', authenticate, authorize('OWNER'), callNextHandler);

// Delete a queue (owner only)
router.delete('/:queueId', authenticate, authorize('OWNER'), deleteQueueHandler);

// Generate QR code for queue (public)
router.get('/:queueId/qrcode', generateQueueQRCodeHandler);

export default router;

