import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { AppButton } from '@/components';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-8 flex flex-col max-w-md mx-auto">
      {/* Spacer */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-500/30">
          <Clock className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-display font-bold text-navy-900 mb-3">QueueKill</h1>

        {/* Tagline */}
        <p className="text-navy-500 text-center leading-relaxed">
          Skip the line. Manage the wait.
          <br />
          Dining made simple.
        </p>
      </div>

      {/* Buttons */}
      <div className="space-y-3 pb-8">
        <AppButton fullWidth onClick={() => navigate('/login')}>
          Log In
        </AppButton>

        <AppButton variant="outline" fullWidth onClick={() => navigate('/register/role')}>
          Create Account
        </AppButton>
      </div>
    </div>
  );
}

export default WelcomePage;
