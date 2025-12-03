interface RestaurantCardProps {
  name: string;
  address: string;
  cuisine?: string;
  waitTime?: number;
  imageUrl?: string;
  onClick?: () => void;
}

export function RestaurantCard({
  name,
  address,
  cuisine,
  waitTime,
  imageUrl,
  onClick,
}: RestaurantCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-navy-50 transition-colors text-left"
    >
      <div className="w-20 h-20 rounded-xl bg-navy-100 overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-navy-100 to-navy-200" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-navy-900 truncate">{name}</h3>
        <p className="text-sm text-navy-500 truncate">{address}</p>
        {cuisine && (
          <span className="inline-block mt-1.5 px-2.5 py-0.5 text-xs font-medium bg-navy-100 text-navy-600 rounded-full">
            {cuisine}
          </span>
        )}
      </div>
      {waitTime !== undefined && (
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-brand-500">{waitTime}m</p>
          <p className="text-xs text-navy-400">Wait</p>
        </div>
      )}
    </button>
  );
}

export default RestaurantCard;
