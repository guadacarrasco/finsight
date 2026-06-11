import type { FinDocument, QueryResponse, StatsResponse } from "@/lib/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- uploadDocument ----------------------------------------------------------

export async function uploadDocument(
  file: File,
  onStatusChange?: (status: FinDocument["status"]) => void
): Promise<FinDocument> {
  const ALLOWED_EXTS = ["pdf", "csv", "png", "jpg", "jpeg"];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_EXTS.includes(ext)) {
    throw new Error(`Unsupported file type: .${ext}. Accepted: PDF, CSV, PNG, JPG.`);
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 6 MB.`);
  }

  onStatusChange?.("uploading");

  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BACKEND_URL}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Upload failed: ${res.status}`);
  }
  const doc: FinDocument = await res.json();

  onStatusChange?.("processing");

  // Poll until ready or error (max 30 attempts × 2 s = 60 s timeout)
  for (let attempt = 0; attempt < 30; attempt++) {
    await delay(2000);
    const pollRes = await fetch(`${BACKEND_URL}/documents/${doc.id}`);
    if (!pollRes.ok) break;
    const updated: FinDocument = await pollRes.json();
    if (updated.status === "ready" || updated.status === "error") {
      onStatusChange?.(updated.status);
      return updated;
    }
  }

  // Timeout — treat as error
  onStatusChange?.("error");
  return { ...doc, status: "error" };
}

// --- queryDocuments ----------------------------------------------------------

export async function queryDocuments(question: string): Promise<QueryResponse> {
  const res = await fetch(`${BACKEND_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Query failed: ${res.status}`);
  }
  return res.json();
}

// --- listDocuments -----------------------------------------------------------

export async function listDocuments(): Promise<FinDocument[]> {
  const res = await fetch(`${BACKEND_URL}/documents`);
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

// --- getStats ----------------------------------------------------------------

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`${BACKEND_URL}/stats`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Stats failed: ${res.status}`);
  }
  return res.json();
}
