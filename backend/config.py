"""
SporeNet Configuration
All constants and configuration values for the backend.
"""

import os

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "model", "best.pt")
OUTPUT_DIR = os.path.join(BASE_DIR, "static", "outputs")

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Model Settings ---
CONFIDENCE_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45

# --- Risk Thresholds ---
# Spore Coverage % Thresholds
COVERAGE_LOW_THRESHOLD = 5.0       # coverage < 5.0% → Low Risk
COVERAGE_MODERATE_THRESHOLD = 15.0  # 5.0% ≤ coverage < 15.0% → Moderate Risk
# coverage >= 15.0% → High Risk

# --- Spore Mapping ---
# Maps model class names to disease information
SPORE_DISEASE_MAP = {
    "default": {
        "spore_type": "Rice Blast (Magnaporthe oryzae)",
        "disease": "Rice Blast",
        "affected_crop": "Rice",
        "description": (
            "Rice blast is caused by the fungus Magnaporthe oryzae. "
            "It is one of the most destructive diseases of rice worldwide, "
            "capable of destroying entire harvests under favorable conditions."
        ),
    }
}

# --- Upload Settings ---
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_FILE_SIZE_MB = 10

# --- CORS ---
CORS_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",   # Alternate React dev server
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
