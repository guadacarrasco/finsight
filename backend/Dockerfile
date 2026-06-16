FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.12

RUN microdnf install -y unzip && \
    curl -sL https://github.com/bweigel/aws-lambda-tesseract-layer/releases/download/v5.4.0/tesseract-al2023-x86.zip \
      -o /tmp/tesseract.zip && \
    unzip /tmp/tesseract.zip -d /opt && \
    curl -sL https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata \
      -o /opt/tesseract/share/tessdata/eng.traineddata && \
    rm /tmp/tesseract.zip && \
    microdnf clean all

ENV PATH=/opt/bin:$PATH
ENV LD_LIBRARY_PATH=/opt/lib:$LD_LIBRARY_PATH
ENV TESSDATA_PREFIX=/opt/tesseract/share/tessdata

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["main.handler"]
