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
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (data: { roomId: string; message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  email: string;
  role: Role;
}

