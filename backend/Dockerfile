FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# -------------------------
# System dependencies
# -------------------------
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgl1 \
 && rm -rf /var/lib/apt/lists/*

# -------------------------
# Python dependencies
# -------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -------------------------
# Copy backend code
# -------------------------
COPY . .

# -------------------------
# Optional sanity check (safe)
# -------------------------
RUN python - <<EOF
import pytesseract
print("Tesseract OK:", pytesseract.get_tesseract_version())
EOF

# -------------------------
# Expose & run (Render uses $PORT)
# -------------------------
EXPOSE 8000
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port $PORT"]
