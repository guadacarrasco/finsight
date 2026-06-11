from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

MODEL = "voyage-finance-2"
BATCH_SIZE = 128


def _client():
    import voyageai
    return voyageai.Client(api_key=os.environ["VOYAGE_API_KEY"])


def embed_chunks(chunks) -> list:
    """Add .embedding to each Chunk in-place (batched). Returns the same list."""
    if not chunks:
        return chunks

    texts = [c.text for c in chunks]
    client = _client()

    for batch_start in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[batch_start : batch_start + BATCH_SIZE]
        result = client.embed(batch_texts, model=MODEL, input_type="document")
        for i, vec in enumerate(result.embeddings):
            chunks[batch_start + i].embedding = vec

    return chunks


def embed_query(query: str) -> list[float]:
    result = _client().embed([query], model=MODEL, input_type="query")
    return result.embeddings[0]


if __name__ == "__main__":
    vec = embed_query("grocery spending at Whole Foods")
    print(f"dim={len(vec)}  first_3={vec[:3]}")
