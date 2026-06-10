"use client";

import type { FinDocument } from "@/lib/types";

interface Props {
  documents: FinDocument[];
}

const STATUS_BADGE: Record<FinDocument["status"], { label: string; classes: string }> = {
  uploading:  { label: "Uploading…",  classes: "bg-zinc-100 text-zinc-500" },
  processing: { label: "Processing…", classes: "bg-yellow-100 text-yellow-700" },
  ready:      { label: "Ready",       classes: "bg-green-100 text-green-700" },
  error:      { label: "Error",       classes: "bg-red-100 text-red-700" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentList({ documents }: Props) {
  if (documents.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-zinc-400">
        No documents yet — upload a file above.
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-2">
      {documents.map((doc) => {
        const badge = STATUS_BADGE[doc.status];
        return (
          <li
            key={doc.id}
            className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-800">{doc.filename}</p>
              <p className="text-xs text-zinc-400">{formatBytes(doc.sizeBytes)}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.classes}`}
            >
              {badge.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
