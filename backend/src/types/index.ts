import { Request } from 'express';
import { Role } from '@prisma/client';

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// Authenticated Request
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Alias for middleware compatibility
export interface RequestWithUser extends Request {
  user?: JwtPayload;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth DTOs
export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
  };
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Socket Events
export interface ServerToClientEvents {
  notification: (data: { message: string; type: string }) => void;
  userConnected: (data: { userId: string }) => void;
  userDisconnected: (data: { userId: string }) => void;
  error: (data: { message: string }) => void;
  // Queue events
  queueUpdated: (data: QueueUpdatePayload) => void;
  userCalled: (data: UserCalledPayload) => void;
  positionUpdate: (data: PositionUpdatePayload) => void;
  queueDeleted: (data: QueueDeletedPayload) => void;
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (data: { roomId: string; message: string }) => void;
  // Queue events
  joinQueueRoom: (queueId: string) => void;
  leaveQueueRoom: (queueId: string) => void;
  joinUserRoom: (userId: string) => void;
}

// Queue Socket Payloads
export interface QueueUpdatePayload {
  queue: unknown; // Full queue object with entries
}

export interface UserCalledPayload {
  entryId: string;
  queueId: string;
  position: number;
}

export interface PositionUpdatePayload {
  entryId: string;
  queueId: string;
  queueName: string;
  restaurantName: string;
  newPosition: number;
  message: string;
}

export interface QueueDeletedPayload {
  queueId: string;
  queueName: string;
  restaurantName: string;
  message: string;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  email: string;
  role: Role;
}

// Queue Types
export interface CreateQueueInput {
  name: string;
}

export interface JoinQueueInput {
  name: string;
  phone?: string;
  groupSize: number;
}

export interface CallNextInput {
  queueId: string;
}

export interface QueueIdParam {
  queueId: string;
}

export interface QueueEntryIdParam {
  entryId: string;
}

