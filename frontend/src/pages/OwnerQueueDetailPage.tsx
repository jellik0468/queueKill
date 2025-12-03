import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, Users, Clock, Trash2 } from 'lucide-react';
import { AppHeader, QueueEntryCard, AppButton } from '@/components';
import { queuesApi } from '@/api';
import { useQueueStore } from '@/store/queueStore';
import { useQueueSocket } from '@/hooks/useSocket';

type TabType = 'active' | 'history';

export function OwnerQueueDetailPage() {
  const navigate = useNavigate();
  const { queueId } = useParams<{ queueId: string }>();
  const { currentQueue, setQueue, setLoading, isLoading } = useQueueStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Connect to socket for real-time updates
  useQueueSocket(queueId);

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
      } catch (error) {
        console.error('Failed to load queue:', error);
      } finally {
        setLoading(false);
      }
    }

    loadQueue();
  }, [queueId, setQueue, setLoading]);

  const handleCallNext = async () => {
    if (!queueId) return;

    setActionLoading('call-next');
    try {
      await queuesApi.callNext(queueId);
      // Socket will update the queue automatically
    } catch (error) {
      console.error('Failed to call next:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (entryId: string) => {
    setActionLoading(entryId);
    try {
      await queuesApi.completeEntry(entryId);
      // Socket will update the queue automatically
    } catch (error) {
      console.error('Failed to complete entry:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (entryId: string) => {
    setActionLoading(entryId);
    try {
      await queuesApi.removeEntry(entryId);
      // Socket will update the queue automatically
    } catch (error) {
      console.error('Failed to remove entry:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteQueue = async () => {
    if (!queueId) return;

    setActionLoading('delete');
    try {
      await queuesApi.deleteQueue(queueId);
      navigate('/owner/dashboard', { replace: true });
    } catch (error) {
      console.error('Failed to delete queue:', error);
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const entries = currentQueue?.entries || [];
  const waitingEntries = entries
    .filter((e) => e.status === 'WAITING')
    .sort((a, b) => a.position - b.position);
  const calledEntries = entries
    .filter((e) => e.status === 'CALLED')
    .sort((a, b) => a.position - b.position);
  const completedEntries = entries
    .filter((e) => e.status === 'COMPLETED')
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
    .slice(0, 10);
  const cancelledEntries = entries
    .filter((e) => e.status === 'CANCELLED')
    .sort((a, b) => new Date(b.cancelledAt || b.createdAt).getTime() - new Date(a.cancelledAt || a.createdAt).getTime())
    .slice(0, 10);

  const activeEntries = [...calledEntries, ...waitingEntries];
  const historyEntries = [...completedEntries, ...cancelledEntries];
  const estimatedWait = waitingEntries.length * 5;
  const qrCodeUrl = queueId ? queuesApi.getQueueQRCodeUrl(queueId) : '';

  return (
    <div className="min-h-screen bg-white">
      <AppHeader
        showBack
        title={currentQueue?.name || 'Queue'}
        rightElement={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete Queue"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="p-2 rounded-lg hover:bg-navy-100 transition-colors"
            >
              <QrCode className="w-5 h-5 text-navy-600" />
            </button>
          </div>
        }
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">Delete Queue?</h3>
            <p className="text-sm text-navy-500 text-center mb-6">
              This will remove all {activeEntries.length > 0 ? `${activeEntries.length} people in the queue and ` : ''}
              permanently delete this queue. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <AppButton
                variant="outline"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading === 'delete'}
              >
                Cancel
              </AppButton>
              <AppButton
                fullWidth
                onClick={handleDeleteQueue}
                disabled={actionLoading === 'delete'}
                className="bg-red-500 hover:bg-red-600"
              >
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
              </AppButton>
            </div>
          </div>
        </div>
      )
    }
      {/* QR Code Modal */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-center mb-4">Queue QR Code</h3>
            <div className="bg-white p-4 rounded-xl border">
              <img src={qrCodeUrl} alt="Queue QR Code" className="w-full" />
            </div>
            <p className="text-sm text-navy-500 text-center mt-4">
              Customers can scan this to join the queue
            </p>
            <AppButton
              variant="outline"
              fullWidth
              className="mt-4"
              onClick={() => setShowQR(false)}
            >
              Close
            </AppButton>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="px-6 py-4">
        <div className="flex gap-3">
          <div className="flex-1 bg-brand-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-5 h-5 text-brand-500" />
            </div>
            <p className="text-3xl font-bold text-brand-500">{waitingEntries.length}</p>
            <p className="text-xs text-brand-500 font-medium uppercase tracking-wide">
              Waiting
            </p>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{calledEntries.length}</p>
            <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide">
              Called
            </p>
          </div>
          <div className="flex-1 bg-navy-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-navy-500" />
            </div>
            <p className="text-3xl font-bold text-navy-900">~{estimatedWait}m</p>
            <p className="text-xs text-navy-500 font-medium uppercase tracking-wide">
              Est. Wait
            </p>
          </div>
        </div>

        {/* Call Next Button */}
        {waitingEntries.length > 0 && (
          <div className="mt-4">
            <AppButton
              fullWidth
              onClick={handleCallNext}
              disabled={actionLoading === 'call-next'}
            >
              {actionLoading === 'call-next' ? 'Calling...' : `Call Next (${waitingEntries[0]?.name || 'Guest'})`}
            </AppButton>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex bg-navy-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500'
            }`}
          >
            Active ({activeEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500'
            }`}
          >
            History ({historyEntries.length})
          </button>
        </div>
      </div>

      {/* Queue Entries */}
      <div className="px-6 space-y-3 pb-8">
        {activeTab === 'active' ? (
          activeEntries.length > 0 ? (
            activeEntries.map((entry) => {
              const waitedMinutes = Math.floor(
                (Date.now() - new Date(entry.createdAt).getTime()) / 60000
              );

              return (
                <QueueEntryCard
                  key={entry.id}
                  position={entry.position}
                  name={entry.name}
                  partySize={entry.groupSize}
                  waitedMinutes={waitedMinutes}
                  ticketNumber={entry.position.toString()}
                  status={entry.status === 'WAITING' ? 'waiting' : 'called'}
                  showActions={true}
                  onComplete={() => handleComplete(entry.id)}
                  onRemove={() => handleRemove(entry.id)}
                  isActionLoading={actionLoading === entry.id}
                />
              );
            })
          ) : (
            <div className="text-center py-12 text-navy-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No one in queue yet</p>
              <p className="text-sm mt-2">Share your QR code to let customers join</p>
            </div>
          )
        ) : (
          historyEntries.length > 0 ? (
            historyEntries.map((entry) => {
              const waitedMinutes = Math.floor(
                (Date.now() - new Date(entry.createdAt).getTime()) / 60000
              );

              return (
                <QueueEntryCard
                  key={entry.id}
                  position={entry.position}
                  name={entry.name}
                  partySize={entry.groupSize}
                  waitedMinutes={waitedMinutes}
                  ticketNumber={entry.position.toString()}
                  status={entry.status === 'COMPLETED' ? 'seated' : 'cancelled'}
                />
              );
            })
          ) : (
            <div className="text-center py-12 text-navy-400">
              <p>No history yet</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default OwnerQueueDetailPage;
