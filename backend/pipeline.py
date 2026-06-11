from __future__ import annotations

import os
from datetime import datetime, timezone


def process_file(path: str) -> dict:
    """Parse, chunk, embed, and store a file. Returns a FinDocument-shaped dict."""
    from chunk import chunk_text
    from db import insert_document, insert_chunks, update_document_status
    from embed import embed_chunks
    from parse import parse_file

    filename = os.path.basename(path)
    size_bytes = os.path.getsize(path)

    raw_text, file_type = parse_file(path)

    doc_id = insert_document(filename, file_type, size_bytes)
    try:
        chunks = chunk_text(raw_text, file_type)
        embed_chunks(chunks)
        insert_chunks(doc_id, chunks)
        update_document_status(doc_id, "ready")
        status = "ready"
    except Exception as exc:
        update_document_status(doc_id, "error")
        raise RuntimeError(f"Pipeline failed for {filename}: {exc}") from exc

    return {
        "id": doc_id,
        "filename": filename,
        "fileType": file_type,
        "sizeBytes": size_bytes,
        "status": status,
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python pipeline.py <file_path>")
        sys.exit(1)
    result = process_file(sys.argv[1])
    import json
    print(json.dumps(result, indent=2))
