---
name: finsight
description: FinSight AI personal finance assistant — Next.js 16 frontend on Replit + Python FastAPI backend on AWS Lambda + Supabase pgvector + Voyage AI + Claude
---

# FinSight Developer Guide

## Architecture at a Glance

```
Frontend (Replit Autoscale)     Backend (AWS Lambda + API Gateway)       Data (Supabase)
Next.js 16 / React 19           FastAPI + Mangum                         PostgreSQL + pgvector
TypeScript / Tailwind v4        Python 3.12 / Lambda container           voyage-finance-2 vectors (1024-dim)
                            ↓                                        ↓
                    parse → chunk → embed → store           match_chunks() RPC
                         (pipeline.py)                       (cosine similarity)
```

**RAG flow:** User uploads file → `pipeline.py` parses/chunks/embeds/stores → user asks question → backend embeds query via Voyage AI → `match_chunks` RPC → top-5 chunks passed to Claude (`claude-sonnet-4-5`) → answer + sources returned.

---

## Key Files

### Frontend (`/`)
| File | Purpose |
|------|---------|
| `app/page.tsx` | Main UI shell; file validation (PDF/CSV/PNG/JPG ≤ 6 MB), upload polling loop |
| `app/layout.tsx` | Root layout; wraps in `AppProvider` |
| `context/AppContext.tsx` | Global state via `useReducer`; actions: ADD/UPDATE_DOCUMENT, ADD/UPDATE_MESSAGE |
| `lib/api.ts` | All backend calls: `uploadDocument`, `queryDocuments`, `listDocuments` |
| `lib/types.ts` | `FinDocument`, `ChatMessage`, `QueryResponse`, `SourceChunk` |
| `components/chat/` | `ChatInterface`, `ChatInput`, `ChatMessage`, `SourcesPanel` |
| `components/upload/` | `FileUploadZone` (drag-drop), `DocumentList` (status badges) |
| `components/dashboard/` | `DashboardCards` — currently static placeholders |
| `.env.local` | `NEXT_PUBLIC_BACKEND_URL` → AWS API Gateway URL |

### Backend (`/backend/`)
| File | Purpose |
|------|---------|
| `main.py` | FastAPI app; endpoints `/upload`, `/query`, `/documents`, `/documents/{id}` |
| `pipeline.py` | Orchestrates: parse → chunk → embed → upsert to Supabase |
| `parse.py` | PDF (PyMuPDF/fitz), CSV (pandas), images (pytesseract) |
| `chunk.py` | 500-token target, 50-token overlap; CSV: row-boundary aware, always includes header |
| `embed.py` | Voyage AI `voyage-finance-2`, batch_size=128, `input_type="document"/"query"` |
| `db.py` | Supabase client (`@lru_cache`), CRUD, `similarity_search()` via `match_chunks` RPC |
| `search.py` | Orchestrates query embedding + similarity search |
| `schema.sql` | pgvector schema; `ivfflat` index; `match_chunks` RPC (1 - cosine distance) |
| `Dockerfile` | `public.ecr.aws/lambda/python:3.12` → `CMD ["main.handler"]` |
| `requirements.txt` | Pinned deps — do not upgrade without testing |

---

## Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=https://ntub0xat7i.execute-api.us-east-1.amazonaws.com
```

**Backend** (`backend/.env`):
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
VOYAGE_API_KEY=...
ANTHROPIC_API_KEY=...   # auto-loaded by Anthropic SDK from env
```

---

## Running Locally

```bash
# Frontend
npm run dev              # starts Next.js dev server on :3000

# Backend (from /backend)
uvicorn main:app --reload --port 8000

# Frontend falls back to http://localhost:8000 when NEXT_PUBLIC_BACKEND_URL is unset
```

---

## Deploying

### Backend → AWS Lambda
```bash
# Build for Lambda (linux/amd64 required — --provenance=false avoids ECR issues)
docker buildx build --platform linux/amd64 --provenance=false -t finsight-api .
# Push to ECR, then update Lambda function image
```

### Frontend → Replit
Push to main; Replit Autoscale picks up the build automatically.
`npm run build` → `postbuild` copies assets into standalone bundle.

---

## Key Patterns & Constraints

### Next.js 16 (NOT Next.js 13/14/15)
Read `node_modules/next/dist/docs/` before writing Next.js code — APIs differ from training data. All components currently use `"use client"` (no server components).

### State management
React Context + `useReducer` only — no Zustand, Redux, or external stores. Dispatch `UPDATE_DOCUMENT` / `UPDATE_MESSAGE` with partial objects; the reducer merges via spread.

### Upload polling
Frontend polls `/documents/{id}` every 2s × 30 attempts after upload. Do not swap in WebSockets without updating both sides.

### Claude call (`backend/main.py` → `_generate_answer`)
- Model: `claude-sonnet-4-5`, `max_tokens=1024`
- System prompt enforces "answer only from documents, no hallucination"
- Context formatted as numbered excerpts with filenames prepended

### Voyage AI rate limits
Free tier = 3 RPM. `test_pipeline.py` sleeps 22s between calls — don't remove those delays.

### Supabase vector search
Always goes through the `match_chunks` Postgres RPC (handles JOIN + cosine score). Do not query `document_chunks` directly for search. Schema in `backend/schema.sql`.

### CORS
Backend allows only `https://finsight--guadaiewdiukow.replit.app` and `localhost:3000`. Update `main.py` when adding new deployment URLs.

---

## Testing

```bash
# Backend end-to-end (requires real API keys in backend/.env)
cd backend && python test_pipeline.py

# Frontend lint
npm run lint

# Playwright is installed but no test files exist yet
```

---

## Known Limitations / Future Work
- `DashboardCards` is static — no real data fetching yet
- `listDocuments()` in `lib/api.ts` is defined but unused in the UI
- No authentication — `user_id` column exists in DB schema for future use
- Lambda cold starts: `DECISIONS.md` recommends ECS Fargate for production traffic
- Voyage AI free tier (3 RPM) bottlenecks batch testing
