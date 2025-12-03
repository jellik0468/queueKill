interface QueueStatusCircleProps {
  position: number;
  progress?: number;
}

export function QueueStatusCircle({ position, progress = 75 }: QueueStatusCircleProps) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Get ordinal suffix
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="220" height="220" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="#E63946"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-navy-900">{position}</span>
          <span className="text-2xl font-medium text-navy-400">{getOrdinal(position)}</span>
        </div>
        <span className="text-sm font-medium text-navy-500 uppercase tracking-wider mt-1">
          In Line
        </span>
      </div>
    </div>
  );
}

export default QueueStatusCircle;
