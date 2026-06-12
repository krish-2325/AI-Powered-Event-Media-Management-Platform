// src/app/loading.tsx

export default function LoadingPage() {
  return (
    <div className="page-container">
      {/* Header skeleton */}
      <div className="page-header">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-48 rounded mt-2" />
        <div className="skeleton h-4 w-64 rounded mt-1" />
      </div>

      {/* Stats skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-6 w-16 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Card grid skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="skeleton h-44" />
            <div className="p-4 space-y-3">
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="flex justify-between pt-3 border-t border-border">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
