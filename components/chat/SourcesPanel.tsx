"use client";

import { useState } from "react";
import type { SourceChunk } from "@/lib/types";

interface Props {
  sources: SourceChunk[];
}

export default function SourcesPanel({ sources }: Props) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
        </svg>
        {open ? "Hide" : "Sources"} ({sources.length})
      </button>

      {open && (
        <ul className="mt-2 space-y-2">
          {sources.map((chunk, i) => (
            <li
              key={i}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-zinc-600">
                  {chunk.documentName}
                </span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {Math.round(chunk.relevanceScore * 100)}% match
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-zinc-700">{chunk.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
