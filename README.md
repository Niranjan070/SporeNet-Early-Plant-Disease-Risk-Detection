# SporeNet

SporeNet is a plant disease intelligence app for microscopic spore images. Farmers or field technicians upload a microscope image, a YOLO model detects fungal spores, the backend estimates disease risk from spore frequency and coverage, and Gemini powers two in-app AI assistants:

- a general farming assistant for crop and disease questions
- an image diagnosis assistant that explains the uploaded sample and suggests next steps

## What It Does

- Detects fungal spores from microscopic images using YOLO
- Counts detected spores and computes slide coverage percentage
- Estimates early disease risk from the detected spore pattern
- Generates annotated output images for visual review
- Answers general farming questions through a Gemini-powered assistant
- Produces image-specific diagnosis and prevention guidance through a second Gemini assistant

## Supported Spore Classes

The current YOLO model is configured for these classes:

- `magnaporthe_oryzae`
- `alternaria`
- `bipolaris`
- `curvularia`
- `curvularia_eragrostidis`
- `exserohilum`
- `fusarium`
- `fusarium_microconidie`
- `mycelium`

## Tech Stack

- Frontend: React, Vite, Axios, vanilla CSS
- Backend: FastAPI, Ultralytics YOLO, Pillow, OpenCV
- AI: Google Gemini API

## Project Structure

```text
sporenet/
├─ backend/
│  ├─ main.py
│  ├─ config.py
│  ├─ requirements.txt
│  ├─ routes/
│  │  ├─ predict.py
│  │  └─ ai.py
│  ├─ models/
│  │  └─ predictor.py
│  ├─ utils/
│  │  ├─ gemini_service.py
│  │  ├─ image_utils.py
│  │  └─ risk_calculator.py
│  └─ static/outputs/
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
├─ model/
│  └─ best.pt
└─ README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Start the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- App: `http://localhost:5173`

## API Endpoints

### `POST /predict`

Uploads a microscope image and returns:

- detected spore type
- disease label
- affected crop
- spore count
- coverage percentage
- confidence average
- risk level
- recommendation and precautions
- annotated image URL

### `POST /ai/chat`

General Gemini-powered farming assistant.

### `POST /ai/image-diagnosis`

Gemini-powered diagnosis tied to a completed microscope analysis result.

### `GET /health`

Returns backend readiness, model readiness, and Gemini readiness.

## Model File

The repository expects a YOLO weights file at `model/best.pt`.

If you do not commit model weights to GitHub, make sure contributors know they must place the trained file there manually before running the backend.

## GitHub Notes

This repo is configured to ignore:

- `.env` files
- virtual environments
- `node_modules`
- frontend build output
- generated backend output images
- Python and tooling caches

## License

This project is for educational and research purposes.
