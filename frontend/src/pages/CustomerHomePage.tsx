import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, QrCode, User, MapPin, Users, X, Loader2, Clock, Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationPermission, useUserSocket } from '@/hooks/useSocket';
import { restaurantsApi, queuesApi, type Restaurant, type ActiveQueueEntry } from '@/api';

export function CustomerHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeEntries, setActiveEntries] = useState<ActiveQueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Request notification permission on mount
  useNotificationPermission();
  
  // Connect to user socket for personal notifications
  useUserSocket();

  // Load all restaurants and active entries on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch restaurants
        const restaurantsResponse = await restaurantsApi.getAll(20);
        if (restaurantsResponse.success && restaurantsResponse.data) {
          setRestaurants(restaurantsResponse.data);
        }

        // Fetch user's active queue entries
        const entriesResponse = await queuesApi.getMyEntries();
        if (entriesResponse.success && entriesResponse.data) {
          setActiveEntries(entriesResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Load all restaurants when search is cleared
      restaurantsApi.getAll(20).then((response) => {
        if (response.success && response.data) {
          setRestaurants(response.data);
        }
      });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await restaurantsApi.search(searchQuery);
        if (response.success && response.data) {
          setRestaurants(response.data);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const getTotalWaiting = (restaurant: Restaurant) => {
    return restaurant.queues.reduce((sum, q) => sum + (q.waitingCount || 0), 0);
  };

  const getRestaurantEmoji = (type?: string | null) => {
    const emojiMap: Record<string, string> = {
      'Italian': '🍝',
      'Japanese': '🍣',
      'Chinese': '🥡',
      'Thai': '🍜',
      'Mexican': '🌮',
      'Indian': '🍛',
      'American': '🍔',
      'French': '🥐',
      'Korean': '🍲',
      'Vietnamese': '🍜',
      'Mediterranean': '🥙',
      'Cafe': '☕',
      'Fast Food': '🍟',
      'Bakery': '🥖',
    };
    return emojiMap[type || ''] || '🍽️';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Hello, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-navy-500">Hungry for something new?</p>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full border border-navy-200 flex items-center justify-center hover:bg-navy-50 transition-colors"
          >
            <User className="w-5 h-5 text-navy-600" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            className="w-full pl-12 pr-10 py-4 bg-navy-50 rounded-2xl text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* My Active Queues */}
      {activeEntries.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">
            My Active Queues
          </h2>
          <div className="space-y-3">
            {activeEntries.map((entry) => {
              const isCalled = entry.status === 'CALLED';
              
              return (
                <button
                  key={entry.id}
                  onClick={() => navigate(`/queue/${entry.queueId}/status`)}
                  className={`w-full rounded-2xl p-4 text-left transition-colors ${
                    isCalled 
                      ? 'bg-emerald-50 border-2 border-emerald-300 animate-pulse' 
                      : 'bg-brand-50 border border-brand-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isCalled ? 'bg-emerald-500' : 'bg-brand-500'
                      }`}>
                        {isCalled ? (
                          <Bell className="w-6 h-6 text-white" />
                        ) : (
                          <span className="text-xl font-bold text-white">#{entry.position}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-navy-900">
                            {entry.queue.restaurant?.name || entry.queue.name}
                          </h3>
                          {isCalled && (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                              YOUR TURN!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-navy-500">{entry.queue.name}</p>
                        {!isCalled && (
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-brand-600">
                              <Users className="w-3 h-3" />
                              <span>{entry.positionAhead} ahead</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-navy-500">
                              <Clock className="w-3 h-3" />
                              <span>~{entry.estimatedWait} min</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isCalled ? 'text-emerald-600' : 'text-brand-500'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Scanner Card */}
      <div className="px-6 mb-6">
        <div className="bg-brand-500 rounded-3xl p-6 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute right-0 bottom-0 w-32 h-32 opacity-10">
            <QrCode className="w-full h-full text-white" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-1">Join a Queue</h2>
          <p className="text-white/80 text-sm mb-4">Scan a QR code at the venue</p>

          <button
            onClick={() => navigate('/scan')}
            className="flex items-center gap-2 bg-white text-brand-500 px-4 py-2.5 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Scan Code
          </button>
        </div>
      </div>

      {/* Restaurants List */}
      <div className="px-6 pb-8">
        <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">
          {searchQuery ? 'Search Results' : 'Nearby Restaurants'}
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : restaurants.length > 0 ? (
          <div className="space-y-3">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                className="w-full bg-navy-50 rounded-2xl p-4 text-left hover:bg-navy-100 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{getRestaurantEmoji(restaurant.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-navy-900 truncate">
                        {restaurant.name}
                      </h3>
                      {restaurant.type && (
                        <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded-full flex-shrink-0">
                          {restaurant.type}
                        </span>
                      )}
                    </div>
                    {restaurant.description && (
                      <p className="text-sm text-navy-600 mt-0.5 line-clamp-1">
                        {restaurant.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-navy-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{restaurant.address}</span>
                      </div>
                      {restaurant.queues.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-brand-600">
                          <Users className="w-3 h-3" />
                          <span>{getTotalWaiting(restaurant)} waiting</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-navy-400">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No restaurants found for "{searchQuery}"</p>
              </>
            ) : (
              <>
                <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No restaurants available yet</p>
                <p className="text-xs mt-1">Scan a QR code to join a queue</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerHomePage;
