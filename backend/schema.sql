-- schema.sql — run in Supabase SQL Editor; idempotent

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    filename     text NOT NULL,
    file_type    text NOT NULL CHECK (file_type IN ('pdf', 'csv', 'image')),
    size_bytes   integer NOT NULL,
    status       text NOT NULL DEFAULT 'processing'
                   CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
    uploaded_at  timestamptz NOT NULL DEFAULT now(),
    user_id      uuid  -- nullable; auth added on Day 3+
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index  integer NOT NULL,
    content      text NOT NULL,
    embedding    vector(1024) NOT NULL,
    token_count  integer NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- lists=1 for dev/testing (IVFFlat needs ~300 rows before tuning matters;
-- in production set lists = sqrt(num_rows))
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
    ON document_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 1);

-- RPC: cosine similarity search, returns top-k chunks across ready documents
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding  vector(1024),
    match_count      int DEFAULT 5
)
RETURNS TABLE (
    chunk_id        uuid,
    document_id     uuid,
    filename        text,
    content         text,
    relevance_score float
)
LANGUAGE sql STABLE AS $$
    SELECT
        c.id               AS chunk_id,
        c.document_id,
        d.filename,
        c.content,
        1 - (c.embedding <=> query_embedding)  AS relevance_score
    FROM document_chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE d.status = 'ready'
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
$$;
