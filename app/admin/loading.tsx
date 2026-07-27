export default function AdminLoading() {
  return (
    <div className="px-4 md:px-8 py-10 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl animate-pulse"
            style={{ backgroundColor: "#1f1f1f" }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div
          className="xl:col-span-2 h-72 rounded-2xl animate-pulse"
          style={{ backgroundColor: "#1f1f1f" }}
        />
        <div className="h-72 rounded-2xl animate-pulse" style={{ backgroundColor: "#1f1f1f" }} />
      </div>
    </div>
  );
}
