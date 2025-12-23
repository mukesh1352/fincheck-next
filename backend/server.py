import time
import io
import zipfile
import torch
import numpy as np
from pathlib import Path
from typing import Optional, List
import pytesseract
import random

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

import torchvision.transforms as transforms
from torchvision.datasets import MNIST
from torchvision.transforms import GaussianBlur

from model_def import MNISTCNN

# ==================================================
# GLOBAL TORCH OPTIMIZATION
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
# SEED CONTROL
# ==================================================
def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

# ==================================================
# MODEL LOADER
# ==================================================
MNIST_MODELS = None

def load_mnist_models():
    global MNIST_MODELS
    if MNIST_MODELS is None:
        MNIST_MODELS = {}
        for f in MODEL_FILES:
            model = MNISTCNN().to(DEVICE)
            model.load_state_dict(
                torch.load(MODEL_DIR / f, map_location=DEVICE),
                strict=False,
            )
            model.eval()
            MNIST_MODELS[f] = model
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
        transforms.Lambda(lambda x: torch.clamp(
            x + std * torch.randn_like(x), 0.0, 1.0)),
    ])

def BLUR_TRANSFORM(kernel_size=5, sigma=1.0):
    return transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
        GaussianBlur(kernel_size=kernel_size, sigma=sigma),
        transforms.ToTensor(),
    ])

def NOISY_BLUR_TRANSFORM(std=0.2):
    return transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
        GaussianBlur(kernel_size=5, sigma=1.0),
        transforms.ToTensor(),
        transforms.Lambda(lambda x: torch.clamp(
            x + std * torch.randn_like(x), 0.0, 1.0)),
    ])

# ==================================================
# FAST BATCHED INFERENCE
# ==================================================
@torch.inference_mode()
def run_batch_chunked(images, models, chunk_size=128):
    stats = {k: [] for k in models}

    for i in range(0, len(images), chunk_size):
        batch = torch.stack(images[i:i+chunk_size]).to(DEVICE)

        for name, model in models.items():
            start = time.perf_counter()
            logits = model(batch)
            probs = torch.softmax(logits, dim=1)

            stats[name].append({
                "latency": (time.perf_counter() - start) * 1000 / len(batch),
                "confidence": probs.max(dim=1).values.mean().item() * 100,
                "entropy": float(-(probs * torch.log(probs + 1e-8)).sum(dim=1).mean()),
                "stability": float(logits.std()),
            })

    final = {}
    for k, v in stats.items():
        final[k] = {
            "latency_ms": round(np.mean([x["latency"] for x in v]), 3),
            "confidence_percent": round(np.mean([x["confidence"] for x in v]), 2),
            "entropy": round(np.mean([x["entropy"] for x in v]), 4),
            "stability": round(np.mean([x["stability"] for x in v]), 4),
            "ram_mb": 0.0,
        }
    return final

# ==================================================
# MULTI-RUN NOISY EVALUATION
# ==================================================
def run_noisy_multi_eval(build_fn, models, runs=5):
    acc = {k: [] for k in models}

    for r in range(runs):
        set_seed(42 + r)
        images = build_fn()
        out = run_batch_chunked(images, models)

        for m, v in out.items():
            acc[m].append(v)

    final = {}
    for m, runs in acc.items():
        final[m] = {
            "latency_mean": round(np.mean([x["latency_ms"] for x in runs]), 3),
            "latency_std": round(np.std([x["latency_ms"] for x in runs]), 3),
            "confidence_mean": round(np.mean([x["confidence_percent"] for x in runs]), 2),
            "confidence_std": round(np.std([x["confidence_percent"] for x in runs]), 2),
            "entropy_mean": round(np.mean([x["entropy"] for x in runs]), 4),
            "entropy_std": round(np.std([x["entropy"] for x in runs]), 4),
            "stability_mean": round(np.mean([x["stability"] for x in runs]), 4),
            "stability_std": round(np.std([x["stability"] for x in runs]), 4),
        }
    return final
# ==================================================
# SINGLE IMAGE INFERENCE
# ==================================================
@app.post("/run")
async def run(image: UploadFile = File(...)):
    models = load_mnist_models()

    img = Image.open(image.file).convert("L")
    tensor = CLEAN_TRANSFORM(img)

    # Reuse existing batch inference
    results = run_batch_chunked([tensor], models)

    return results

# ==================================================
# DATASET ENDPOINT
# ==================================================
@app.post("/run-dataset")
async def run_dataset(
    zip_file: Optional[UploadFile] = File(None),
    dataset_name: Optional[str] = Form(None),
):
    models = load_mnist_models()
    base = MNIST(root=DATA_DIR, train=False, download=True)

    # ---------- CLEAN ----------
    if dataset_name == "MNIST_100":
        images = [CLEAN_TRANSFORM(base[i][0]) for i in range(100)]
        results = run_batch_chunked(images, models)

    elif dataset_name == "MNIST_500":
        images = [CLEAN_TRANSFORM(base[i][0]) for i in range(500)]
        results = run_batch_chunked(images, models)

    # ---------- NOISY ----------
    elif dataset_name == "MNIST_NOISY_100":
        results = run_noisy_multi_eval(
            lambda: [NOISY_TRANSFORM()(base[i][0]) for i in range(100)],
            models,
        )
    elif dataset_name == "MNIST_FULL":
        images = [CLEAN_TRANSFORM(base[i][0]) for i in range(len(base))]
        results = run_batch_chunked(images, models)

    elif dataset_name == "MNIST_NOISY_500":
        results = run_noisy_multi_eval(
            lambda: [NOISY_TRANSFORM()(base[i][0]) for i in range(500)],
            models,
        )

    elif dataset_name == "MNIST_NOISY_BLUR_100":
        results = run_noisy_multi_eval(
            lambda: [NOISY_BLUR_TRANSFORM()(base[i][0]) for i in range(100)],
            models,
        )

    elif dataset_name == "MNIST_NOISY_BLUR_500":
        results = run_noisy_multi_eval(
            lambda: [NOISY_BLUR_TRANSFORM()(base[i][0]) for i in range(500)],
            models,
        )

    else:
        return {"error": f"Unknown dataset_name: {dataset_name}"}

    return {
        "dataset_type": dataset_name,
        "models": results,
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
