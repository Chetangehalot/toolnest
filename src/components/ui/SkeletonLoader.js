// Reusable Skeleton Loader Components
export const CardSkeleton = ({ className = "" }) => (
  <div className={`bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 animate-pulse ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-[#00FFE0]/10 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-6 bg-[#00FFE0]/10 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-[#00FFE0]/10 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-3 mb-4">
      <div className="h-4 bg-[#00FFE0]/10 rounded w-full"></div>
      <div className="h-4 bg-[#00FFE0]/10 rounded w-5/6"></div>
      <div className="h-4 bg-[#00FFE0]/10 rounded w-2/3"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-6 bg-[#00FFE0]/10 rounded-full w-16"></div>
      <div className="h-6 bg-[#00FFE0]/10 rounded-full w-20"></div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-8">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 bg-[#00FFE0]/10 rounded w-64 mb-2"></div>
        <div className="h-5 bg-[#00FFE0]/10 rounded w-96"></div>
      </div>
      <div className="h-10 bg-[#00FFE0]/10 rounded w-32"></div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-[#00FFE0]/10 rounded w-20 mb-2"></div>
              <div className="h-8 bg-[#00FFE0]/10 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-[#00FFE0]/10 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Content Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl overflow-hidden animate-pulse">
    {/* Table Header */}
    <div className="bg-[#0A0F24]/50 p-6 border-b border-[#00FFE0]/10">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-5 bg-[#00FFE0]/10 rounded w-24"></div>
        ))}
      </div>
    </div>
    
    {/* Table Rows */}
    <div className="divide-y divide-[#00FFE0]/10">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-6">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {[...Array(cols)].map((_, j) => (
              <div key={j} className="h-4 bg-[#00FFE0]/10 rounded w-full"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 animate-pulse">
    <div className="space-y-6">
      {/* Form Header */}
      <div className="h-8 bg-[#00FFE0]/10 rounded w-48 mb-8"></div>
      
      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="h-5 bg-[#00FFE0]/10 rounded w-24 mb-2"></div>
          <div className="h-12 bg-[#00FFE0]/10 rounded-xl w-full"></div>
        </div>
        <div>
          <div className="h-5 bg-[#00FFE0]/10 rounded w-32 mb-2"></div>
          <div className="h-12 bg-[#00FFE0]/10 rounded-xl w-full"></div>
        </div>
      </div>
      
      <div>
        <div className="h-5 bg-[#00FFE0]/10 rounded w-28 mb-2"></div>
        <div className="h-32 bg-[#00FFE0]/10 rounded-xl w-full"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="h-5 bg-[#00FFE0]/10 rounded w-20 mb-2"></div>
            <div className="h-12 bg-[#00FFE0]/10 rounded-xl w-full"></div>
          </div>
        ))}
      </div>
      
      {/* Form Actions */}
      <div className="flex gap-4 pt-6">
        <div className="h-12 bg-[#00FFE0]/10 rounded-xl w-32"></div>
        <div className="h-12 bg-[#00FFE0]/10 rounded-xl w-24"></div>
      </div>
    </div>
  </div>
);

export const BlogCardSkeleton = ({ className = "" }) => (
  <div className={`bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl overflow-hidden animate-pulse ${className}`}>
    {/* Image */}
    <div className="aspect-video bg-[#00FFE0]/10"></div>
    
    {/* Content */}
    <div className="p-6 space-y-4">
      {/* Categories */}
      <div className="flex gap-2">
        <div className="h-6 bg-[#00FFE0]/10 rounded-full w-16"></div>
        <div className="h-6 bg-[#00FFE0]/10 rounded-full w-20"></div>
      </div>
      
      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 bg-[#00FFE0]/10 rounded w-full"></div>
        <div className="h-6 bg-[#00FFE0]/10 rounded w-3/4"></div>
      </div>
      
      {/* Excerpt */}
      <div className="space-y-2">
        <div className="h-4 bg-[#00FFE0]/10 rounded w-full"></div>
        <div className="h-4 bg-[#00FFE0]/10 rounded w-5/6"></div>
        <div className="h-4 bg-[#00FFE0]/10 rounded w-2/3"></div>
      </div>
      
      {/* Meta */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-full"></div>
          <div>
            <div className="h-4 bg-[#00FFE0]/10 rounded w-20 mb-1"></div>
            <div className="h-3 bg-[#00FFE0]/10 rounded w-16"></div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-4 bg-[#00FFE0]/10 rounded w-12"></div>
          <div className="h-4 bg-[#00FFE0]/10 rounded w-12"></div>
        </div>
      </div>
    </div>
  </div>
);

export const ReviewSkeleton = ({ className = "" }) => (
  <div className={`bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 animate-pulse ${className}`}>
    {/* Review Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-6 h-6 bg-[#00FFE0]/10 rounded"></div>
          ))}
        </div>
        <div className="h-4 bg-[#00FFE0]/10 rounded w-40"></div>
      </div>
    </div>
    
    {/* Review Content */}
    <div className="space-y-3 mb-6">
      <div className="h-4 bg-[#00FFE0]/10 rounded w-full"></div>
      <div className="h-4 bg-[#00FFE0]/10 rounded w-5/6"></div>
      <div className="h-4 bg-[#00FFE0]/10 rounded w-3/4"></div>
    </div>
    
    {/* Pros/Cons */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[#0A0F24] rounded-xl p-4">
        <div className="h-5 bg-[#00FFE0]/10 rounded w-16 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-[#00FFE0]/10 rounded w-full"></div>
          <div className="h-3 bg-[#00FFE0]/10 rounded w-4/5"></div>
        </div>
      </div>
      <div className="bg-[#0A0F24] rounded-xl p-4">
        <div className="h-5 bg-[#00FFE0]/10 rounded w-16 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-[#00FFE0]/10 rounded w-full"></div>
          <div className="h-3 bg-[#00FFE0]/10 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  </div>
);

export const NotificationSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="p-4 bg-[#0A0F24]/50 rounded-xl border border-[#00FFE0]/10 animate-pulse">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-[#00FFE0]/10 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#00FFE0]/10 rounded w-3/4"></div>
            <div className="h-3 bg-[#00FFE0]/10 rounded w-full"></div>
            <div className="h-3 bg-[#00FFE0]/10 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const UserCardSkeleton = ({ className = "" }) => (
  <div className={`bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 animate-pulse ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 bg-[#00FFE0]/10 rounded-full"></div>
      <div className="flex-1">
        <div className="h-6 bg-[#00FFE0]/10 rounded w-32 mb-2"></div>
        <div className="h-4 bg-[#00FFE0]/10 rounded w-48"></div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <div className="h-4 bg-[#00FFE0]/10 rounded w-16 mb-1"></div>
        <div className="h-6 bg-[#00FFE0]/10 rounded w-8"></div>
      </div>
      <div>
        <div className="h-4 bg-[#00FFE0]/10 rounded w-20 mb-1"></div>
        <div className="h-6 bg-[#00FFE0]/10 rounded w-12"></div>
      </div>
    </div>
    
    <div className="flex gap-2">
      <div className="h-8 bg-[#00FFE0]/10 rounded w-16"></div>
      <div className="h-8 bg-[#00FFE0]/10 rounded w-20"></div>
    </div>
  </div>
);

// General SkeletonLoader component that can render different types
export const SkeletonLoader = ({ type = "card", className = "", ...props }) => {
  switch (type) {
    case 'card':
      return <CardSkeleton className={className} {...props} />;
    case 'dashboard':
      return <DashboardSkeleton className={className} {...props} />;
    case 'table':
      return <TableSkeleton className={className} {...props} />;
    case 'form':
      return <FormSkeleton className={className} {...props} />;
    case 'blog':
      return <BlogCardSkeleton className={className} {...props} />;
    case 'review':
      return <ReviewSkeleton className={className} {...props} />;
    case 'notification':
      return <NotificationSkeleton className={className} {...props} />;
    case 'user':
      return <UserCardSkeleton className={className} {...props} />;
    default:
      return <CardSkeleton className={className} {...props} />;
  }
}; 
