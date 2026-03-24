"""
SporeNet Backend — FastAPI Application
Early Plant Disease Risk Detection using YOLOv8 Spore Detection.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS, OUTPUT_DIR
from models.predictor import predictor
from routes.predict import router as predict_router

# --- Logging setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("sporenet")


# --- App lifespan (startup/shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the YOLO model on startup."""
    logger.info("🔬 SporeNet starting up...")
    predictor.load_model()
    logger.info("✅ Model loaded and ready for inference.")
    yield
    logger.info("🛑 SporeNet shutting down.")


# --- FastAPI app ---
app = FastAPI(
    title="SporeNet API",
    description=(
        "Early plant disease risk detection API. "
        "Upload microscopic spore images to detect Rice Blast spores, "
        "count them, and receive disease risk assessments."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static files (annotated images) ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Routes ---
app.include_router(predict_router)


# --- Health check endpoint ---
@app.get("/")
async def root():
    return {
        "service": "SporeNet API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    model_loaded = predictor.model is not None
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
    }
