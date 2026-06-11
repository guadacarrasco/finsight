"""End-to-end pipeline test: ingest sample files, run queries, assert results.

Score note: voyage-finance-2 cosine similarity on multi-row chunks scores
0.30–0.50 for financial queries; lower than typical single-sentence benchmarks
because each chunk contains many mixed transaction lines.

Rate limit note: free tier = 3 RPM. The QUERY_DELAY below keeps calls under
that limit. Add a payment method at dashboard.voyageai.com to remove the cap.
"""
from __future__ import annotations

import os
import sys
import time

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_data")
QUERY_DELAY = 22  # seconds between embed calls to respect 3 RPM free tier

# (query, keyword_in_any_top5_excerpt, min_score_for_top1)
TESTS = [
    ("How much did I spend on groceries?",  "WHOLE FOODS",  0.40),
    ("What is my rent payment?",            "RENT PAYMENT", 0.28),
    ("Show me income transactions",         "SALARY",       0.28),
    ("What did I spend on utilities?",      "COMCAST",      0.28),
]


def _doc_exists(filename: str) -> bool:
    from db import get_client
    result = get_client().table("documents").select("id").eq("filename", filename).execute()
    return len(result.data) > 0


def ingest_samples() -> None:
    from pipeline import process_file

    for fname in ("bank_statement.pdf", "transactions.csv"):
        if _doc_exists(fname):
            print(f"  {fname} already ingested — skipping")
            continue
        path = os.path.join(SAMPLE_DIR, fname)
        print(f"\nIngesting {fname}...")
        result = process_file(path)
        assert result["status"] == "ready", f"Expected ready, got {result['status']}"
        print(f"  OK — id={result['id']}")
        time.sleep(QUERY_DELAY)


def run_queries() -> None:
    from search import query_documents

    passed = 0
    failed = 0

    for i, (query, keyword, min_score) in enumerate(TESTS):
        if i > 0:
            print(f"  (waiting {QUERY_DELAY}s for rate limit...)")
            time.sleep(QUERY_DELAY)

        results = query_documents(query, k=5)
        assert results, f"No results for: {query!r}"

        top = results[0]
        score_ok = top["relevanceScore"] >= min_score

        # keyword may appear in any of the top-5 results
        keyword_ok = any(
            keyword.lower() in r["excerpt"].lower() for r in results
        )

        status = "PASS" if (score_ok and keyword_ok) else "FAIL"
        if status == "PASS":
            passed += 1
        else:
            failed += 1

        print(
            f"[{status}] {query!r}\n"
            f"       top_doc={top['documentName']}  score={top['relevanceScore']}\n"
            f"       keyword '{keyword}' in top-5={keyword_ok}  score>={min_score}={score_ok}\n"
        )

    print(f"\n{'='*60}")
    print(f"Results: {passed} passed, {failed} failed")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    print("=== Ingest phase ===")
    ingest_samples()
    print("\n=== Query phase ===")
    run_queries()
