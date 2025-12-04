export default function ExecutionsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-base-300 rounded w-1/3"></div>
      <div className="overflow-x-auto">
        <div className="h-12 bg-base-300 rounded mb-2"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-base-300 rounded mb-1"></div>
        ))}
      </div>
    </div>
  );
}
