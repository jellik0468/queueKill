import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, FileText, ChevronLeft } from 'lucide-react';
import { AppButton, InputField } from '@/components';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';

type OnboardingStep = 'restaurant' | 'details' | 'queue';

interface OwnerRegistration {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const RESTAURANT_TYPES = [
  'Italian',
  'Japanese',
  'Chinese',
  'Thai',
  'Mexican',
  'Indian',
  'American',
  'French',
  'Korean',
  'Vietnamese',
  'Mediterranean',
  'Cafe',
  'Fast Food',
  'Bakery',
  'Other',
];

export function OwnerOnboardingPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [step, setStep] = useState<OnboardingStep>('restaurant');
  const [ownerData, setOwnerData] = useState<OwnerRegistration | null>(null);
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    address: '',
    type: '',
    description: '',
    longDescription: '',
    menuText: '',
  });
  const [queueName, setQueueName] = useState('Main Queue');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load owner registration data from session storage
  useEffect(() => {
    const savedData = sessionStorage.getItem('ownerRegistration');
    if (savedData) {
      setOwnerData(JSON.parse(savedData));
    } else {
      // No registration data, redirect to register
      navigate('/register?role=owner');
    }
  }, [navigate]);

  const handleRestaurantChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setRestaurantData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleBack = () => {
    if (step === 'details') setStep('restaurant');
    else if (step === 'queue') setStep('details');
  };

  const handleNext = async () => {
    if (step === 'restaurant') {
      if (!restaurantData.name || !restaurantData.address) {
        setError('Please fill in restaurant name and address');
        return;
      }
      setError(null);
      setStep('details');
    } else if (step === 'details') {
      setStep('queue');
    } else {
      // Complete registration
      if (!ownerData) return;

      setError(null);
      setIsLoading(true);

      try {
        const response = await authApi.registerOwner({
          name: ownerData.name,
          email: ownerData.email,
          password: ownerData.password,
          phone: ownerData.phone || undefined,
          restaurantName: restaurantData.name,
          restaurantAddress: restaurantData.address,
          restaurantType: restaurantData.type || undefined,
          restaurantDescription: restaurantData.description || undefined,
          restaurantLongDescription: restaurantData.longDescription || undefined,
          restaurantMenuText: restaurantData.menuText || undefined,
          initialQueueName: queueName || undefined,
        });

        if (response.success && response.data) {
          // Clear session storage
          sessionStorage.removeItem('ownerRegistration');

          // Login the user
          login(response.data.user, response.data.token);

          navigate('/owner/dashboard', { replace: true });
        } else {
          setError(response.error || 'Registration failed');
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const stepIndex = step === 'restaurant' ? 0 : step === 'details' ? 1 : 2;

  return (
    <div className="page-container-full min-h-screen flex flex-col">
      {/* Header with back button */}
      {step !== 'restaurant' && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-6 h-6 text-navy-600" />
        </button>
      )}

      {/* Progress Bar */}
      <div className="flex gap-2 px-6 pt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-brand-500' : 'bg-navy-200'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col overflow-y-auto">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {step === 'restaurant' && (
          <>
            <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
              Tell us about your place
            </h1>
            <p className="text-navy-500 mb-8">
              Customers will see this on the app.
            </p>

            {/* Photo Upload */}
            <button className="w-full aspect-[2/1] border-2 border-dashed border-navy-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-navy-400 hover:border-brand-300 hover:text-brand-500 transition-colors mb-6">
              <Camera className="w-8 h-8" />
              <span className="font-medium">Upload Cover Photo</span>
              <span className="text-xs">(Coming soon)</span>
            </button>

            <div className="space-y-5 flex-1">
              <InputField
                label="Restaurant Name"
                placeholder="e.g. Joe's Diner"
                value={restaurantData.name}
                onChange={handleRestaurantChange('name')}
                required
              />

              <InputField
                label="Address"
                placeholder="Street Address"
                value={restaurantData.address}
                onChange={handleRestaurantChange('address')}
                icon={<MapPin className="w-5 h-5" />}
                required
              />

              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">
                  Restaurant Type
                </label>
                <select
                  value={restaurantData.type}
                  onChange={handleRestaurantChange('type')}
                  className="w-full px-4 py-4 rounded-2xl bg-navy-50 border border-navy-100 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Select type...</option>
                  {RESTAURANT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authentic Italian cuisine in the heart of downtown"
                  value={restaurantData.description}
                  onChange={handleRestaurantChange('description')}
                  maxLength={100}
                  className="w-full px-4 py-4 rounded-2xl bg-navy-50 border border-navy-100 text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <p className="text-xs text-navy-400 mt-1">{restaurantData.description.length}/100</p>
              </div>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
              Add more details
            </h1>
            <p className="text-navy-500 mb-8">
              Help customers know what to expect.
            </p>

            <div className="space-y-5 flex-1">
              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">
                  Detailed Description (Optional)
                </label>
                <textarea
                  placeholder="Tell customers more about your restaurant, atmosphere, specialties..."
                  value={restaurantData.longDescription}
                  onChange={handleRestaurantChange('longDescription')}
                  rows={4}
                  className="w-full px-4 py-4 rounded-2xl bg-navy-50 border border-navy-100 text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Menu (Text)
                  </div>
                </label>
                <textarea
                  placeholder="List your menu items, prices, and descriptions...

Example:
🍝 Pasta
- Spaghetti Carbonara - $15
- Fettuccine Alfredo - $14

🍕 Pizza
- Margherita - $12
- Pepperoni - $14"
                  value={restaurantData.menuText}
                  onChange={handleRestaurantChange('menuText')}
                  rows={10}
                  className="w-full px-4 py-4 rounded-2xl bg-navy-50 border border-navy-100 text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none font-mono text-sm"
                />
              </div>
            </div>
          </>
        )}

        {step === 'queue' && (
          <>
            <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
              Set up your first queue
            </h1>
            <p className="text-navy-500 mb-8">
              You can add more queues later from your dashboard.
            </p>

            <div className="space-y-5 flex-1">
              <InputField
                label="Queue Name"
                placeholder="e.g. Main Queue, Lunch Rush"
                value={queueName}
                onChange={(e) => setQueueName(e.target.value)}
              />

              <div className="bg-brand-50 rounded-2xl p-4">
                <h3 className="font-medium text-brand-700 mb-2">💡 Tips</h3>
                <ul className="text-sm text-brand-600 space-y-1">
                  <li>• Use descriptive names like "Dine-in" or "Takeout"</li>
                  <li>• You can create multiple queues for different services</li>
                  <li>• Each queue gets its own QR code for customers</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Bottom Button */}
        <div className="mt-6">
          <AppButton fullWidth onClick={handleNext} disabled={isLoading}>
            {isLoading
              ? 'Creating account...'
              : step === 'queue'
                ? 'Finish Setup'
                : 'Next Step'}
          </AppButton>
          
          {step === 'details' && (
            <button
              onClick={() => setStep('queue')}
              className="w-full mt-3 py-3 text-navy-500 font-medium"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerOnboardingPage;
