import { WifiOff } from 'lucide-react';

export function ConnectionBanner() {
  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 animate-[fadeIn_0.3s_ease-out]">
      <WifiOff size={14} />
      <span>接続が切れました。再接続中...</span>
      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}
