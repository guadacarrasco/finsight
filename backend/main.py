from __future__ import annotations

import json
import os
import tempfile

import anthropic as _anthropic
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel

app = FastAPI(title="FinSight API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://finsight--guadaiewdiukow.replit.app",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryBody(BaseModel):
    question: str
    k: int = 5


def _to_fin_document(row: dict) -> dict:
    return {
        "id": row["id"],
        "filename": row["filename"],
        "fileType": row["file_type"],
        "sizeBytes": row["size_bytes"],
        "status": row["status"],
        "uploadedAt": row["uploaded_at"],
    }


def _generate_answer(question: str, sources: list[dict]) -> str:
    if not sources:
        return "No relevant documents found to answer this question."

    context = "\n\n".join(
        f"[{i + 1}] From {s['documentName']}:\n{s['excerpt']}"
        for i, s in enumerate(sources)
    )

    client = _anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
    msg = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        system=(
            "You are a personal finance assistant. Answer the user's question based "
            "ONLY on the provided financial document excerpts. Be specific with numbers "
            "and dates. If the answer is not in the excerpts, say so clearly. "
            "Do not make up figures. "
            "Internally consider every relevant transaction across all sources before answering, but your final response to the user should be concise — "
            "state the relevant findings directly without explaining why you included or excluded each one. "
            "Never use markdown, asterisks, bold, bullet points, or numbered lists. "
            "Write in plain prose as if speaking to the user directly."
        ),
        messages=[
            {
                "role": "user",
                "content": f"Financial document excerpts:\n\n{context}\n\nQuestion: {question}",
            }
        ],
    )
    return msg.content[0].text


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    from pipeline import process_file

    data = await file.read()
    original_name = file.filename or "upload"
    tmp_dir = None
    tmp_path = None
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, original_name)
    try:
        with open(tmp_path, "wb") as tmp:
            tmp.write(data)
        result = process_file(tmp_path)  # already returns camelCase FinDocument dict
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if tmp_dir and os.path.exists(tmp_dir):
            os.rmdir(tmp_dir)
    return result


@app.post("/query")
async def query_documents(body: QueryBody):
    from search import query_documents as search_docs

    sources = search_docs(body.question, k=body.k)
    answer = _generate_answer(body.question, sources)
    return {"answer": answer, "sources": sources}


@app.get("/documents")
async def list_documents():
    import db

    rows = db.list_documents()
    return [_to_fin_document(r) for r in rows]


@app.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    import db

    rows = db.list_documents()
    for r in rows:
        if r["id"] == doc_id:
            return _to_fin_document(r)
    raise HTTPException(status_code=404, detail="document not found")


@app.get("/stats")
async def get_stats():
    import db

    chunks = db.get_all_chunks()
    if not chunks:
        return {
            "monthlySpend": None,
            "income": None,
            "topCategory": None,
            "transactionCount": None,
        }

    context = "\n\n---\n\n".join(chunks[:60])  # cap tokens sent to Claude
    client = _anthropic.Anthropic()
    msg = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=512,
        system=(
            "You are a financial data extraction assistant. "
            "Return ONLY a valid JSON object with exactly these keys: "
            "monthlySpend (total debits/expenses as a positive float, or null), "
            "income (total credits/income as a positive float, or null), "
            "topCategory (single string for the most frequent spending category, or null), "
            "transactionCount (integer count of all transactions, or null). "
            "No explanation, no markdown, just the JSON object."
        ),
        messages=[
            {
                "role": "user",
                "content": f"Financial document excerpts:\n\n{context}\n\nExtract the stats.",
            }
        ],
    )
    try:
        raw = msg.content[0].text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        stats = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        raise HTTPException(status_code=502, detail="Failed to parse stats from documents")
    return stats


# Lambda entry point
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
