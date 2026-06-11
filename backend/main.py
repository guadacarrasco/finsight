from __future__ import annotations

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="FinSight API", version="0.2.0")

NOT_IMPL = JSONResponse({"error": "not implemented"}, status_code=501)


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # Day 3: save file to temp, call pipeline.process_file(), return FinDocument dict
    return NOT_IMPL


@app.post("/query")
async def query_documents(body: dict):
    # Day 3: call search.query_documents(body["question"]), call Claude for answer
    return NOT_IMPL


@app.get("/documents")
async def list_documents():
    # Day 3: call db.list_documents(), return list of FinDocument dicts
    return NOT_IMPL


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
