import time
import io
import zipfile
import torch
import numpy as np
from pathlib import Path
from typing import Optional, List
import pytesseract

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

import torchvision.transforms as transforms
from torchvision.datasets import MNIST
from torchvision.transforms import GaussianBlur

from model_def import MNISTCNN

# ==================================================
# GLOBAL TORCH OPTIMIZATION (CRITICAL)
# ==================================================
torch.set_grad_enabled(False)
torch.backends.cudnn.benchmark = False
torch.backends.cudnn.deterministic = True

# ==================================================
# APP SETUP
# ==================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
DATA_DIR = BASE_DIR / "data"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL_FILES = [
    "baseline_mnist.pth",
    "kd_mnist.pth",
    "lrf_mnist.pth",
    "pruned_mnist.pth",
    "quantized_mnist.pth",
    "ws_mnist.pth",
]

# ==================================================
# MODEL LOADER (LAZY, CACHED)
# ==================================================

MNIST_MODELS = None

def load_mnist_models():
    global MNIST_MODELS
    if MNIST_MODELS is None:
        print("🔵 Loading MNIST models...")
        MNIST_MODELS = {}
        for f in MODEL_FILES:
            model = MNISTCNN().to(DEVICE)
            model.load_state_dict(
                torch.load(MODEL_DIR / f, map_location=DEVICE),
                strict=False,
            )
            model.eval()
            MNIST_MODELS[f] = model
        print("✅ MNIST models loaded")
    return MNIST_MODELS

# ==================================================
# TRANSFORMS
# ==================================================

CLEAN_TRANSFORM = transforms.Compose([
    transforms.Grayscale(1),
    transforms.Resize((28, 28)),
    transforms.ToTensor(),
])

def NOISY_TRANSFORM(std=0.2):
    return transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
        transforms.ToTensor(),
        transforms.Lambda(lambda x: torch.clamp(x + std * torch.randn_like(x), 0.0, 1.0)),
    ])

def BLUR_TRANSFORM(kernel_size=5, sigma=1.0):
    return transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
        GaussianBlur(kernel_size=kernel_size, sigma=sigma),
        transforms.ToTensor(),
    ])

def NOISY_BLUR_TRANSFORM(noise_std=0.2, blur_kernel=5, blur_sigma=1.0):
    return transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
        GaussianBlur(kernel_size=blur_kernel, sigma=blur_sigma),
        transforms.ToTensor(),
        transforms.Lambda(lambda x: torch.clamp(x + noise_std * torch.randn_like(x), 0.0, 1.0)),
    ])

# ==================================================
# FAST BATCHED INFERENCE (CORE SPEEDUP)
# ==================================================

def run_batch(images: List[torch.Tensor], models):
    batch = torch.stack(images).to(DEVICE)
    results = {}

    for name, model in models.items():
        start = time.perf_counter()
        logits = model(batch)
        probs = torch.softmax(logits, dim=1)
        latency_ms = (time.perf_counter() - start) * 1000 / len(images)

        confidence = probs.max(dim=1).values.mean().item() * 100
        entropy = float(-(probs * torch.log(probs + 1e-8)).sum(dim=1).mean().item())
        stability = float(logits.std().item())

        results[name] = {
            "latency_ms": round(latency_ms, 3),
            "confidence_percent": round(confidence, 2),
            "entropy": round(entropy, 4),
            "stability": round(abs(stability), 4),
            "ram_mb": 0.0,  # removed expensive psutil tracking
        }

    return results

# ==================================================
# HEALTH
# ==================================================

@app.get("/health")
def health():
    return {"status": "ok", "mnist_loaded": MNIST_MODELS is not None}

# ==================================================
# SINGLE IMAGE
# ==================================================

@app.post("/run")
async def run(image: UploadFile = File(...)):
    models = load_mnist_models()
    img = Image.open(image.file).convert("L")
    tensor = CLEAN_TRANSFORM(img)
    return run_batch([tensor], models)

# ==================================================
# DATASET (FAST, BATCHED)
# ==================================================

@app.post("/run-dataset")
async def run_dataset(
    zip_file: Optional[UploadFile] = File(None),
    dataset_name: Optional[str] = Form(None),
):
    models = load_mnist_models()
    images = []

    if zip_file:
        with zipfile.ZipFile(io.BytesIO(await zip_file.read())) as z:
            for name in z.namelist():
                if name.lower().endswith((".png", ".jpg", ".jpeg")):
                    with z.open(name) as f:
                        images.append(CLEAN_TRANSFORM(Image.open(f).convert("L")))
        dataset_type = "CUSTOM_ZIP"

    elif dataset_name:
        base = MNIST(root=DATA_DIR, train=False, download=True)

        if dataset_name == "MNIST_100":
            images = [CLEAN_TRANSFORM(base[i][0]) for i in range(100)]
        elif dataset_name == "MNIST_500":
            images = [CLEAN_TRANSFORM(base[i][0]) for i in range(500)]
        elif dataset_name == "MNIST_NOISY_100":
            images = [NOISY_TRANSFORM()(base[i][0]) for i in range(100)]
        elif dataset_name == "MNIST_BLUR_100":
            images = [BLUR_TRANSFORM()(base[i][0]) for i in range(100)]
        elif dataset_name == "MNIST_NOISY_BLUR_100":
            images = [NOISY_BLUR_TRANSFORM()(base[i][0]) for i in range(100)]
        else:
            return {"error": f"Unknown dataset_name: {dataset_name}"}

        dataset_type = dataset_name
    else:
        return {"error": "Either zip_file or dataset_name must be provided"}

    batch_results = run_batch(images, models)

    return {
        "dataset_type": dataset_type,
        "num_images": len(images),
        "models": batch_results,
    }

# ==================================================
# OCR (FAST)
# ==================================================

@app.post("/verify")
async def verify(image: UploadFile = File(...), raw_text: str = Form(...)):
    try:
        img = Image.open(image.file).convert("L")
        img = img.resize((128, 32))

        ocr_text = pytesseract.image_to_string(
            img,
            config="--psm 10 --oem 1 -c tessedit_char_whitelist=0123456789",
        ).strip()

        if not ocr_text:
            return {"verdict": "INVALID_OR_AMBIGUOUS", "final_output": None, "errors": []}

        errors = []
        for i in range(max(len(raw_text), len(ocr_text))):
            if (raw_text[i:i+1] or None) != (ocr_text[i:i+1] or None):
                errors.append({"position": i + 1})

        if errors:
            return {
                "verdict": "INVALID_OR_AMBIGUOUS",
                "final_output": ocr_text,
                "errors": errors,
            }

        return {
            "verdict": "VALID_TYPED_TEXT",
            "final_output": ocr_text,
            "errors": [],
        }

    except Exception:
        return {"verdict": "ERROR", "final_output": None, "errors": []}
