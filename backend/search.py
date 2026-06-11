from __future__ import annotations


def query_documents(question: str, k: int = 5) -> list[dict]:
    """Embed query, search pgvector, return SourceChunk-shaped dicts."""
    from db import similarity_search
    from embed import embed_query

    vector = embed_query(question)
    rows = similarity_search(vector, k=k)

    return [
        {
            "documentId": row["document_id"],
            "documentName": row["filename"],
            "excerpt": row["content"],
            "relevanceScore": round(float(row["relevance_score"]), 4),
        }
        for row in rows
    ]


if __name__ == "__main__":
    import sys
    import json

    question = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What were my largest transactions?"
    results = query_documents(question)
    print(json.dumps(results, indent=2))
