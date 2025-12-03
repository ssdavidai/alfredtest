export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-base-300 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-base-300 rounded"></div>
        ))}
      </div>
      <div className="h-64 bg-base-300 rounded"></div>
    </div>
  );
}
