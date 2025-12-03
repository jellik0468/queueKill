import { Bell, CheckCircle, X, UserCheck } from 'lucide-react';

interface QueueEntryCardProps {
  position: number;
  name: string;
  partySize: number;
  waitedMinutes: number;
  ticketNumber?: string;
  status: 'waiting' | 'called' | 'seated' | 'cancelled';
  showActions?: boolean;
  onComplete?: () => void;
  onRemove?: () => void;
  isActionLoading?: boolean;
}

export function QueueEntryCard({
  name,
  partySize,
  waitedMinutes,
  ticketNumber,
  status,
  showActions = false,
  onComplete,
  onRemove,
  isActionLoading = false,
}: QueueEntryCardProps) {
  const statusStyles = {
    waiting: 'border-navy-100 bg-white',
    called: 'border-yellow-200 bg-yellow-50',
    seated: 'border-emerald-200 bg-emerald-50',
    cancelled: 'border-red-200 bg-red-50 opacity-60',
  };

  return (
    <div className={`rounded-2xl border-2 p-4 ${statusStyles[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center">
            <span className="font-bold text-navy-700">{partySize}</span>
          </div>
          <div>
            <h4 className="font-semibold text-navy-900">{name}</h4>
            <p className="text-sm text-navy-500">Waited: {waitedMinutes} min</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ticketNumber && (
            <span className="text-sm text-navy-400 mr-1">#{ticketNumber}</span>
          )}

          {status === 'waiting' && !showActions && (
            <div className="flex items-center gap-1 text-navy-500">
              <Bell className="w-4 h-4" />
            </div>
          )}

          {status === 'called' && !showActions && (
            <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
              Called
            </span>
          )}

          {status === 'seated' && (
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}

          {status === 'cancelled' && (
            <span className="text-sm font-medium text-red-600">
              Cancelled
            </span>
          )}

          {/* Action buttons for owners */}
          {showActions && (status === 'waiting' || status === 'called') && (
            <div className="flex items-center gap-2">
              {status === 'called' && (
                <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-semibold rounded-full mr-1">
                  Called
                </span>
              )}
              <button
                onClick={onComplete}
                disabled={isActionLoading}
                className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-600 transition-colors disabled:opacity-50"
                title="Mark as served"
              >
                <UserCheck className="w-5 h-5" />
              </button>
              <button
                onClick={onRemove}
                disabled={isActionLoading}
                className="w-9 h-9 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors disabled:opacity-50"
                title="Remove from queue"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueueEntryCard;
