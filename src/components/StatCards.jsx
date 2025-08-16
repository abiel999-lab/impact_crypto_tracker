export default function StatCards({ stats = [] }) {
  // stats: [{label, value, sublabel}]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">{s.label}</div>
          <div className="mt-1 text-2xl font-semibold">{s.value}</div>
          {s.sublabel && <div className="mt-1 text-xs text-neutral-400">{s.sublabel}</div>}
        </div>
      ))}
    </div>
  );
}
