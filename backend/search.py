from __future__ import annotations

_RERANK_MODEL = "rerank-2"
_CANDIDATE_MULTIPLIER = 3


def query_documents(question: str, k: int = 5) -> list[dict]:
    """Embed query, search pgvector, rerank cross-lingually, return SourceChunk-shaped dicts."""
    from db import similarity_search
    from embed import _client, embed_query

    candidate_k = min(k * _CANDIDATE_MULTIPLIER, 20)
    vector = embed_query(question)
    rows = similarity_search(vector, k=candidate_k)

    if not rows:
        return []

    docs = [r["content"] for r in rows]
    reranked = _client().rerank(question, docs, model=_RERANK_MODEL, top_k=k)

    return [
        {
            "documentId": rows[r.index]["document_id"],
            "documentName": rows[r.index]["filename"],
            "excerpt": rows[r.index]["content"],
            "relevanceScore": round(float(r.relevance_score), 4),
        }
        for r in reranked.results
    ]


if __name__ == "__main__":
    import sys
    import json

    question = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What were my largest transactions?"
    results = query_documents(question)
    print(json.dumps(results, indent=2))
