from __future__ import annotations

import os


def parse_file(path: str) -> tuple[str, str]:
    """Return (raw_text, file_type) for a PDF, CSV, or image file."""
    ext = os.path.splitext(path)[1].lower().lstrip(".")

    if ext == "pdf":
        return _parse_pdf(path), "pdf"
    elif ext == "csv":
        return _parse_csv(path), "csv"
    elif ext in ("png", "jpg", "jpeg", "tiff", "bmp", "webp"):
        return _parse_image(path), "image"
    else:
        raise ValueError(f"Unsupported file extension: .{ext}")


def _parse_pdf(path: str) -> str:
    import fitz  # PyMuPDF

    doc = fitz.open(path)
    pages = [page.get_text() for page in doc]
    doc.close()
    return "\n".join(pages)


def _parse_csv(path: str) -> str:
    import pandas as pd

    df = pd.read_csv(path)
    # Keep header + all rows as readable text; preserves column context per chunk
    return df.to_string(index=False)


def _parse_image(path: str) -> str:
    import pytesseract
    from PIL import Image

    img = Image.open(path).convert("L")  # grayscale speeds up OCR
    if max(img.size) > 1400:
        img.thumbnail((1400, 1400), Image.LANCZOS)
    return pytesseract.image_to_string(img, config="--oem 1 --psm 3")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python parse.py <file_path>")
        sys.exit(1)
    text, ftype = parse_file(sys.argv[1])
    print(f"file_type={ftype}  chars={len(text)}")
    print("--- first 500 chars ---")
    print(text[:500])
