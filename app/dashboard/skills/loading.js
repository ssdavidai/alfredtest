export default function SkillsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="h-8 bg-base-300 rounded w-1/4"></div>
        <div className="h-10 bg-base-300 rounded w-32"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-base-300 rounded"></div>
        ))}
      </div>
    </div>
  );
}
