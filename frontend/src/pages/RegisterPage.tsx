import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { AppHeader, AppButton, InputField } from '@/components';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') === 'owner' ? 'owner' : 'customer';
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (field: keyof FieldErrors) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Please enter your full name';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Please enter a password';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
      if (role === 'owner') {
        // For owner, just save form data and go to onboarding
        // The actual registration happens after they complete onboarding
        sessionStorage.setItem('ownerRegistration', JSON.stringify(formData));
        navigate('/owner/onboarding');
      } else {
        // Register customer
        const response = await authApi.registerCustomer({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
        });

        if (response.success && response.data) {
          login(response.data.user, response.data.token);
          navigate('/home', { replace: true });
        } else {
          setError(response.error || 'Registration failed');
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container-full">
      <AppHeader
        showBack
        title={role === 'owner' ? 'Register as Owner' : 'Create Account'}
      />

      <div className="px-6 pt-4">
        {/* Google Sign Up */}
        <button className="w-full flex items-center justify-center gap-3 py-4 border border-navy-200 rounded-2xl text-navy-700 font-medium hover:bg-navy-50 transition-colors mb-6">
          <Mail className="w-5 h-5" />
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-navy-200" />
          <span className="text-sm text-navy-400 font-medium">OR WITH EMAIL</span>
          <div className="flex-1 h-px bg-navy-200" />
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <InputField
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange('name')}
            icon={<User className="w-5 h-5" />}
            error={fieldErrors.name}
          />

          <InputField
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange('email')}
            icon={<Mail className="w-5 h-5" />}
            error={fieldErrors.email}
          />

          <InputField
            type="tel"
            placeholder="Phone Number (optional)"
            value={formData.phone}
            onChange={handleChange('phone')}
            icon={<Phone className="w-5 h-5" />}
          />

          <InputField
            type="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={handleChange('password')}
            icon={<Lock className="w-5 h-5" />}
            error={fieldErrors.password}
          />

          <div className="pt-4">
            <AppButton type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </AppButton>
          </div>
        </form>

        <p className="text-center text-navy-500 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-brand-500 font-semibold"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
