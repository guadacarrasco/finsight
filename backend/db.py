from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


@lru_cache(maxsize=1)
def get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def insert_document(filename: str, file_type: str, size_bytes: int) -> str:
    client = get_client()
    row = {
        "filename": filename,
        "file_type": file_type,
        "size_bytes": size_bytes,
        "status": "processing",
    }
    result = client.table("documents").insert(row).execute()
    return result.data[0]["id"]


def update_document_status(doc_id: str, status: str) -> None:
    get_client().table("documents").update({"status": status}).eq("id", doc_id).execute()


def insert_chunks(doc_id: str, chunks: list[Any]) -> None:
    client = get_client()
    rows = [
        {
            "document_id": doc_id,
            "chunk_index": c.index,
            "content": c.text,
            "embedding": c.embedding,
            "token_count": c.token_count,
        }
        for c in chunks
    ]
    client.table("document_chunks").insert(rows).execute()


def list_documents() -> list[dict]:
    result = get_client().table("documents").select("*").order("uploaded_at", desc=True).execute()
    return result.data


def similarity_search(query_vector: list[float], k: int = 5) -> list[dict]:
    result = get_client().rpc(
        "match_chunks",
        {"query_embedding": query_vector, "match_count": k},
    ).execute()
    return result.data


if __name__ == "__main__":
    client = get_client()
    result = client.table("documents").select("id").limit(1).execute()
    print("Connection OK. documents rows:", result.data)
