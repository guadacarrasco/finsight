from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Chunk:
    text: str
    index: int
    token_count: int
    embedding: list[float] = field(default_factory=list)


def chunk_text(
    text: str,
    file_type: str,
    target: int = 500,
    overlap: int = 50,
) -> list[Chunk]:
    if file_type == "csv":
        return _chunk_csv(text, target, overlap)
    return _chunk_text_sliding(text, target, overlap)


def _tokenize(text: str) -> list[int]:
    import tiktoken
    enc = tiktoken.get_encoding("cl100k_base")
    return enc.encode(text)


def _decode(tokens: list[int]) -> str:
    import tiktoken
    enc = tiktoken.get_encoding("cl100k_base")
    return enc.decode(tokens)


def _chunk_text_sliding(text: str, target: int, overlap: int) -> list[Chunk]:
    tokens = _tokenize(text)
    if not tokens:
        return []

    chunks: list[Chunk] = []
    start = 0
    idx = 0
    while start < len(tokens):
        end = min(start + target, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(Chunk(
            text=_decode(chunk_tokens),
            index=idx,
            token_count=len(chunk_tokens),
        ))
        if end == len(tokens):
            break
        start = end - overlap
        idx += 1

    return chunks


def _chunk_csv(text: str, target: int, overlap: int) -> list[Chunk]:
    """Row-boundary-aware chunking for CSV text output."""
    lines = text.splitlines(keepends=True)
    if not lines:
        return []

    header = lines[0]
    data_lines = lines[1:]

    chunks: list[Chunk] = []
    idx = 0
    i = 0

    while i < len(data_lines):
        accumulated: list[str] = [header]
        token_count = len(_tokenize(header))
        start_i = i

        while i < len(data_lines):
            line_tokens = len(_tokenize(data_lines[i]))
            if token_count + line_tokens > target and len(accumulated) > 1:
                break
            accumulated.append(data_lines[i])
            token_count += line_tokens
            i += 1

        chunk_text_str = "".join(accumulated)
        chunks.append(Chunk(
            text=chunk_text_str,
            index=idx,
            token_count=token_count,
        ))

        # overlap: step back N rows before the current position
        overlap_rows = max(1, overlap // 10)
        i = max(start_i + 1, i - overlap_rows)
        idx += 1

        # safety: if we didn't advance, force forward
        if i <= start_i:
            i = start_i + 1

    return chunks


if __name__ == "__main__":
    import sys
    from parse import parse_file

    if len(sys.argv) < 2:
        print("Usage: python chunk.py <file_path>")
        sys.exit(1)
    text, ftype = parse_file(sys.argv[1])
    chunks = chunk_text(text, ftype)
    print(f"{len(chunks)} chunks")
    for c in chunks:
        print(f"  [{c.index}] {c.token_count} tokens — {c.text[:80]!r}")
