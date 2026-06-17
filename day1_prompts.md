# Day 1 — Claude Code Prompts Sent by User

---

## PROMPT 1 — Initial planning prompt

I'm building a 3-day prototype called FinSight — an AI-powered personal finance assistant — as part of an engineering onboarding challenge. Today is Day 1: Frontend & Project Setup.
Your task right now: produce a detailed implementation PLAN. Do NOT write code yet. I want to review and approve the plan before any implementation starts.

Full product context (so Day 1 decisions anticipate Days 2–3)
The complete product: users upload financial documents (bank statements PDF, CSV exports, pay stubs as images), the documents get chunked, embedded, and stored in Supabase pgvector (Day 2), and a Python FastAPI backend on AWS runs RAG queries — retrieving relevant chunks and generating answers with Claude (Day 3). The frontend connects to that backend on Day 3.
Day 1 scope is frontend only, with mocked responses. But the mocks must match the exact shape the real backend will return, so Day 3 is a URL swap, not a rewire.
Day 1 deliverable
A Next.js + TypeScript app deployed on Replit (Autoscale deployment) with:

A file upload component (drag-and-drop + file picker; accepts PDF, CSV, PNG/JPG)
A chat interface for financial questions, returning mock responses
A dashboard skeleton with placeholder summary cards (spending, income, top categories)
Basic shared state: uploaded files list + chat history

Tech stack and constraints — these are decisions, not suggestions

Next.js 14+ with App Router, TypeScript, Tailwind CSS. No component libraries unless trivial (you may use shadcn/ui if it genuinely saves time, but plain Tailwind is fine).
State management: React Context + useState/useReducer only. No Redux, no Zustand, no TanStack Query. The app has two pieces of state; heavy tooling here is overengineering and will count against me.
No auth, no database, no real file storage on Day 1. Files are validated client-side and held in memory/state only.
No actual AI calls on Day 1. All responses are mocked.
Deployment target: Replit Autoscale. Relevant Replit specifics:

The run command will be npm run start after npm run build (or the Replit-detected equivalent).
The server must bind to 0.0.0.0 and respect the port Replit exposes (don't hardcode localhost).
Repl storage is a snapshot at deploy time, not persistent — another reason nothing is persisted Day 1; real files go to Supabase Storage on Day 2.



API contract — define this FIRST, everything flows from it
Create lib/types.ts and lib/api.ts as the foundation. The contract the real backend will implement on Day 3:
typescriptinterface Document {
  id: string;
  filename: string;
  fileType: 'pdf' | 'csv' | 'image';
  sizeBytes: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadedAt: string; // ISO 8601
}

interface SourceChunk {
  documentId: string;
  documentName: string;
  excerpt: string;       // the retrieved text chunk
  relevanceScore: number; // 0–1
}

interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[]; // present on assistant messages
  createdAt: string;
}
lib/api.ts exposes async functions with the signatures the real backend will have:

uploadDocument(file: File): Promise<Document> — mock: simulates upload with realistic delays, walks the status through uploading → processing → ready
queryDocuments(question: string): Promise<QueryResponse> — mock: see below
listDocuments(): Promise<Document[]> — mock: returns current in-memory list

On Day 3, only the internals of lib/api.ts change to call the real AWS endpoints (POST /upload, POST /query, GET /documents). Plan for this by isolating ALL data access behind this module — no component calls fetch directly.
Mock behavior requirements (this is the demo, make it feel real)

The query mock should recognize 2–3 canned questions and return distinct, realistic answers with realistic source chunks. Examples:

"How much did I spend on groceries in March?" → answer citing 2–3 excerpts that look like bank statement lines (e.g., "03/04 WHOLE FOODS MARKET $87.32")
"What was my total income last month?" → answer citing a pay stub excerpt
Anything else → a generic plausible answer with one source


Add a simulated latency of ~800–1500ms and a loading indicator so the UX matches the real backend later.
Chat must render the sources array under each assistant message as an expandable "Sources" section showing document name + excerpt. Source citation is a core feature, not a nice-to-have — a finance assistant must show its evidence.

UX requirements

Single-page layout is fine: sidebar or top section for uploaded documents, main area for chat, dashboard cards above or beside. Keep it clean and obviously functional rather than flashy.
Upload: drag-and-drop zone + click-to-browse. Client-side validation: file type (PDF/CSV/PNG/JPG), max size 10MB, show a clear error for rejected files. Each file in the list shows name, size, and live status.
Chat: message history, input with Enter-to-send, disabled state while a response is pending, auto-scroll to newest message.
Dashboard: 3–4 placeholder cards with clearly-fake data (e.g., "—" or sample numbers labeled as sample). Do NOT spend effort here; it's explicitly a skeleton.
Empty states matter: what the chat shows before any messages, what the document list shows before any uploads (this is the first thing reviewers see).

What the plan must include

File/folder structure — every file you intend to create, one line each on what it contains
Build order — numbered sequence of implementation steps, each independently verifiable, foundation first (types → api mock → state/context → upload → chat → dashboard → layout polish)
Component tree — which components exist, their props, where state lives
State design — exact shape of the Context value(s)
Replit deployment checklist — what must be true in package.json / next.config / run command for Autoscale to work
Risks & unknowns — anything you're unsure about regarding Replit + Next.js specifically, flagged for me to verify early
What you are deliberately NOT doing — a short list (no auth, no persistence, no real uploads, etc.) so scope is explicit

Working style

After I approve the plan, we'll implement step by step following the build order. Commit after each completed step with a clear conventional commit message (e.g., feat: add document upload with client-side validation).
Also create a DECISIONS.md at the repo root. After the plan is approved, write the Day 1 entries: state management choice, deployment type choice (Autoscale over Reserved VM — scales to zero, variable cost fits a prototype with no background work; cold start of 1–2s acceptable), mock-contract-first approach. Keep each entry to 3–5 lines: decision, alternative considered, why.
Bias toward the simplest thing that works. If you're choosing between two approaches and one is "more impressive," pick the simpler one and note it in DECISIONS.md. The reviewers explicitly value necessary over complex.
If anything in this brief is ambiguous or contradictory, list your questions at the TOP of the plan instead of guessing.

Produce the plan now.
---

## PROMPT 2 — Plan approval with 4 changes
Plan approved with 4 changes before implementation:

1. BUILD ORDER: Move step 14 (Replit deployment config + first deploy) to immediately after step 1. Deploy the blank scaffold to Autoscale before building any features — I want deployment risk burned down in hour 1, not hour 7. Renumber the rest accordingly.

2. UPLOAD MOCK: Remove the 5% random error. Make the error state deterministic: any file whose name contains "error" gets status 'error'. I need to demo the error state on purpose, never by accident.

3. MOCK DATA CONSISTENCY: The cited source excerpts must sum exactly to the totals claimed in the answers, and dates must be consistent. This is a finance app — reviewers will check the math.

4. API DESIGN: Replace the setDispatch initializer with a callback param: uploadDocument(file: File, onStatusChange?: (status: Document['status']) => void). The caller (page.tsx) owns dispatching. This signature must survive Day 3 unchanged.

After these edits, proceed with implementation step by step, committing after each verified step.

---

## PROMPT 3 — Diagnostic: show current files before changes
Show me the current content of:
1. package.json (full devDependencies section)
2. next.config.ts (full file)
3. scripts/postbuild.mjs or the postbuild entry in package.json

Don't change anything yet — just show me.

---

## PROMPT 4 — allowedDevOrigins fix + continue steps 3-5
One small fix needed, then continue with the build order from step 3.

First: add allowedDevOrigins to next.config.ts — Next.js 16 blocks cross-origin requests by default, this is needed for the Replit preview to work:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.replit.dev"],
};
```

Commit: "fix: add allowedDevOrigins for Replit dev preview"

Then: continue with steps 3, 4, 5 (types, mock api, context) — commit after each one is verified. Show me each commit message before moving to the next step.

---

## PROMPT 5 — Steps 6 and 7: FileUploadZone + DocumentList
Continue with steps 6 and 7 together — FileUploadZone and DocumentList.
These are tightly coupled (upload creates documents, list displays them)
so build and verify them together before committing. Show me a quick
description of the drag-drop validation logic before writing the code.

---

## PROMPT 6 — Validation logic check before continuing
Before continuing, show me the validation logic from FileUploadZone.tsx — specifically:
1. How file type is validated (accepted types)
2. How the 10MB size limit is enforced
3. How the error state is triggered (should be deterministic: filename containing "error" triggers it, NOT random chance)

Just paste the relevant code sections, don't rewrite anything.

---

## PROMPT 7 — Steps 8, 9, 10: chat components
All three validated. Continue steps 8, 9, 10 — ChatInput, SourcesPanel, ChatMessage. Sequence matters: 8 first, then 9, then 10 which composes them. Commit after all three are verified together.

---

## PROMPT 8 — Visual check before step 11
Before step 11, run `npm run dev` and take a screenshot of the current state so I can see what's rendering. Don't start step 11 yet.

---

## PROMPT 9 — Steps 11-14: full layout composition
Components look great. Sources panel, loading bubble, empty states all correct. Continue steps 11, 12, 13, 14 — compose the full layout. After step 13 (page.tsx), pause and show me localhost:3000 before continuing to 14.

---

## PROMPT 10 — Steps 14, 15, 16: finish
Layout looks great. Continue with step 14, then steps 15 and 16.

---

## PROMPT 11 — Fix .replit deployment config
Update .replit to match this exactly, then commit and push:

```
run = "pnpm run dev"
entrypoint = "app/page.tsx"
modules = ["nodejs-24"]

[nix]
channel = "stable-24_05"

[deployment]
deploymentTarget = "autoscale"
build = ["sh", "-c", "pnpm install && pnpm run build"]
run = ["sh", "-c", "HOSTNAME=0.0.0.0 node .next/standalone/server.js"]

[agent]
expertMode = true

[[ports]]
localPort = 3000
externalPort = 80

[[ports]]
localPort = 8080
externalPort = 8080
```

Commit: "fix: correct .replit deployment commands to use pnpm at workspace root"
