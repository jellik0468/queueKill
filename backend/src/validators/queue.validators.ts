import { z } from 'zod';

// Create Queue Schema
export const createQueueSchema = z.object({
  name: z.string().min(1, 'Queue name is required'),
});

// Join Queue Schema
export const joinQueueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  groupSize: z.number().min(1, 'Group size must be at least 1'),
});

// Queue ID Param Schema
export const queueIdParamSchema = z.object({
  queueId: z.string().cuid('Invalid queue ID'),
});

// Entry ID Param Schema
export const entryIdParamSchema = z.object({
  entryId: z.string().cuid('Invalid entry ID'),
});

// Inferred Types
export type CreateQueueInput = z.infer<typeof createQueueSchema>;
export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
export type QueueIdParam = z.infer<typeof queueIdParamSchema>;
export type EntryIdParam = z.infer<typeof entryIdParamSchema>;

