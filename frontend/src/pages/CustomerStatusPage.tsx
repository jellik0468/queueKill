import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Bell, Clock } from 'lucide-react';
import { AppButton, QueueStatusCircle } from '@/components';
import { queuesApi } from '@/api';
import { useQueueStore } from '@/store/queueStore';
import { useQueueSocket, useUserSocket } from '@/hooks/useSocket';

export function CustomerStatusPage() {
  const navigate = useNavigate();
  const { queueId } = useParams<{ queueId: string }>();
  const [showQueueList, setShowQueueList] = useState(false);
  const {
    currentQueue,
    myEntry,
    setQueue,
    reset,
    isLoading,
    setLoading,
    error,
    setError,
  } = useQueueStore();

  // Connect to socket for real-time updates
  useQueueSocket(queueId);
  
  // Also connect to user socket for personal notifications
  useUserSocket();

  // Load initial queue data
  useEffect(() => {
    async function loadQueue() {
      if (!queueId) return;

      setLoading(true);
      try {
        const response = await queuesApi.getQueue(queueId);
        if (response.success && response.data) {
          setQueue(response.data);
        }
      } catch {
        setError('Failed to load queue');
      } finally {
        setLoading(false);
      }
    }

    loadQueue();
  }, [queueId, setQueue, setLoading, setError]);

  const handleLeaveQueue = async () => {
    if (!myEntry) {
      navigate('/home');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await queuesApi.leaveQueue(myEntry.id);

      if (response.success) {
        reset();
        navigate('/home');
      } else {
        setError(response.error || 'Failed to leave queue');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || 'Failed to leave queue');
    } finally {
      setLoading(false);
    }
  };

  // Calculate position and progress
  const allEntries = currentQueue?.entries || [];
  const waitingEntries = allEntries
    .filter((e) => e.status === 'WAITING')
    .sort((a, b) => a.position - b.position);
  const calledEntries = allEntries
    .filter((e) => e.status === 'CALLED')
    .sort((a, b) => a.position - b.position);

  const activeEntries = [...calledEntries, ...waitingEntries];

  const myPosition = myEntry
    ? waitingEntries.findIndex((e) => e.id === myEntry.id) + 1
    : 0;

  const totalWaiting = waitingEntries.length;
  const progress =
    totalWaiting > 0 ? ((totalWaiting - myPosition + 1) / totalWaiting) * 100 : 0;
  const estimatedWait = myPosition * 5;

  const arrivalTime = new Date(Date.now() + estimatedWait * 60 * 1000).toLocaleTimeString(
    [],
    { hour: 'numeric', minute: '2-digit' }
  );

  const isCalled = myEntry?.status === 'CALLED';
  const isCompleted = myEntry?.status === 'COMPLETED';
  const isCancelled = myEntry?.status === 'CANCELLED';

  // If entry was completed or cancelled, show appropriate message
  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-emerald-50">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">All Done!</h2>
        <p className="text-navy-500 mb-8 text-center">You've been served. Thank you for visiting!</p>
        <AppButton onClick={() => navigate('/home')}>Go Home</AppButton>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-navy-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">👋</span>
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Left Queue</h2>
        <p className="text-navy-500 mb-8 text-center">You've left the queue. Come back anytime!</p>
        <AppButton onClick={() => navigate('/home')}>Go Home</AppButton>
      </div>
    );
  }

  // Handle queue deleted state
  if (!currentQueue && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-navy-50">
        <div className="w-24 h-24 bg-navy-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🚫</span>
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Queue Closed</h2>
        <p className="text-navy-500 mb-8 text-center">
          This queue has been closed by the restaurant.
        </p>
        <AppButton onClick={() => navigate('/home')}>Go Home</AppButton>
      </div>
    );
  }

  if (!myEntry && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-navy-500 mb-4">You're not in this queue</p>
        <AppButton onClick={() => navigate('/home')}>Go Home</AppButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Brand Header */}
      <div className={`px-4 py-4 ${isCalled ? 'bg-emerald-500' : 'bg-brand-500'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {isCalled ? "It's Your Turn!" : 'Queue Status'}
          </h1>
        </div>
      </div>

      {/* Main Content Card */}
      <div className={`flex-1 ${isCalled ? 'bg-emerald-500' : 'bg-brand-500'} px-4 pt-2`}>
        <div className="bg-white rounded-t-[2.5rem] min-h-full px-6 py-8 flex flex-col">
          {isCalled ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">You've been called!</h2>
              <p className="text-navy-500 mb-8">Please proceed to the counter now.</p>

              <AppButton fullWidth onClick={() => navigate('/home')}>
                Done
              </AppButton>
            </div>
          ) : (
            <>
              {/* Status Circle */}
              <div className="flex justify-center mb-8">
                <QueueStatusCircle position={myPosition || 1} progress={progress} />
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-12 mb-6">
                <div className="text-center">
                  <p className="text-xs text-navy-400 font-medium uppercase tracking-wider mb-1">
                    Est. Wait
                  </p>
                  <p className="text-2xl font-bold text-navy-900">{estimatedWait}m</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-navy-400 font-medium uppercase tracking-wider mb-1">
                    Arrival
                  </p>
                  <p className="text-2xl font-bold text-navy-900">{arrivalTime}</p>
                </div>
              </div>

              {/* View Queue Button */}
              <button
                onClick={() => setShowQueueList(!showQueueList)}
                className="flex items-center justify-center gap-2 py-3 text-brand-600 font-medium"
              >
                <Users className="w-4 h-4" />
                {showQueueList ? 'Hide Queue List' : `View Queue (${activeEntries.length} people)`}
              </button>

              {/* Queue List */}
              {showQueueList && (
                <div className="mt-4 bg-navy-50 rounded-2xl p-4 max-h-64 overflow-y-auto">
                  <h3 className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">
                    Current Queue
                  </h3>
                  {activeEntries.length > 0 ? (
                    <div className="space-y-2">
                      {activeEntries.map((entry, index) => {
                        const isMe = entry.id === myEntry?.id;
                        const entryIsCalled = entry.status === 'CALLED';
                        
                        return (
                          <div
                            key={entry.id}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              isMe
                                ? 'bg-brand-100 border-2 border-brand-300'
                                : entryIsCalled
                                  ? 'bg-yellow-50 border border-yellow-200'
                                  : 'bg-white border border-navy-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                entryIsCalled ? 'bg-yellow-500 text-white' : 'bg-navy-200 text-navy-700'
                              }`}>
                                {entry.position}
                              </div>
                              <div>
                                <p className={`font-medium ${isMe ? 'text-brand-700' : 'text-navy-900'}`}>
                                  {isMe ? `${entry.name} (You)` : entry.name}
                                </p>
                                <p className="text-xs text-navy-500">
                                  Party of {entry.groupSize}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {entryIsCalled ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                                  <Bell className="w-3 h-3" />
                                  Called
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-navy-400">
                                  <Clock className="w-3 h-3" />
                                  ~{(index - calledEntries.length + 1) * 5}m
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-navy-400 text-sm text-center py-4">No one in queue</p>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1 min-h-[40px]" />

              {/* Leave Button */}
              <div className="mt-auto">
                <AppButton
                  variant="outline"
                  fullWidth
                  onClick={handleLeaveQueue}
                  disabled={isLoading}
                  className="border-brand-200 text-brand-500 hover:bg-brand-50"
                >
                  {isLoading ? 'Leaving...' : 'Leave Queue'}
                </AppButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerStatusPage;
