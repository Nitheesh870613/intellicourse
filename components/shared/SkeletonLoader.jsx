'use client';

export function CourseCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden border border-white/10">
      <div className="h-48 bg-gradient-to-br from-gray-700/50 to-gray-800/50"></div>
      <div className="p-6 bg-gray-800/50 backdrop-blur-xl space-y-4">
        <div className="h-6 bg-gray-700/50 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
        <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-gray-700/50 rounded w-24"></div>
          <div className="h-8 bg-gray-700/50 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export function CourseListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="h-32 bg-gray-800/50 backdrop-blur-xl rounded-2xl animate-pulse border border-white/10"></div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-800/50 backdrop-blur-xl rounded-xl animate-pulse border border-white/10"></div>
        ))}
      </div>
      
      {/* Courses grid skeleton */}
      <CourseListSkeleton count={6} />
    </div>
  );
}

export function ModuleSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-700/50 rounded w-1/3"></div>
      <div className="h-64 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-white/10"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
        <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700/50 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function ShimmerLoader({ className = "h-64" }) {
  return (
    <div className={`relative overflow-hidden bg-gray-800/50 backdrop-blur-xl rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  );
}
