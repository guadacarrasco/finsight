# FinSight — AI Personal Finance Assistant

**Live app:** https://finsight--guadaiewdiukow.replit.app/

FinSight lets you upload your financial documents (bank statements, transaction CSVs, receipt images) and ask questions about them in plain language. It uses RAG (Retrieval-Augmented Generation) to answer based only on what's in your documents — no hallucination.

---


## How to Use

1. **Open the app** at https://finsight--guadaiewdiukow.replit.app/
2. **Upload a document** — drag and drop or click the upload zone on the left. Supported formats: PDF, CSV, PNG, JPG (max 6 MB). The status badge on the document card will walk through uploading → processing → ready.
3. **Ask a question** — type in the chat panel on the right once your document is ready. For example:
   - "What was my total spending last month?"
   - "What is my largest expense category?"
   - "How much did I spend on groceries?"
4. **Check the dashboard** — the cards at the top show aggregated stats (monthly spend, income, top category, transaction count) extracted automatically from your documents.

---

## Claude Code Skill

This project ships with a `/finsight` Claude Code skill that gives Claude full context about the architecture, key files, API endpoints, and deployment — useful when working on the codebase.

**To activate it**, run in the project directory:

```bash
/finsight
```

This loads the skill into Claude's context for the session. It covers the RAG pipeline, all API endpoints with request/response shapes, environment variables, and deploy commands for both frontend (Replit) and backend (AWS Lambda).

---


