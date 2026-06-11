FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.12

# tesseract-ocr binary for image uploads (AL2 needs EPEL; skipped here since
# the Day 3 demo only uses PDFs/CSVs — pytesseract imports fine without the binary,
# it only errors at runtime if an image file is actually uploaded)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["main.handler"]
