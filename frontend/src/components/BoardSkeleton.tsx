export function BoardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900 flex flex-col animate-[fadeIn_0.3s_ease-out]">
      {/* Header skeleton */}
      <div className="glass-strong border-b border-gray-100 dark:border-slate-700 px-4 py-2.5 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="skeleton w-5 h-5 rounded" />
            <div className="skeleton w-40 h-5 rounded" />
            <div className="skeleton w-12 h-5 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton w-48 h-7 rounded-lg hidden sm:block" />
            <div className="skeleton w-20 h-7 rounded-lg" />
            <div className="skeleton w-16 h-7 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Board skeleton */}
      <div className="flex-1 flex">
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-4 p-4">
            {[1, 2, 3].map((col) => (
              <div key={col} className="flex-1 min-w-[280px] max-w-[400px]">
                {/* Column header */}
                <div className="rounded-t-xl px-4 py-3 bg-gray-100/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="skeleton w-2 h-2 rounded-full" />
                    <div className="skeleton w-20 h-4 rounded" />
                    <div className="skeleton w-6 h-4 rounded-full" />
                  </div>
                  <div className="skeleton w-32 h-3 rounded mt-1.5 ml-4" />
                </div>

                {/* Cards skeleton */}
                <div className="bg-gray-50/80 dark:bg-slate-800/30 rounded-b-xl p-2 space-y-2">
                  {Array.from({ length: 2 + col }, (_, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3"
                    >
                      <div className="skeleton w-full h-4 rounded mb-2" />
                      <div className="skeleton w-3/4 h-4 rounded mb-3" />
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-700">
                        <div className="skeleton w-10 h-5 rounded-lg" />
                        <div className="skeleton w-16 h-3 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-64 border-l border-gray-100 dark:border-slate-700 glass p-4 space-y-6">
          {/* Timer skeleton */}
          <div>
            <div className="skeleton w-16 h-3 rounded mb-3" />
            <div className="skeleton w-full h-16 rounded-xl" />
          </div>

          {/* Participants skeleton */}
          <div>
            <div className="skeleton w-24 h-3 rounded mb-3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="skeleton w-20 h-4 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
