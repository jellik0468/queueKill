import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketClient } from '@/utils/socket';
import { useQueueStore, Queue, QueueEntry } from '@/store/queueStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook for customers viewing a specific queue
 * Joins the queue room and handles all queue-related events
 */
export function useQueueSocket(queueId: string | undefined) {
  const navigate = useNavigate();
  const setQueue = useQueueStore((state) => state.setQueue);
  const setMyEntry = useQueueStore((state) => state.setMyEntry);
  const reset = useQueueStore((state) => state.reset);
  
  // Use refs to avoid stale closures
  const myEntryRef = useRef<QueueEntry | null>(null);
  
  // Keep ref synced with store
  useEffect(() => {
    const unsub = useQueueStore.subscribe((state) => {
      myEntryRef.current = state.myEntry;
    });
    // Initialize with current value
    myEntryRef.current = useQueueStore.getState().myEntry;
    return unsub;
  }, []);

  useEffect(() => {
    if (!queueId) return;

    console.log('[useQueueSocket] Setting up for queue:', queueId);
    
    // Join the queue room
    socketClient.joinQueueRoom(queueId);

    // Handle queue updates
    const unsubQueue = socketClient.onQueueUpdated((data) => {
      const queue = data.queue as Queue;
      
      // Only process updates for this queue
      if (queue.id !== queueId) return;
      
      console.log('[useQueueSocket] Queue updated:', queue.id);
      setQueue(queue);
      
      // Update myEntry if it exists in the queue
      const currentMyEntry = myEntryRef.current;
      if (currentMyEntry && queue.entries) {
        const updatedEntry = queue.entries.find((e) => e.id === currentMyEntry.id);
        if (updatedEntry) {
          console.log('[useQueueSocket] Updated myEntry status:', updatedEntry.status);
          setMyEntry(updatedEntry);
        }
      }
    });

    // Handle being called
    const unsubCalled = socketClient.onUserCalled((data) => {
      const currentMyEntry = myEntryRef.current;
      if (currentMyEntry && data.entryId === currentMyEntry.id) {
        console.log('[useQueueSocket] User called!');
        setMyEntry({ ...currentMyEntry, status: 'CALLED' });
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("It's your turn!", {
            body: 'Please proceed to the counter.',
            icon: '/vite.svg',
          });
        }
      }
    });

    // Handle queue deletion
    const unsubDeleted = socketClient.onQueueDeleted((data) => {
      if (data.queueId === queueId) {
        console.log('[useQueueSocket] Queue deleted:', data.queueId);
        alert(`Queue Closed: ${data.message}`);
        reset();
        navigate('/home', { replace: true });
      }
    });

    return () => {
      console.log('[useQueueSocket] Cleanup for queue:', queueId);
      socketClient.leaveQueueRoom(queueId);
      unsubQueue();
      unsubCalled();
      unsubDeleted();
    };
  }, [queueId, setQueue, setMyEntry, reset, navigate]);
}

/**
 * Hook for owner dashboard - subscribes to updates for multiple queues
 * Uses refs to avoid re-subscribing when queue data changes
 */
export function useOwnerQueuesSocket(
  queueIds: string[],
  onQueueUpdate: (queue: Queue) => void
) {
  // Track which rooms we've joined
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  // Store the callback in a ref to avoid re-subscribing when it changes
  const callbackRef = useRef(onQueueUpdate);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onQueueUpdate;
  }, [onQueueUpdate]);

  useEffect(() => {
    if (queueIds.length === 0) {
      // Clean up any existing rooms
      joinedRoomsRef.current.forEach((id) => {
        socketClient.leaveQueueRoom(id);
      });
      joinedRoomsRef.current.clear();
      return;
    }

    const queueIdSet = new Set(queueIds);
    
    // Leave rooms we're no longer interested in
    joinedRoomsRef.current.forEach((id) => {
      if (!queueIdSet.has(id)) {
        console.log('[useOwnerQueuesSocket] Leaving room:', id);
        socketClient.leaveQueueRoom(id);
        joinedRoomsRef.current.delete(id);
      }
    });

    // Join new rooms
    queueIds.forEach((id) => {
      if (!joinedRoomsRef.current.has(id)) {
        console.log('[useOwnerQueuesSocket] Joining room:', id);
        socketClient.joinQueueRoom(id);
        joinedRoomsRef.current.add(id);
      }
    });

    // Subscribe to queue updates (only once, not on every queueIds change)
    const unsubQueue = socketClient.onQueueUpdated((data) => {
      const queue = data.queue as Queue;
      // Only process updates for queues we care about
      if (joinedRoomsRef.current.has(queue.id)) {
        console.log('[useOwnerQueuesSocket] Queue updated:', queue.id);
        callbackRef.current(queue);
      }
    });

    return () => {
      console.log('[useOwnerQueuesSocket] Cleanup');
      unsubQueue();
      // Note: We don't leave rooms here because the effect might re-run
      // Rooms are managed incrementally above
    };
  }, [queueIds.join(',')]); // Only re-run when the list of IDs changes (as a string)

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useOwnerQueuesSocket] Final cleanup - leaving all rooms');
      joinedRoomsRef.current.forEach((id) => {
        socketClient.leaveQueueRoom(id);
      });
      joinedRoomsRef.current.clear();
    };
  }, []);
}

/**
 * Hook for personal user notifications
 * Joins the user's personal room for notifications like being called
 */
export function useUserSocket() {
  const user = useAuthStore((state) => state.user);
  const reset = useQueueStore((state) => state.reset);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    console.log('[useUserSocket] Setting up for user:', userId);
    
    // Join user's personal room
    socketClient.joinUserRoom(userId);

    // Handle being called (in case they're not on the status page)
    const unsubCalled = socketClient.onUserCalled((data) => {
      console.log('[useUserSocket] User called:', data);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("You've been called!", {
          body: 'Please proceed to the counter.',
          icon: '/vite.svg',
        });
      } else {
        alert("It's your turn! Please proceed to the counter.");
      }
    });

    // Handle position updates
    const unsubPosition = socketClient.onPositionUpdate((data) => {
      console.log('[useUserSocket] Position update:', data);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.newPosition === 1 ? "You're Next!" : 'Queue Update', {
          body: data.message,
          icon: '/vite.svg',
        });
      }
    });

    // Handle queue deletion
    const unsubDeleted = socketClient.onQueueDeleted((data) => {
      console.log('[useUserSocket] Queue deleted:', data);
      reset();
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Queue Closed', {
          body: data.message,
          icon: '/vite.svg',
        });
      }
    });

    return () => {
      console.log('[useUserSocket] Cleanup for user:', userId);
      socketClient.leaveUserRoom(userId);
      unsubCalled();
      unsubPosition();
      unsubDeleted();
    };
  }, [user?.id, reset]);
}

/**
 * Hook to request notification permission on mount
 */
export function useNotificationPermission() {
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      console.log('[useNotificationPermission] Permission result:', result);
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);
}

export default useQueueSocket;
