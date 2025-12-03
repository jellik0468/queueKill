import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';
import { verifyToken } from '../utils/jwt';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../types';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: config.socket.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    }
  );

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      socket.data.role = payload.role;

      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: TypedSocket) => {
    console.info(`User connected: ${socket.data.userId}`);

    // Join user's personal room
    void socket.join(`user:${socket.data.userId}`);

    // Notify others about connection
    socket.broadcast.emit('userConnected', { userId: socket.data.userId });

    // Handle room joining
    socket.on('joinRoom', (roomId: string) => {
      void socket.join(roomId);
      console.info(`User ${socket.data.userId} joined room: ${roomId}`);
    });

    // Handle room leaving
    socket.on('leaveRoom', (roomId: string) => {
      void socket.leave(roomId);
      console.info(`User ${socket.data.userId} left room: ${roomId}`);
    });

    // Handle messages
    socket.on('sendMessage', (data: { roomId: string; message: string }) => {
      io.to(data.roomId).emit('notification', {
        message: data.message,
        type: 'message',
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.info(`User disconnected: ${socket.data.userId}, reason: ${reason}`);
      socket.broadcast.emit('userDisconnected', { userId: socket.data.userId });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.data.userId}:`, error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Emit to a specific user
 */
export function emitToUser(userId: string, event: keyof ServerToClientEvents, data: unknown): void {
  io.to(`user:${userId}`).emit(event as 'notification', data as { message: string; type: string });
}

/**
 * Emit to a room
 */
export function emitToRoom(roomId: string, event: keyof ServerToClientEvents, data: unknown): void {
  io.to(roomId).emit(event as 'notification', data as { message: string; type: string });
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(event: keyof ServerToClientEvents, data: unknown): void {
  io.emit(event as 'notification', data as { message: string; type: string });
}

export default { initializeSocket, getIO, emitToUser, emitToRoom, broadcast };

