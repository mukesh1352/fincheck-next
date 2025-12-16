# backend/download_models.py
import requests
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(exist_ok=True)

# 🔴 MUST MATCH YOUR ACTUAL RELEASE TAG
RELEASE_TAG = "v1-models"

BASE_URL = f"https://github.com/mukesh1352/fincheck-next/releases/download/{RELEASE_TAG}"

MODELS = [
    "baseline_mnist.pth",
    "kd_mnist.pth",
    "lrf_mnist.pth",
    "pruned_mnist.pth",
    "quantized_mnist.pth",
    "ws_mnist.pth",
]

def download():
    for name in MODELS:
        dest = MODEL_DIR / name
        if dest.exists():
            print(f"✅ {name} already exists")
            continue

        url = f"{BASE_URL}/{name}"
        print(f"⬇️ Downloading {url}")

        r = requests.get(url, stream=True)
        if r.status_code != 200:
            raise RuntimeError(f"❌ Failed to download {name} ({r.status_code})")

        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

    print("🎉 All models downloaded successfully")
