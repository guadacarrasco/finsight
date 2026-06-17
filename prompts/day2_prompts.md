# Day 2 — Claude Code Prompts Sent by User

---

## PROMPT 1 — Initial Day 2 planning prompt

I'm building FinSight, a 3-day AI-powered personal finance assistant.
Day 1 is complete and deployed. Today is **Day 2: Document Processing & Embeddings**.

**Your task right now: produce a detailed implementation PLAN. Do NOT write
any code yet.** I will review and approve before implementation starts.

### What exists from Day 1

- Next.js 14 + TypeScript + Tailwind frontend deployed at
  finsight--guadaiewdiukow.replit.app
- `lib/types.ts` — shared interfaces: `FinDocument`, `SourceChunk`,
  `QueryResponse`, `ChatMessage`
- `lib/api.ts` — mock API layer with these function signatures:
  - `uploadDocument(file: File, onStatusChange?: (status) => void): Promise<FinDocument>`
  - `queryDocuments(question: string): Promise<QueryResponse>`
  - `listDocuments(): Promise<FinDocument[]>`
- Upload UI with status badges (uploading → processing → ready → error)
- Chat UI that renders answers with cited SourceChunk[] (document name,
  excerpt, relevanceScore)
- Day 3 plan: replace lib/api.ts internals to call a real Python/FastAPI
  backend on AWS. The function signatures must NOT change.

### Day 2 goal

Build the document processing pipeline. By end of day:
- A Supabase project with pgvector enabled and two tables
- A Python script that takes a file, chunks it, embeds it, stores it
- A similarity search function: given a query string, return top-k chunks
- End-to-end test: upload a sample bank statement → chunk → embed → query
  → get back relevant text chunks

### Tech decisions — these are decided, not suggestions

**Supabase:** pgvector extension, two tables:
- `documents` — id (uuid), filename, file_type, size_bytes, status,
  uploaded_at, user_id (nullable for now)
- `document_chunks` — id (uuid), document_id (fk), chunk_index,
  content (text), embedding (vector), token_count, created_at

**Embeddings:** Voyage AI `voyage-finance-2` model.
Reason: Anthropic does not offer an embeddings API — they recommend
Voyage AI as their embedding partner, and `voyage-finance-2` is
domain-specific for financial documents, improving retrieval quality
for financial terminology. Do NOT use OpenAI embeddings.
Voyage AI Python SDK: `pip install voyageai`
Embedding dimension for `voyage-finance-2`: 1024

**Chunking strategy:**
- Target ~500 tokens per chunk with 50-token overlap
- For structured financial documents (bank statements, CSV): line-aware
  chunking — never split a transaction line across chunks
- For PDFs: use PyMuPDF (fitz) for text extraction
- For CSVs: pandas, one logical chunk per N rows with overlap
- For images: pytesseract OCR then treat as text

**Python environment:**
- Python 3.11+
- Dependencies: voyageai, supabase, PyMuPDF, pandas, pytesseract,
  tiktoken, python-dotenv
- All scripts live in a new `backend/` directory at the repo root
- Environment variables in `backend/.env` (gitignored):
  SUPABASE_URL, SUPABASE_SERVICE_KEY, VOYAGE_API_KEY

**Similarity search:**
- Use pgvector's `<=>` cosine distance operator
- Top-k = 5 by default
- Return: chunk content, document filename, relevance score (1 - distance)
- Implement as a Supabase RPC function (SQL) callable from Python

### What the plan must include

1. Setup checklist — exact Supabase dashboard steps
2. File/folder structure — every new file under backend/
3. SQL schema — exact CREATE TABLE statements and RPC function
4. Pipeline architecture — text diagram of ingest and query paths
5. Implementation build order — numbered, each independently verifiable
6. Test data — sample files spec with realistic financial content
7. Day 3 interface contract — POST /upload, POST /query, GET /documents
8. Risks & unknowns — flag at top
9. What we are deliberately NOT doing today

### Working style

- After I approve the plan, implement step by step following the build order
- Commit after each completed, verified step
- Add Day 2 entries to DECISIONS.md as we go
- Bias toward simplest thing that works
- If anything is ambiguous, list questions at the TOP of the plan
- Verify each step actually works — show me output, not "it should work"

Produce the plan now.

---

## PROMPT 2 — Plan approval with 3 changes

Plan approved with 3 changes before implementation:

1. VOYAGE AI VERSION: Before writing requirements.txt, confirm the exact
   current stable version of voyageai SDK and the correct method signature
   for batch embedding. Show me: `pip index versions voyageai` output and
   confirm the Client().embed() API hasn't changed.

2. IVFFLAT LISTS: Change `lists = 100` to `lists = 1` in the index
   definition. IVFFlat needs ~300 rows to be meaningful at lists=100 —
   with 2 sample files we'll have ~15 chunks. Add a comment in schema.sql:
   "-- tune lists= in production (rule of thumb: sqrt(num_rows))".
   Note this in DECISIONS.md Day 2 entries.

3. FASTAPI STUBS: Replace `raise NotImplementedError` with proper HTTP 501
   responses so uvicorn starts cleanly:
   `return JSONResponse({"error": "not implemented"}, status_code=501)`

After these changes, proceed with Step 1. Show me the verify output for
each step before moving to the next — exact terminal output, not
"it should work."

---

## PROMPT 3 — Credentials and schema confirmation

Done — .env created with real credentials, schema.sql executed
successfully in Supabase (ran without RLS). Both tables and
match_chunks RPC confirmed. Continue with Steps 5, 6, 7, 8, 9.
Show me verify output for each before moving to the next.

---

## PROMPT 4 — Security check

You didn't submit .env to repo right?
