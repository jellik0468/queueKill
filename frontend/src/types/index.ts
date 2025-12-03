// Re-export types from stores for convenience
export type { User, Role } from '@/store/authStore';
export type { Queue, QueueEntry, Restaurant, QueueEntryStatus } from '@/store/queueStore';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Form input types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterCustomerInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface RegisterOwnerInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  restaurantName: string;
  restaurantAddress: string;
}

export interface JoinQueueInput {
  name: string;
  phone?: string;
  groupSize: number;
}

export interface CreateQueueInput {
  name: string;
}
