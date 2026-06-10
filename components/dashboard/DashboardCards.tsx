const CARDS = [
  { label: "Monthly Spend", value: "$—", note: "sample" },
  { label: "Income", value: "$—", note: "sample" },
  { label: "Top Category", value: "—", note: "sample" },
  { label: "Transactions", value: "—", note: "sample" },
] as const;

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map(({ label, value, note }) => (
        <div
          key={label}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-800">{value}</p>
          <p className="text-xs text-zinc-400">{note}</p>
        </div>
      ))}
    </div>
  );
}
