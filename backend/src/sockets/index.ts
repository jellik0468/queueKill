import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';

let io: Server | null = null;

/**
 * Initialize Socket.IO server
 */
export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: [
        config.app.frontendUrl,
        config.cors.origin,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log('[socket.io] Server initialized with CORS:', config.app.frontendUrl);

  io.on('connection', (socket: Socket) => {
    console.log('[socket] Client connected:', socket.id);

    // Join a queue room for real-time updates
    socket.on('joinQueueRoom', (queueId: string) => {
      const room = `queue-${queueId}`;
      void socket.join(room);
      console.log(`[socket] ${socket.id} joined room: ${room}`);
      
      // Log current rooms
      const rooms = Array.from(socket.rooms);
      console.log(`[socket] ${socket.id} is now in rooms:`, rooms);
    });

    // Leave a queue room
    socket.on('leaveQueueRoom', (queueId: string) => {
      const room = `queue-${queueId}`;
      void socket.leave(room);
      console.log(`[socket] ${socket.id} left room: ${room}`);
    });

    // Join user's personal room for notifications
    socket.on('joinUserRoom', (userId: string) => {
      const room = `user-${userId}`;
      void socket.join(room);
      console.log(`[socket] ${socket.id} joined user room: ${room}`);
    });

    // Leave user's personal room
    socket.on('leaveUserRoom', (userId: string) => {
      const room = `user-${userId}`;
      void socket.leave(room);
      console.log(`[socket] ${socket.id} left user room: ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('[socket] Client disconnected:', socket.id, 'Reason:', reason);
    });
    
    socket.on('error', (error) => {
      console.error('[socket] Error:', error);
    });
  });

  return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

/**
 * Broadcast queue update to all users watching a queue
 */
export function broadcastQueueUpdate(queueId: string, queue: unknown): void {
  const room = `queue-${queueId}`;
  const sockets = getIO().sockets.adapter.rooms.get(room);
  console.log(`[socket] Broadcasting queueUpdated to room ${room} (${sockets?.size || 0} clients)`);
  getIO().to(room).emit('queueUpdated', { queue });
}

/**
 * Notify a specific user that they have been called
 */
export function notifyUserCalled(
  userId: string,
  payload: { entryId: string; queueId: string; position: number }
): void {
  const room = `user-${userId}`;
  const sockets = getIO().sockets.adapter.rooms.get(room);
  console.log(`[socket] Notifying userCalled to room ${room} (${sockets?.size || 0} clients)`);
  getIO().to(room).emit('userCalled', payload);
}

/**
 * Notify a user about their position update (approaching front of queue)
 */
export function notifyPositionUpdate(
  userId: string,
  payload: {
    entryId: string;
    queueId: string;
    queueName: string;
    restaurantName: string;
    newPosition: number;
    message: string;
  }
): void {
  const room = `user-${userId}`;
  const sockets = getIO().sockets.adapter.rooms.get(room);
  console.log(`[socket] Notifying positionUpdate to room ${room} (${sockets?.size || 0} clients)`);
  getIO().to(room).emit('positionUpdate', payload);
}

/**
 * Notify users in a queue that it has been deleted
 */
export function notifyQueueDeleted(
  queueId: string,
  payload: {
    queueId: string;
    queueName: string;
    restaurantName: string;
    message: string;
  }
): void {
  const room = `queue-${queueId}`;
  const sockets = getIO().sockets.adapter.rooms.get(room);
  console.log(`[socket] Notifying queueDeleted to room ${room} (${sockets?.size || 0} clients)`);
  getIO().to(room).emit('queueDeleted', payload);
}

/**
 * Notify a specific user that the queue they were in has been deleted
 */
export function notifyUserQueueDeleted(
  userId: string,
  payload: {
    queueId: string;
    queueName: string;
    restaurantName: string;
    message: string;
  }
): void {
  const room = `user-${userId}`;
  const sockets = getIO().sockets.adapter.rooms.get(room);
  console.log(`[socket] Notifying queueDeleted to user room ${room} (${sockets?.size || 0} clients)`);
  getIO().to(room).emit('queueDeleted', payload);
}

export default {
  initSocket,
  getIO,
  broadcastQueueUpdate,
  notifyUserCalled,
  notifyPositionUpdate,
  notifyQueueDeleted,
  notifyUserQueueDeleted,
};
