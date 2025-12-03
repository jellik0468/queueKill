import api from './axios';
import type { Queue, QueueEntry } from '@/store/queueStore';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface JoinQueueInput {
  name: string;
  phone?: string;
  groupSize: number;
}

interface CreateQueueInput {
  name: string;
}

export interface ActiveQueueEntry extends QueueEntry {
  positionAhead: number;
  estimatedWait: number;
  queue: Queue & {
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
  };
}

export const queuesApi = {
  /**
   * Get user's active queue entries
   */
  getMyEntries: async (): Promise<ApiResponse<ActiveQueueEntry[]>> => {
    const response = await api.get<ApiResponse<ActiveQueueEntry[]>>('/queues/my-entries');
    return response.data;
  },

  /**
   * Get owner's queues
   */
  getMyQueues: async (): Promise<ApiResponse<Queue[]>> => {
    const response = await api.get<ApiResponse<Queue[]>>('/queues/my-queues');
    return response.data;
  },

  /**
   * Get queue by ID
   */
  getQueue: async (queueId: string): Promise<ApiResponse<Queue>> => {
    const response = await api.get<ApiResponse<Queue>>(`/queues/${queueId}`);
    return response.data;
  },

  /**
   * Join a queue
   */
  joinQueue: async (queueId: string, data: JoinQueueInput): Promise<ApiResponse<QueueEntry>> => {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queues/${queueId}/join`, data);
    return response.data;
  },

  /**
   * Leave a queue
   */
  leaveQueue: async (entryId: string): Promise<ApiResponse<QueueEntry>> => {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queues/entry/${entryId}/leave`);
    return response.data;
  },

  /**
   * Call next in queue (owner only)
   */
  callNext: async (queueId: string): Promise<ApiResponse<QueueEntry | null>> => {
    const response = await api.post<ApiResponse<QueueEntry | null>>(`/queues/${queueId}/call-next`);
    return response.data;
  },

  /**
   * Complete/confirm entry (owner only - marks as served)
   */
  completeEntry: async (entryId: string): Promise<ApiResponse<QueueEntry>> => {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queues/entry/${entryId}/complete`);
    return response.data;
  },

  /**
   * Remove entry (owner only - no-show or manual removal)
   */
  removeEntry: async (entryId: string): Promise<ApiResponse<QueueEntry>> => {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queues/entry/${entryId}/remove`);
    return response.data;
  },

  /**
   * Create a new queue (owner only)
   */
  createQueue: async (data: CreateQueueInput): Promise<ApiResponse<Queue>> => {
    const response = await api.post<ApiResponse<Queue>>('/queues', data);
    return response.data;
  },

  /**
   * Delete a queue (owner only)
   */
  deleteQueue: async (queueId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/queues/${queueId}`);
    return response.data;
  },

  /**
   * Get QR code URL for a queue
   */
  getQueueQRCodeUrl: (queueId: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return `${baseUrl}/queues/${queueId}/qrcode`;
  },
};

export default queuesApi;
