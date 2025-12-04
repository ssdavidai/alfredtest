export default function ConnectionsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-base-300 rounded w-1/3"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-base-300 rounded"></div>
        ))}
      </div>
    </div>
  );
}
