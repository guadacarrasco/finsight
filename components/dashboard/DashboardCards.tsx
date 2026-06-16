"use client";

import { useEffect, useState } from "react";
import { getStats, listDocuments } from "@/lib/api";
import type { FinDocument, StatsResponse } from "@/lib/types";

function fmt(value: number | null, prefix = ""): string {
  if (value === null) return "—";
  return `${prefix}${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export default function DashboardCards() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [readyDocs, setReadyDocs] = useState<FinDocument[]>([]);

  useEffect(() => {
    let cancelled = false;

    listDocuments()
      .then((docs) => { if (!cancelled) setReadyDocs(docs.filter((d) => d.status === "ready")); })
      .catch(() => {});

    async function load() {
      const delays = [2000, 4000];
      for (let attempt = 0; attempt <= delays.length; attempt++) {
        try {
          const data = await getStats();
          if (cancelled) return;
          const allNull = Object.values(data).every((v) => v === null);
          if (allNull && attempt < delays.length) {
            await new Promise((r) => setTimeout(r, delays[attempt]));
            continue;
          }
          setStats(data);
          break;
        } catch {
          if (cancelled) return;
          if (attempt < delays.length) {
            await new Promise((r) => setTimeout(r, delays[attempt]));
          }
        }
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const docNote =
    readyDocs.length > 0
      ? `from: ${readyDocs.map((d) => d.filename).join(", ")}`
      : "from your documents";

  const cards = [
    {
      label: "Monthly Spend",
      value: loading ? null : fmt(stats?.monthlySpend ?? null, "$"),
      note: stats?.monthlySpend != null ? docNote : "no data yet",
    },
    {
      label: "Income",
      value: loading ? null : fmt(stats?.income ?? null, "$"),
      note: stats?.income != null ? docNote : "no data yet",
    },
    {
      label: "Top Category",
      value: loading ? null : (stats?.topCategory ?? "—"),
      note: stats?.topCategory != null ? `highest spend · ${docNote}` : "no data yet",
    },
    {
      label: "Transactions",
      value: loading ? null : fmt(stats?.transactionCount ?? null),
      note: stats?.transactionCount != null ? `total found · ${docNote}` : "no data yet",
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
