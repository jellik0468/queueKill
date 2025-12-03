import { useNavigate } from 'react-router-dom';
import { Utensils, Store } from 'lucide-react';
import { AppHeader } from '@/components';

export function RoleSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <AppHeader showBack title="Join QueueKill" />

      <div className="px-6 pt-12">
        <h2 className="text-2xl font-display font-bold text-navy-900 mb-8">
          How will you use
          <br />
          QueueKill?
        </h2>

        <div className="space-y-4">
          {/* Customer Option */}
          <button
            onClick={() => navigate('/register')}
            className="w-full p-5 rounded-2xl border border-navy-200 text-left hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
          >
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
              <Utensils className="w-6 h-6 text-brand-500" />
            </div>
            <h3 className="font-semibold text-navy-900 mb-1">I want to eat</h3>
            <p className="text-sm text-navy-500">
              Join queues, track wait times, and find restaurants.
            </p>
          </button>

          {/* Owner Option */}
          <button
            onClick={() => navigate('/register?role=owner')}
            className="w-full p-5 rounded-2xl border border-navy-200 text-left hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
          >
            <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-navy-200 transition-colors">
              <Store className="w-6 h-6 text-navy-600" />
            </div>
            <h3 className="font-semibold text-navy-900 mb-1">I own a restaurant</h3>
            <p className="text-sm text-navy-500">
              Manage queues, customers, and tables efficiently.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleSelectPage;
