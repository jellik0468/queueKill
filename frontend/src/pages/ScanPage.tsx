import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode } from 'lucide-react';
import { AppButton } from '@/components';

export function ScanPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = (result: { rawValue: string }[]) => {
    if (!result || result.length === 0) return;

    const scannedUrl = result[0].rawValue;

    try {
      const url = new URL(scannedUrl, window.location.origin);
      const pathname = url.pathname;

      let queueId: string | null = null;

      // Pattern: /restaurant/:restId/queue/:queueId
      const restaurantQueueMatch = pathname.match(/\/restaurant\/[^/]+\/queue\/([^/]+)/);
      if (restaurantQueueMatch) {
        queueId = restaurantQueueMatch[1];
      }

      // Pattern: /queue/:queueId
      const queueMatch = pathname.match(/\/queue\/([^/]+)/);
      if (!queueId && queueMatch) {
        queueId = queueMatch[1];
      }

      if (queueId) {
        setIsScanning(false);
        navigate(`/queue/${queueId}`);
      } else {
        setError('Invalid QR code. Please scan a valid queue QR code.');
      }
    } catch {
      const queueIdMatch = scannedUrl.match(/^[a-zA-Z0-9_-]+$/);
      if (queueIdMatch) {
        setIsScanning(false);
        navigate(`/queue/${scannedUrl}`);
      } else {
        setError('Invalid QR code format.');
      }
    }
  };

  const handleError = (err: Error) => {
    console.error('Scanner error:', err);
    setError('Unable to access camera. Please check permissions.');
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold">Scan QR Code</h1>
        <div className="w-10" />
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {isScanning ? (
          <div className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden relative">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{ facingMode: 'environment' }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { width: '100%', height: '100%', objectFit: 'cover' },
              }}
            />

            {/* Scan overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 border-2 border-white/50 rounded-2xl" />
              <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-xl" />
              <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-xl" />
              <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-xl" />
              <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-xl" />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-10 h-10 text-brand-500" />
            </div>
            <p className="text-white/80">Redirecting...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 px-4 py-3 bg-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <p className="text-white/60 text-center mt-6 text-sm">
          Point your camera at a restaurant's QR code to join their queue
        </p>
      </div>

      {/* Back Button */}
      <div className="p-6">
        <AppButton
          variant="outline"
          fullWidth
          onClick={() => navigate('/home')}
          className="border-white/30 text-white hover:bg-white/10"
        >
          Cancel
        </AppButton>
      </div>
    </div>
  );
}

export default ScanPage;
