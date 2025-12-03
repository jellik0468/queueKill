interface PartySelectorProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function PartySelector({ value, onChange, max = 10 }: PartySelectorProps) {
  const options = [1, 2, 3, 4, 5];

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">
        Party Size
      </label>
      <div className="flex items-center gap-2">
        {options.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center text-lg font-semibold
              transition-all duration-200 flex-shrink-0
              ${
                value === num
                  ? 'bg-brand-500 text-white ring-2 ring-brand-500 ring-offset-2'
                  : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
              }
            `}
          >
            {num}
          </button>
        ))}
      </div>
      {max > 5 && (
        <div className="mt-3">
          <input
            type="range"
            min={1}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
          <div className="flex justify-between text-xs text-navy-400 mt-1">
            <span>1</span>
            <span>{value} selected</span>
            <span>{max}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartySelector;
