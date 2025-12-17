import time
import psutil
import torch
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from PIL import Image
import torchvision.transforms as transforms
import pytesseract
import re
from model_def import MNISTCNN
import cv2
from fastapi import Form

# -------------------- App setup --------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL_FILES = [
    "baseline_mnist.pth",
    "kd_mnist.pth",
    "lrf_mnist.pth",
    "pruned_mnist.pth",
    "quantized_mnist.pth",
    "ws_mnist.pth",
]

MODELS = {}

# -------------------- Transform --------------------
transform = transforms.Compose([
    transforms.Grayscale(1),
    transforms.Resize((28, 28)),
    transforms.ToTensor(),
])

# -------------------- Character segmentation --------------------
def split_characters(pil_img):
    img = np.array(pil_img)

    _, thresh = cv2.threshold(
        img, 150, 255, cv2.THRESH_BINARY_INV
    )

    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w * h > 300:
            boxes.append((x, y, w, h))

    boxes = sorted(boxes, key=lambda b: b[0])

    chars = []
    for x, y, w, h in boxes:
        chars.append(img[y:y+h, x:x+w])

    return chars

# -------------------- Load models --------------------
for f in MODEL_FILES:
    model = MNISTCNN().to(DEVICE)
    model.load_state_dict(
        torch.load(MODEL_DIR / f, map_location=DEVICE),
        strict=False
    )
    model.eval()
    MODELS[f] = model

# -------------------- Health --------------------
@app.get("/health")
def health():
    return {"status": "ok"}

# ==================================================
# OLD ENDPOINT (UNCHANGED)
# ==================================================
@app.post("/run")
async def run(image: UploadFile = File(...)):
    img = Image.open(image.file).convert("L")
    img = transform(img).unsqueeze(0).to(DEVICE)

    process = psutil.Process()
    results = {}

    for name, model in MODELS.items():
        mem_before = process.memory_info().rss / 1024 / 1024
        start = time.perf_counter()

        with torch.no_grad():
            out = model(img)

        latency = (time.perf_counter() - start) * 1000
        mem_after = process.memory_info().rss / 1024 / 1024

        results[name] = {
            "confidence": float(out.softmax(1).max()) * 100,
            "latency_ms": round(latency, 2),
            "ram_mb": round(mem_after - mem_before, 2),
        }

    return results

# ==================================================
# TEXT-ONLY VERIFICATION ENDPOINT
# ==================================================
@app.post("/verify")
async def verify(
    image: UploadFile = File(...),
    raw_text: str = Form(...)
):
    pil_img = Image.open(image.file).convert("L")

    # STEP 1: OCR (digits only)
    ocr_text = pytesseract.image_to_string(
        pil_img,
        config="--psm 7 -c tessedit_char_whitelist=0123456789"
    ).strip().replace(" ", "")

    if not ocr_text:
        return {
            "verdict": "INVALID_OR_AMBIGUOUS",
            "method": "OCR",
            "final_output": None,
            "errors": [],
            "why": "OCR could not detect numeric characters."
        }

    errors = []

    # STEP 2: Character-level comparison
    min_len = min(len(raw_text), len(ocr_text))

    for i in range(min_len):
        if raw_text[i] != ocr_text[i]:
            errors.append({
                "position": i + 1,
                "typed_char": raw_text[i],
                "ocr_char": ocr_text[i],
                "reason": "Ambiguous character normalized by OCR"
            })

    # Length mismatch
    if len(raw_text) != len(ocr_text):
        errors.append({
            "reason": "Length mismatch between typed input and OCR output"
        })

    # STEP 3: Final decision
    if errors:
        return {
            "verdict": "INVALID_OR_AMBIGUOUS",
            "method": "OCR_ERROR_DETECTION",
            "final_output": ocr_text,
            "errors": errors,
            "why": "One or more characters are ambiguous or invalid."
        }

    return {
        "verdict": "VALID_TYPED_TEXT",
        "method": "OCR",
        "final_output": ocr_text,
        "errors": [],
        "why": "Typed numeric input validated successfully."
    }