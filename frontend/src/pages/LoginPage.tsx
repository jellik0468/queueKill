import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AppHeader, AppButton, InputField } from '@/components';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    
    if (!email.trim()) {
      errors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Please enter your password';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data) {
        login(response.data.user, response.data.token);

        // Redirect based on role or previous location
        if (from) {
          navigate(from, { replace: true });
        } else if (response.data.user.role === 'OWNER') {
          navigate('/owner/dashboard', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container-full">
      <AppHeader showBack />

      <div className="px-6 pt-4">
        <h1 className="text-2xl font-display font-bold text-navy-900 mb-8">
          Welcome Back
        </h1>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
            }}
            icon={<Mail className="w-5 h-5" />}
            error={fieldErrors.email}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
            }}
            icon={<Lock className="w-5 h-5" />}
            error={fieldErrors.password}
          />

          <div className="pt-4">
            <AppButton type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Log In'}
            </AppButton>
          </div>
        </form>

        <p className="text-center text-navy-500 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register/role')}
            className="text-brand-500 font-semibold"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
