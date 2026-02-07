import { WifiOff } from 'lucide-react';

export function ConnectionBanner() {
  return (
    <div className="bg-yellow-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
      <WifiOff size={16} />
      <span>Connection lost. Reconnecting...</span>
    </div>
  );
}
