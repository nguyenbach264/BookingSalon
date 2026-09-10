const HeaderSkeleton = () => {
  return (
    <div className="flex items-center gap-3">
      
      {/* Notification skeleton */}
      <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />

      {/* Username */}
      <div className="hidden md:block w-20 h-4 rounded bg-gray-200 animate-pulse" />

    </div>
  );
};

export default HeaderSkeleton;