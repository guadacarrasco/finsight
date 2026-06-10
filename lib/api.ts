import type { FinDocument, QueryResponse } from "@/lib/types";

const MOCK_DOC_ID = "mock-doc-001";

// module-level in-memory store (replaced by real DB on Day 3)
let _docs: FinDocument[] = [];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inferFileType(file: File): FinDocument["fileType"] {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "csv") return "csv";
  return "image";
}

// --- uploadDocument ----------------------------------------------------------

export async function uploadDocument(
  file: File,
  onStatusChange?: (status: FinDocument["status"]) => void
): Promise<FinDocument> {
  const ALLOWED_TYPES = ["application/pdf", "text/csv", "image/png", "image/jpeg", "image/jpg"];
  const ALLOWED_EXTS = ["pdf", "csv", "png", "jpg", "jpeg"];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: .${ext}. Accepted: PDF, CSV, PNG, JPG.`);
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`);
  }

  const doc: FinDocument = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    filename: file.name,
    fileType: inferFileType(file),
    sizeBytes: file.size,
    status: "uploading",
    uploadedAt: new Date().toISOString(),
  };

  _docs = [..._docs, doc];

  // walk status: uploading → processing → ready (or error for "error" filenames)
  setTimeout(() => {
    onStatusChange?.("processing");
  }, 500);

  setTimeout(() => {
    const terminal = file.name.toLowerCase().includes("error") ? "error" : "ready";
    onStatusChange?.(terminal);
  }, 1400);

  return doc;
}

// --- queryDocuments ----------------------------------------------------------

const GROCERY_RESPONSE: QueryResponse = {
  answer:
    "In March you spent $252.97 on groceries across 3 transactions.",
  sources: [
    {
      documentId: MOCK_DOC_ID,
      documentName: "march_statement.pdf",
      excerpt: "03/04  WHOLE FOODS MARKET       $87.32",
      relevanceScore: 0.94,
    },
    {
      documentId: MOCK_DOC_ID,
      documentName: "march_statement.pdf",
      excerpt: "03/11  TRADER JOE'S             $63.15",
      relevanceScore: 0.91,
    },
    {
      documentId: MOCK_DOC_ID,
      documentName: "march_statement.pdf",
      // $87.32 + $63.15 + $102.50 = $252.97
      excerpt: "03/19  WHOLE FOODS MARKET       $102.50",
      relevanceScore: 0.88,
    },
  ],
};

const INCOME_RESPONSE: QueryResponse = {
  answer:
    "Your total income last month (May) was $5,416.67 net — one pay period on a bi-monthly schedule.",
  sources: [
    {
      documentId: MOCK_DOC_ID,
      documentName: "may_paystub.pdf",
      // May 2026 (today = 2026-06-10)
      excerpt: "DIRECT DEPOSIT - ACME CORP      $5,416.67  05/15/2026",
      relevanceScore: 0.97,
    },
    {
      documentId: MOCK_DOC_ID,
      documentName: "may_paystub.pdf",
      // $6,500.00 - $1,083.33 = $5,416.67
      excerpt: "Gross Pay: $6,500.00   Federal Tax: -$1,083.33   Net: $5,416.67",
      relevanceScore: 0.85,
    },
  ],
};

const FALLBACK_RESPONSE: QueryResponse = {
  answer:
    "Based on your uploaded documents, I found relevant information that may help answer your question. Upload more statements for a more complete picture.",
  sources: [
    {
      documentId: MOCK_DOC_ID,
      documentName: "may_statement.pdf",
      excerpt: "05/02  AMAZON.COM               $43.99",
      relevanceScore: 0.61,
    },
  ],
};

export async function queryDocuments(question: string): Promise<QueryResponse> {
  await delay(800 + Math.random() * 700);

  const q = question.toLowerCase();
  if (/grocer|whole foods|trader joe|food mart/.test(q)) return GROCERY_RESPONSE;
  if (/income|salary|pay|earn/.test(q)) return INCOME_RESPONSE;
  return FALLBACK_RESPONSE;
}

// --- listDocuments -----------------------------------------------------------

export async function listDocuments(): Promise<FinDocument[]> {
  return [..._docs];
}
