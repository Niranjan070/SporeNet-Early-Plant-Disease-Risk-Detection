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
    "magnaporthe_oryzae": {
        "spore_type": "Magnaporthe oryzae (Rice Blast)",
        "disease": "Rice Blast",
        "affected_crop": "Rice",
        "description": "Causes rice blast, one of the most destructive diseases of rice worldwide, capable of destroying entire harvests."
    },
    "alternaria": {
        "spore_type": "Alternaria",
        "disease": "Early Blight / Leaf Spot",
        "affected_crop": "Various (Tomato, Potato, etc.)",
        "description": "Causes leaf spots and blights on many crop plants, leading to severe yield losses."
    },
    "bipolaris": {
        "spore_type": "Bipolaris",
        "disease": "Leaf Blight / Spot",
        "affected_crop": "Cereals and Grasses",
        "description": "Common pathogen causing leaf spots and blights on cereals and grasses."
    },
    "curvularia": {
        "spore_type": "Curvularia",
        "disease": "Leaf Spot",
        "affected_crop": "Cereals and Grasses",
        "description": "Associated with leaf spots and blights, primarily in warm climates."
    },
    "curvularia_eragrostidis": {
        "spore_type": "Curvularia eragrostidis",
        "disease": "Leaf Spot / Blight",
        "affected_crop": "Grasses",
        "description": "A specific species of Curvularia causing leaf spots."
    },
    "exserohilum": {
        "spore_type": "Exserohilum",
        "disease": "Northern Corn Leaf Blight",
        "affected_crop": "Corn, Grasses",
        "description": "Important pathogen of corn and related grasses causing leaf blights."
    },
    "fusarium": {
        "spore_type": "Fusarium",
        "disease": "Fusarium Wilt / Head Blight",
        "affected_crop": "Wheat, Banana, Tomato, etc.",
        "description": "Soil-borne fungus causing vascular wilts, root rots, and blights."
    },
    "fusarium_microconidie": {
        "spore_type": "Fusarium (Microconidia)",
        "disease": "Fusarium Wilt",
        "affected_crop": "Various",
        "description": "Microconidia form of Fusarium fungi."
    },
    "mycelium": {
        "spore_type": "Mycelium",
        "disease": "Fungal Infection",
        "affected_crop": "Various",
        "description": "Vegetative part of a fungus, indicating active fungal growth."
    },
    "default": {
        "spore_type": "Unknown",
        "disease": "Unknown Disease",
        "affected_crop": "Unknown",
        "description": "Unknown spore type or general fungal growth detected."
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
