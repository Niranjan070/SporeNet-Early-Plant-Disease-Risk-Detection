# 🌾 SporeNet — Early Plant Disease Risk Detection

AI-powered system that detects airborne plant spores from microscopic images, counts them, and provides disease risk assessments to help farmers take preventive action.

## 🧩 System Overview

SporeNet allows farmers to upload microscopic images of airborne spores. A backend API runs a trained YOLOv8 object detection model to:

1. **Detect spores** — Identify Rice Blast (Magnaporthe oryzae) spores in the image
2. **Count spores** — Count all detected spores with confidence scores
3. **Assess risk** — Calculate Spore Coverage Percentage risk level (Low/Moderate/High)
4. **Recommend action** — Provide actionable farming recommendations

## 📁 Project Structure

```
sporenet/
├── backend/                 # FastAPI Python backend
│   ├── main.py             # App entry point
│   ├── config.py           # Configuration constants
│   ├── models/
│   │   └── predictor.py    # YOLO model wrapper
│   ├── routes/
│   │   └── predict.py      # /predict endpoint
│   ├── utils/
│   │   ├── risk_calculator.py  # Spore coverage % risk assessment
│   │   └── image_utils.py      # Image validation & annotation
│   ├── static/outputs/     # Annotated output images
│   └── requirements.txt
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Design system
│   └── package.json
├── model/
│   └── best.pt             # Trained YOLOv8 model
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## 🔬 API Endpoints

### `POST /predict`
Upload a microscopic image for spore detection.

**Request:** `multipart/form-data` with `file` field (JPG, JPEG, or PNG)

**Response:**
```json
{
  "spore_type": "Rice Blast (Magnaporthe oryzae)",
  "disease": "Rice Blast",
  "spore_count": 282,
  "coverage_percent": 12.4,
  "risk_level": "Moderate",
  "confidence_avg": 0.87,
  "recommendation": "Apply preventive fungicide...",
  "precautions": ["..."],
  "annotated_image_url": "/static/outputs/annotated_xxx.jpg",
  "detections": [...]
}
```

### `GET /health`
Check backend and model status.

### `GET /`
Service info.

## 📊 Risk Assessment

Risk is calculated using **Spore Coverage Percentage** (the total physical area of bounding boxes as a percentage of overall image area). This makes the system extremely resilient to different microscope zoom levels and camera resolutions.

| Coverage Area | Risk Level | Action |
|:-:|:-:|---|
| < 5.0% | 🟢 Low | Continue regular monitoring |
| 5.0% – 15.0% | 🟡 Moderate | Apply preventive fungicide |
| ≥ 15.0% | 🔴 High | Immediate systemic fungicide |

> By dividing the aggregated physical area of all detected spores by the total screen area, the engine measures direct infection density independent of scaling artifacts.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Model | Ultralytics YOLOv8 |
| Backend | FastAPI, OpenCV, Pillow |
| Frontend | React, Vite, Axios |
| Styling | Vanilla CSS (Glassmorphism dark theme) |

## 📝 License

This project is for educational and research purposes.
