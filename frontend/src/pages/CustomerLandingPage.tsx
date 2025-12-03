import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, CheckCircle, Users, FileText, X } from 'lucide-react';
import { AppHeader, AppButton } from '@/components';
import { restaurantsApi, type Restaurant } from '@/api';

export function CustomerLandingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Load restaurant data
  useEffect(() => {
    async function loadRestaurant() {
      if (!id) return;

      try {
        const response = await restaurantsApi.getById(id);
        if (response.success && response.data) {
          setRestaurant(response.data);
        } else {
          setError('Restaurant not found');
        }
      } catch {
        setError('Failed to load restaurant');
      } finally {
        setIsLoading(false);
      }
    }

    loadRestaurant();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader showBack variant="light" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-navy-500 mb-4">{error || 'Restaurant not found'}</p>
            <AppButton onClick={() => navigate('/home')}>Go Home</AppButton>
          </div>
        </div>
      </div>
    );
  }

  const activeQueues = restaurant.queues?.filter((q) => q.isActive) || [];
  const totalWaiting = activeQueues.reduce((sum, q) => sum + (q.waitingCount || 0), 0);
  const estimatedWait = totalWaiting * 5;
  const displayDescription = restaurant.longDescription || restaurant.description;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Menu Modal */}
      {showMenu && restaurant.menuText && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="text-lg font-display font-bold text-navy-900">Menu</h2>
              <button
                onClick={() => setShowMenu(false)}
                className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-navy-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-sans text-navy-700 text-sm leading-relaxed">
                {restaurant.menuText}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Dark Background */}
      <div className="relative bg-navy-900 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800 to-navy-900" />

        <div className="relative">
          <AppHeader showBack variant="dark" />
        </div>

        <div className="relative px-6 pt-8">
          <div className="flex items-center gap-2 mb-3">
            {activeQueues.length > 0 && (
              <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                OPEN NOW
              </span>
            )}
            {restaurant.type && (
              <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                {restaurant.type}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-display font-bold text-white mb-2">
            {restaurant.name}
          </h1>

          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{restaurant.address}</span>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex divide-x divide-navy-200">
            <div className="flex-1 pr-6">
              <p className="text-xs text-navy-400 font-medium uppercase tracking-wider mb-1">
                Estimated Wait
              </p>
              <p className="text-3xl font-bold text-brand-500">
                ~{estimatedWait} min
              </p>
            </div>
            <div className="flex-1 pl-6">
              <p className="text-xs text-navy-400 font-medium uppercase tracking-wider mb-1">
                Total In Line
              </p>
              <p className="text-3xl font-bold text-navy-900">{totalWaiting}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Menu */}
      {(displayDescription || restaurant.menuText) && (
        <div className="px-6 mt-6">
          {displayDescription && (
            <div className="mb-4">
              <h3 className="font-semibold text-navy-900 mb-2">About</h3>
              <p className="text-navy-600 text-sm leading-relaxed">{displayDescription}</p>
            </div>
          )}
          
          {restaurant.menuText && (
            <button
              onClick={() => setShowMenu(true)}
              className="flex items-center gap-2 text-brand-600 font-medium text-sm"
            >
              <FileText className="w-4 h-4" />
              View Menu
            </button>
          )}
        </div>
      )}

      {/* Active Queues */}
      {activeQueues.length > 0 && (
        <div className="px-6 mt-6">
          <h3 className="font-semibold text-navy-900 mb-3">Available Queues</h3>
          <div className="space-y-3">
            {activeQueues.map((queue) => (
              <button
                key={queue.id}
                onClick={() => navigate(`/queue/${queue.id}`)}
                className="w-full bg-navy-50 rounded-2xl p-4 flex items-center justify-between hover:bg-navy-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-navy-900">{queue.name}</p>
                  <div className="flex items-center gap-1 text-sm text-navy-500 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{queue.waitingCount || 0} waiting</span>
                  </div>
                </div>
                <span className="text-brand-500 font-medium text-sm">Join →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules/Notes */}
      <div className="px-6 mt-6 flex-1">
        <h3 className="font-semibold text-navy-900 mb-3">Before you join</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-navy-600 text-sm">Entire party must be present.</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-navy-600 text-sm">You have 5 mins to claim table.</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom - show if only one queue or no queues */}
      {activeQueues.length === 1 && (
        <div className="sticky bottom-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <AppButton fullWidth onClick={() => navigate(`/queue/${activeQueues[0].id}`)}>
            Join Queue
          </AppButton>
        </div>
      )}

      {activeQueues.length === 0 && (
        <div className="px-6 pb-6">
          <div className="bg-navy-50 rounded-2xl p-6 text-center">
            <p className="text-navy-500">No active queues at the moment</p>
            <p className="text-navy-400 text-sm mt-1">Please check back later</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerLandingPage;
