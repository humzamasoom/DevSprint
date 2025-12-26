export default function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      {/* Title skeleton */}
      <div className="flex items-start justify-between mb-2">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-5 w-5 bg-gray-200 rounded"></div>
      </div>

      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>

      {/* Avatars skeleton */}
      <div className="flex -space-x-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white"></div>
        ))}
      </div>
    </div>
  );
}

