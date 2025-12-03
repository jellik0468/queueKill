import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: ReactNode;
  variant?: 'light' | 'dark' | 'brand';
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  rightElement,
  variant = 'light',
}: AppHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const variants = {
    light: 'bg-white text-navy-900',
    dark: 'bg-navy-900 text-white',
    brand: 'bg-brand-500 text-white',
  };

  const iconColor = {
    light: 'text-navy-600 hover:bg-navy-100',
    dark: 'text-white/80 hover:bg-white/10',
    brand: 'text-white/80 hover:bg-white/10',
  };

  return (
    <header className={`sticky top-0 z-10 ${variants[variant]}`}>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className={`p-2 rounded-full transition-colors ${iconColor[variant]}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
        </div>
        {rightElement && (
          <div>{rightElement}</div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;

