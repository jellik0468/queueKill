import { io, Socket } from 'socket.io-client';
import type { Queue } from '@/store/queueStore';

// In development, use empty string to leverage Vite's proxy (falls back to window.location.origin)
// In production, use the full socket URL from environment
const SOCKET_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_SOCKET_URL
    : '';

interface QueueUpdatePayload {
  queue: Queue;
}

interface UserCalledPayload {
  entryId: string;
  queueId: string;
  position: number;
}

interface PositionUpdatePayload {
  entryId: string;
  queueId: string;
  queueName: string;
  restaurantName: string;
  newPosition: number;
  message: string;
}

interface QueueDeletedPayload {
  queueId: string;
  queueName: string;
  restaurantName: string;
  message: string;
}

type EventCallback<T> = (data: T) => void;

class SocketClient {
  private socket: Socket | null = null;
  private isConnecting = false;
  
  // Callback stores - using Maps with unique IDs for better cleanup
  private queueUpdateCallbacks = new Map<string, EventCallback<QueueUpdatePayload>>();
  private userCalledCallbacks = new Map<string, EventCallback<UserCalledPayload>>();
  private positionUpdateCallbacks = new Map<string, EventCallback<PositionUpdatePayload>>();
  private queueDeletedCallbacks = new Map<string, EventCallback<QueueDeletedPayload>>();
  
  // Track rooms we should be in
  private queueRooms = new Set<string>();
  private userRooms = new Set<string>();
  
  // Unique ID counter for callbacks
  private callbackIdCounter = 0;

  private getNextCallbackId(): string {
    return `cb_${++this.callbackIdCounter}`;
  }

  connect(): Socket {
    // Return existing connected socket
    if (this.socket?.connected) {
      return this.socket;
    }
    
    // If already connecting, return the socket (it will connect soon)
    if (this.socket && this.isConnecting) {
      return this.socket;
    }
    
    // Clean up old socket if exists but disconnected
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = true;
    
    // Determine socket URL - use same origin for Vite proxy in dev
    const socketUrl = SOCKET_URL || window.location.origin;
    console.log('[SocketClient] Connecting to:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      path: '/socket.io/',
    });

    this.setupListeners();
    
    return this.socket;
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('[SocketClient] Connected! Socket ID:', this.socket?.id);
      
      // Re-join all rooms we should be in
      this.queueRooms.forEach((queueId) => {
        console.log('[SocketClient] Re-joining queue room:', queueId);
        this.socket?.emit('joinQueueRoom', queueId);
      });
      
      this.userRooms.forEach((userId) => {
        console.log('[SocketClient] Re-joining user room:', userId);
        this.socket?.emit('joinUserRoom', userId);
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      console.log('[SocketClient] Disconnected. Reason:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      console.error('[SocketClient] Connection error:', error.message);
    });

    // Event listeners - dispatch to all registered callbacks
    this.socket.on('queueUpdated', (data: QueueUpdatePayload) => {
      console.log('[SocketClient] Received queueUpdated for queue:', (data.queue as Queue)?.id);
      this.queueUpdateCallbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('[SocketClient] Error in queueUpdated callback:', e);
        }
      });
    });

    this.socket.on('userCalled', (data: UserCalledPayload) => {
      console.log('[SocketClient] Received userCalled:', data);
      this.userCalledCallbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('[SocketClient] Error in userCalled callback:', e);
        }
      });
    });

    this.socket.on('positionUpdate', (data: PositionUpdatePayload) => {
      console.log('[SocketClient] Received positionUpdate:', data);
      this.positionUpdateCallbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('[SocketClient] Error in positionUpdate callback:', e);
        }
      });
    });

    this.socket.on('queueDeleted', (data: QueueDeletedPayload) => {
      console.log('[SocketClient] Received queueDeleted:', data);
      this.queueDeletedCallbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('[SocketClient] Error in queueDeleted callback:', e);
        }
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.queueRooms.clear();
    this.userRooms.clear();
  }

  // Room management
  joinQueueRoom(queueId: string): void {
    if (!queueId) return;
    
    this.queueRooms.add(queueId);
    const socket = this.connect();
    
    if (socket.connected) {
      console.log('[SocketClient] Joining queue room:', queueId);
      socket.emit('joinQueueRoom', queueId);
    } else {
      console.log('[SocketClient] Queue room queued (connecting):', queueId);
    }
  }

  leaveQueueRoom(queueId: string): void {
    if (!queueId) return;
    
    this.queueRooms.delete(queueId);
    
    if (this.socket?.connected) {
      console.log('[SocketClient] Leaving queue room:', queueId);
      this.socket.emit('leaveQueueRoom', queueId);
    }
  }

  joinUserRoom(userId: string): void {
    if (!userId) return;
    
    this.userRooms.add(userId);
    const socket = this.connect();
    
    if (socket.connected) {
      console.log('[SocketClient] Joining user room:', userId);
      socket.emit('joinUserRoom', userId);
    } else {
      console.log('[SocketClient] User room queued (connecting):', userId);
    }
  }

  leaveUserRoom(userId: string): void {
    if (!userId) return;
    
    this.userRooms.delete(userId);
    
    if (this.socket?.connected) {
      console.log('[SocketClient] Leaving user room:', userId);
      this.socket.emit('leaveUserRoom', userId);
    }
  }

  // Subscription methods - return unsubscribe functions
  onQueueUpdated(callback: EventCallback<QueueUpdatePayload>): () => void {
    const id = this.getNextCallbackId();
    this.queueUpdateCallbacks.set(id, callback);
    console.log('[SocketClient] Subscribed to queueUpdated, total:', this.queueUpdateCallbacks.size);
    
    return () => {
      this.queueUpdateCallbacks.delete(id);
      console.log('[SocketClient] Unsubscribed from queueUpdated, remaining:', this.queueUpdateCallbacks.size);
    };
  }

  onUserCalled(callback: EventCallback<UserCalledPayload>): () => void {
    const id = this.getNextCallbackId();
    this.userCalledCallbacks.set(id, callback);
    
    return () => {
      this.userCalledCallbacks.delete(id);
    };
  }

  onPositionUpdate(callback: EventCallback<PositionUpdatePayload>): () => void {
    const id = this.getNextCallbackId();
    this.positionUpdateCallbacks.set(id, callback);
    
    return () => {
      this.positionUpdateCallbacks.delete(id);
    };
  }

  onQueueDeleted(callback: EventCallback<QueueDeletedPayload>): () => void {
    const id = this.getNextCallbackId();
    this.queueDeletedCallbacks.set(id, callback);
    
    return () => {
      this.queueDeletedCallbacks.delete(id);
    };
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
  
  getJoinedQueueRooms(): string[] {
    return Array.from(this.queueRooms);
  }
  
  getJoinedUserRooms(): string[] {
    return Array.from(this.userRooms);
  }

  // Debug method
  debug(): void {
    console.log('[SocketClient] Debug Info:', {
      connected: this.socket?.connected,
      socketId: this.socket?.id,
      queueRooms: Array.from(this.queueRooms),
      userRooms: Array.from(this.userRooms),
      queueUpdateCallbacks: this.queueUpdateCallbacks.size,
      userCalledCallbacks: this.userCalledCallbacks.size,
      positionUpdateCallbacks: this.positionUpdateCallbacks.size,
      queueDeletedCallbacks: this.queueDeletedCallbacks.size,
    });
  }
}

// Singleton instance
export const socketClient = new SocketClient();

// Expose debug on window for development
if (import.meta.env.DEV) {
  (window as unknown as { socketClient: SocketClient }).socketClient = socketClient;
}

export default socketClient;
