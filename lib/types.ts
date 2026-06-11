export interface FinDocument {
  id: string;
  filename: string;
  fileType: "pdf" | "csv" | "image";
  sizeBytes: number;
  status: "uploading" | "processing" | "ready" | "error";
  uploadedAt: string; // ISO 8601
}

export interface SourceChunk {
  documentId: string;
  documentName: string;
  excerpt: string;
  relevanceScore: number; // 0–1
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface StatsResponse {
  monthlySpend: number | null;
  income: number | null;
  topCategory: string | null;
  transactionCount: number | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[]; // present on assistant messages
  createdAt: string; // ISO 8601
}
