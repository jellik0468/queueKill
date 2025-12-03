import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus } from 'lucide-react';
import { QueueCard, AppButton } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { queuesApi } from '@/api';
import type { Queue } from '@/store/queueStore';
import { useOwnerQueuesSocket } from '@/hooks/useSocket';

export function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch owner's queues on mount
  useEffect(() => {
    async function fetchQueues() {
      try {
        setIsLoading(true);
        const response = await queuesApi.getMyQueues();
        if (response.success && response.data) {
          console.log('[OwnerDashboard] Fetched queues:', response.data.length);
          setQueues(response.data);
        }
      } catch (error) {
        console.error('[OwnerDashboard] Failed to fetch queues:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQueues();
  }, []);

  // Extract queue IDs for socket subscription (memoized to prevent unnecessary re-renders)
  const queueIds = useMemo(() => queues.map((q) => q.id), [queues]);

  // Handle real-time queue updates
  const handleQueueUpdate = useCallback((updatedQueue: Queue) => {
    console.log('[OwnerDashboard] Received queue update:', updatedQueue.id);
    setQueues((prev) =>
      prev.map((q) => (q.id === updatedQueue.id ? updatedQueue : q))
    );
  }, []);

  // Subscribe to socket updates for all queues
  useOwnerQueuesSocket(queueIds, handleQueueUpdate);

  const handleCreateQueue = async () => {
    if (!newQueueName.trim()) return;

    setIsCreating(true);
    try {
      const response = await queuesApi.createQueue({ name: newQueueName });
      if (response.success && response.data) {
        console.log('[OwnerDashboard] Created queue:', response.data.id);
        setQueues((prev) => [...prev, response.data!]);
        setNewQueueName('');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('[OwnerDashboard] Failed to create queue:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-900">Dashboard</h1>
            <p className="text-navy-500">
              {user?.name || 'Restaurant'} •{' '}
              <span className="text-emerald-500">Open</span>
            </p>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 hover:bg-navy-200 transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Queues Section */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider">
            Your Queues
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Create Queue Form */}
        {showCreateForm && (
          <div className="mb-4 p-4 bg-navy-50 rounded-2xl">
            <input
              type="text"
              placeholder="Queue name (e.g. Lunch Rush)"
              value={newQueueName}
              onChange={(e) => setNewQueueName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-navy-200 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              autoFocus
            />
            <div className="flex gap-2">
              <AppButton
                size="sm"
                onClick={handleCreateQueue}
                disabled={isCreating || !newQueueName.trim()}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </AppButton>
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewQueueName('');
                }}
              >
                Cancel
              </AppButton>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : queues.length > 0 ? (
            queues.map((queue) => {
              const waitingCount = queue.entries?.filter((e) => e.status === 'WAITING').length || 0;
              const servedCount = queue.entries?.filter((e) => e.status === 'COMPLETED').length || 0;

              return (
                <QueueCard
                  key={queue.id}
                  name={queue.name}
                  waitingCount={waitingCount}
                  servedCount={servedCount}
                  isActive={queue.isActive}
                  onClick={() => navigate(`/owner/queue/${queue.id}`)}
                />
              );
            })
          ) : (
            /* Empty state */
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-12 border-2 border-dashed border-navy-200 rounded-2xl text-navy-400 font-medium hover:border-brand-300 hover:text-brand-500 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Plus className="w-8 h-8" />
              <span>Create your first queue</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboardPage;
