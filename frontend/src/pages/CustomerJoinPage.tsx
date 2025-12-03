import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Phone, CheckCircle } from 'lucide-react';
import { AppHeader, AppButton, InputField, PartySelector } from '@/components';
import { queuesApi } from '@/api';
import { useQueueStore } from '@/store/queueStore';
import { useAuthStore } from '@/store/authStore';

export function CustomerJoinPage() {
  const navigate = useNavigate();
  const { queueId } = useParams<{ queueId: string }>();
  const { user } = useAuthStore();
  const { setQueue, setMyEntry, currentQueue } = useQueueStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [partySize, setPartySize] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already in the queue
  const existingEntry = useMemo(() => {
    if (!user || !currentQueue?.entries) return null;
    return currentQueue.entries.find(
      (e) => e.userId === user.id && (e.status === 'WAITING' || e.status === 'CALLED')
    );
  }, [user, currentQueue]);

  // Load queue data
  useEffect(() => {
    async function loadQueue() {
      if (!queueId) return;

      try {
        const response = await queuesApi.getQueue(queueId);
        if (response.success && response.data) {
          setQueue(response.data);
          
          // If user already has an entry, set it as myEntry
          if (user && response.data.entries) {
            const existing = response.data.entries.find(
              (e) => e.userId === user.id && (e.status === 'WAITING' || e.status === 'CALLED')
            );
            if (existing) {
              setMyEntry(existing);
            }
          }
        } else {
          setError('Queue not found');
        }
      } catch {
        setError('Failed to load queue');
      } finally {
        setIsLoadingQueue(false);
      }
    }

    loadQueue();
  }, [queueId, setQueue, setMyEntry, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueId) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await queuesApi.joinQueue(queueId, {
        name,
        phone: phone || undefined,
        groupSize: partySize,
      });

      if (response.success && response.data) {
        setMyEntry(response.data);
        navigate(`/queue/${queueId}/status`);
      } else {
        setError(response.error || 'Failed to join queue');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to join queue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingQueue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const waitingCount = currentQueue?.entries?.filter((e) => e.status === 'WAITING').length || 0;
  const estimatedWait = waitingCount * 5;

  // If user is already in queue, show different UI
  if (existingEntry) {
    const position = currentQueue?.entries?.filter(
      (e) => e.status === 'WAITING' && e.position < existingEntry.position
    ).length || 0;

    return (
      <div className="min-h-screen bg-white">
        <AppHeader showBack title="Already in Queue" />

        <div className="px-6 pt-4 pb-8">
          {/* Success Card */}
          <div className="bg-emerald-50 rounded-3xl p-6 text-center mb-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-2">
              You're Already in Line!
            </h2>
            <p className="text-navy-600">
              You joined this queue earlier. {position > 0 ? `${position} ${position === 1 ? 'person' : 'people'} ahead of you.` : "You're next!"}
            </p>
          </div>

          {/* Entry Details */}
          <div className="bg-navy-50 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Position</p>
                <p className="text-lg font-bold text-navy-900">#{existingEntry.position}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Status</p>
                <p className="text-lg font-bold text-navy-900 capitalize">
                  {existingEntry.status === 'CALLED' ? '🔔 Called!' : 'Waiting'}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Party Size</p>
                <p className="text-lg font-bold text-navy-900">{existingEntry.groupSize}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Est. Wait</p>
                <p className="text-lg font-bold text-navy-900">~{position * 5} min</p>
              </div>
            </div>
          </div>

          <AppButton fullWidth onClick={() => navigate(`/queue/${queueId}/status`)}>
            View Queue Status
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AppHeader showBack title="Join Queue" />

      <div className="px-6 pt-4 pb-8">
        {/* Restaurant Preview Card */}
        <div className="flex items-center gap-4 p-4 bg-navy-50 rounded-2xl mb-8">
          <div className="w-14 h-14 bg-navy-200 rounded-xl flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-navy-900">
              {currentQueue?.restaurant?.name || currentQueue?.name || 'Restaurant'}
            </h3>
            <p className="text-sm text-navy-500">
              Wait: ~{estimatedWait} mins • {waitingCount} in line
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            label="Name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="w-5 h-5" />}
            required
          />

          <InputField
            label="Phone"
            type="tel"
            placeholder="(555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="w-5 h-5" />}
          />

          <PartySelector value={partySize} onChange={setPartySize} max={10} />

          <div className="pt-6">
            <AppButton type="submit" fullWidth disabled={isLoading || !name.trim()}>
              {isLoading ? 'Joining...' : 'Confirm & Join'}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerJoinPage;
