"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

function fmt(value: number | null, prefix = ""): string {
  if (value === null) return "—";
  return `${prefix}${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export default function DashboardCards() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(attempt: number) {
      try {
        const data = await getStats();
        if (cancelled) return;
        const allNull = Object.values(data).every((v) => v === null);
        if (allNull && attempt === 0) {
          setTimeout(() => load(1), 3000);
          return;
        }
        setStats(data);
      } catch (err) {
        console.error("[DashboardCards] /stats failed:", err);
        if (!cancelled && attempt === 0) {
          setTimeout(() => load(1), 3000);
          return;
        }
      }
      if (!cancelled) setLoading(false);
    }

    load(0);
    return () => { cancelled = true; };
  }, []);

  const cards = [
    {
      label: "Monthly Spend",
      value: loading ? null : fmt(stats?.monthlySpend ?? null, "$"),
      note: stats?.monthlySpend != null ? "from your documents" : "no data yet",
    },
    {
      label: "Income",
      value: loading ? null : fmt(stats?.income ?? null, "$"),
      note: stats?.income != null ? "from your documents" : "no data yet",
    },
    {
      label: "Top Category",
      value: loading ? null : (stats?.topCategory ?? "—"),
      note: stats?.topCategory != null ? "highest spend" : "no data yet",
    },
    {
      label: "Transactions",
      value: loading ? null : fmt(stats?.transactionCount ?? null),
      note: stats?.transactionCount != null ? "total found" : "no data yet",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value, note }) => (
        <div
          key={label}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {label}
          </p>
          {value === null ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-zinc-100" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-zinc-800">{value}</p>
          )}
          <p className="text-xs text-zinc-400">{note}</p>
        </div>
      ))}
    </div>
  );
}
