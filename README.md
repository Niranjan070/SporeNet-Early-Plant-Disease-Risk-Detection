# SporeNet

SporeNet is a microscope-image analysis application for early plant disease support. A farmer or field technician uploads a microscopic image, the backend runs YOLO to detect fungal spores, the system estimates spore frequency and disease risk, and Gemini powers two assistants inside the same app:

- a docked farming assistant for general crop questions
- an image diagnosis assistant that explains the current analyzed sample

## Final Application Flow

The current UI is organized like this:

- Left side: microscope image upload, YOLO analysis, annotated output, grouped detections, disease summary, and image-linked AI diagnosis
- Right side: always-available farming assistant that stays visible while the user works through the rest of the app

This makes the app feel like one continuous workflow instead of separate tools.

## Core Features

- Upload a microscope image from the field or lab
- Detect fungal spores using a trained YOLO model
- Count spores and estimate coverage percentage
- Predict an early disease signal from spore type and frequency
- Show an annotated output image for review
- Ask Gemini for general farming support inside the app
- Ask Gemini for image-specific diagnosis based on the real YOLO result

## Supported Spore Classes

The current model supports:

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
|-- backend/
|   |-- main.py
|   |-- config.py
|   |-- requirements.txt
|   |-- routes/
|   |   |-- predict.py
|   |   `-- ai.py
|   |-- models/
|   |   `-- predictor.py
|   |-- utils/
|   |   |-- gemini_service.py
|   |   |-- image_utils.py
|   |   `-- risk_calculator.py
|   `-- static/
|       `-- outputs/
|-- frontend/
|   |-- package.json
|   |-- vite.config.js
|   |-- README.md
|   `-- src/
|-- model/
|   `-- best.pt
`-- README.md
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
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
- Health: `http://localhost:8000/health`

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

Gemini-powered general farming assistant.

### `POST /ai/image-diagnosis`

Gemini-powered diagnosis tied to the current analyzed microscope image.

### `GET /health`

Returns backend status, YOLO model readiness, and Gemini readiness.

## Model File

The backend expects YOLO weights at:

```text
model/best.pt
```

If model weights are not committed to GitHub, contributors must place the trained file there before starting the backend.

## Environment Notes

- `GEMINI_API_KEY` is required for both assistant features
- `GEMINI_MODEL` should usually be `gemini-2.5-flash`
- the backend also includes model fallback logic if a Gemini model name becomes unavailable

## GitHub Notes

This repo is configured to ignore:

- `.env` files
- Python virtual environments
- `node_modules`
- frontend build output
- generated backend output images
- common Python and tooling cache files

## License

This project is for educational and research purposes.
