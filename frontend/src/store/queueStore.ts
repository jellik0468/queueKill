import { create } from 'zustand';

export type QueueEntryStatus = 'WAITING' | 'CALLED' | 'COMPLETED' | 'CANCELLED';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
}

export interface QueueEntry {
  id: string;
  queueId: string;
  userId?: string;
  name: string;
  phone?: string;
  groupSize: number;
  position: number;
  status: QueueEntryStatus;
  calledAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface Queue {
  id: string;
  name: string;
  restaurantId: string;
  restaurant?: Restaurant;
  entries?: QueueEntry[];
  isActive: boolean;
  createdAt: string;
}

interface QueueState {
  currentQueue: Queue | null;
  myEntry: QueueEntry | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setQueue: (queue: Queue) => void;
  setMyEntry: (entry: QueueEntry | null) => void;
  updateFromSocket: (queue: Queue) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  currentQueue: null,
  myEntry: null,
  isLoading: false,
  error: null,

  setQueue: (queue) => set({ currentQueue: queue, error: null }),

  setMyEntry: (entry) => set({ myEntry: entry }),

  updateFromSocket: (queue) => {
    const currentEntry = get().myEntry;
    // Update queue and check if our entry status changed
    if (currentEntry && queue.entries) {
      const updatedEntry = queue.entries.find((e) => e.id === currentEntry.id);
      if (updatedEntry) {
        set({ currentQueue: queue, myEntry: updatedEntry });
        return;
      }
    }
    set({ currentQueue: queue });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      currentQueue: null,
      myEntry: null,
      isLoading: false,
      error: null,
    }),
}));

export default useQueueStore;
