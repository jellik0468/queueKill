import { Clock, ArrowRight } from 'lucide-react';

interface QueueCardProps {
  name: string;
  timeRange?: string;
  waitingCount: number;
  servedCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function QueueCard({
  name,
  timeRange,
  waitingCount,
  servedCount,
  isActive = true,
  onClick,
}: QueueCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-navy-100 p-5 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-navy-900 text-lg">{name}</h3>
          {timeRange && (
            <div className="flex items-center gap-1.5 text-sm text-navy-500 mt-1">
              <Clock className="w-4 h-4" />
              <span>{timeRange}</span>
            </div>
          )}
        </div>
        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-3xl font-bold text-navy-900">{waitingCount}</p>
            <p className="text-xs text-brand-500 font-medium uppercase tracking-wide">
              Waiting
            </p>
          </div>
          {servedCount !== undefined && (
            <div className="border-l border-navy-200 pl-6">
              <p className="text-3xl font-bold text-navy-900">{servedCount}</p>
              <p className="text-xs text-navy-500 font-medium uppercase tracking-wide">
                Served
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-brand-500 font-medium text-sm">
          <span>Manage</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
}

export default QueueCard;
