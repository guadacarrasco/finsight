# Security

This is a Day 3 demo prototype. The following security gaps are known 
and intentional given the scope. They must be addressed before production.

## Known issues

**No authentication** — all endpoints are public. Any caller with the 
API Gateway URL can upload, query, and list documents. Auth is the 
load-bearing fix that unblocks everything else (RLS, per-user filtering, 
rate limiting).

**Prompt injection** — document content is injected into Claude's context 
without sanitization. A malicious PDF could contain adversarial instructions.

**No magic byte validation** — file type is inferred from extension only. 
Server-side MIME type verification is needed before production.

**Global /stats endpoint** — returns aggregated data across all documents 
from all users. Requires per-user filtering once auth exists.

**No rate limiting** — /query and /stats make unbounded Claude API calls.

**Path traversal risk** — file.filename used in os.path.join without 
os.path.basename() sanitization. Fix: filename = os.path.basename(file.filename).

## What is handled correctly
- CORS origin allowlist scoped to specific domains (not wildcard)
- File size limit enforced client-side (6MB)
- Secrets in environment variables, not in code
- match_chunks RPC filters on status = 'ready'
