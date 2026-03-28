"""
SporeNet Prediction Route
POST /predict endpoint for spore detection and risk assessment.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models.predictor import predictor
from utils.risk_calculator import calculate_risk
from utils.gemini_service import generate_risk_assessment
from utils.image_utils import validate_image, save_upload, generate_annotated_image, cleanup_file
from config import SPORE_DISEASE_MAP
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/predict")
async def predict_spores(
    file: UploadFile = File(...),
    crop_type: str = Form("Unknown")
):
    """
    Predict spores in an uploaded microscopic image.

    Accepts a microscopic image, runs YOLOv8 detection, counts spores,
    calculates density-based disease risk, optionally uses Gemini AI for
    intelligent recommendations, and returns results with an annotated image.

    Args:
        file: Uploaded image file (jpg, jpeg, or png).
        crop_type: The type of plant the sample was taken from.

    Returns:
        JSON with spore type, count, risk level, recommendations,
        and annotated image URL.
    """
    # --- 1. Read and validate the uploaded file ---
    file_bytes = await file.read()
    file_size = len(file_bytes)

    is_valid, error_msg = validate_image(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # --- 2. Save the uploaded file temporarily ---
    upload_path = None
    try:
        upload_path = save_upload(file_bytes, file.filename)

        # --- 3. Run YOLO inference ---
        logger.info(f"Running inference on: {file.filename}")
        prediction = predictor.predict(upload_path)

        # Determine the primary class
        main_class = "default"
        if prediction["detections"]:
            from collections import Counter
            class_counts = Counter(d["class"] for d in prediction["detections"])
            main_class = class_counts.most_common(1)[0][0]

        disease_info = SPORE_DISEASE_MAP.get(main_class, SPORE_DISEASE_MAP.get("default", {}))

        # --- 4. Generate annotated image ---
        annotated_url = generate_annotated_image(prediction["results_obj"])

        # --- 5. Calculate risk ---
        # First attempt Gemini AI dynamic assessment
        risk_assessment = generate_risk_assessment(
            detections=prediction["detections"],
            spore_count=prediction["spore_count"],
            total_spore_area=prediction["total_spore_area"],
            image_width=prediction["image_width"],
            image_height=prediction["image_height"],
            main_class=main_class,
            crop_type=crop_type
        )
        
        # Fallback to local deterministic risk assessment if Gemini fails or is unconfigured
        if not risk_assessment:
            risk_assessment = calculate_risk(
                spore_count=prediction["spore_count"],
                total_spore_area=prediction["total_spore_area"],
                image_width=prediction["image_width"],
                image_height=prediction["image_height"],
                main_class=main_class
            )

        # --- 6. Build response ---
        response = {
            # Spore detection results
            "spore_type": risk_assessment.get("spore_type", disease_info.get("spore_type", "Unknown")),
            "disease": risk_assessment.get("disease", disease_info.get("disease", "Unknown Disease")),
            "affected_crop": risk_assessment.get("affected_crop", disease_info.get("affected_crop", "Unknown")),
            "description": risk_assessment.get("description", disease_info.get("description", "")),
            "spore_count": prediction["spore_count"],
            "coverage_percent": risk_assessment.get("coverage_percent", 0.0),
            "confidence_avg": prediction["confidence_avg"],

            # Risk assessment
            "risk_level": risk_assessment.get("risk_level", "Unknown"),
            "risk_color": risk_assessment.get("risk_color", "#EF4444"),
            "recommendation": risk_assessment.get("recommendation", "No recommendation available."),
            "precautions": risk_assessment.get("precautions", []),

            # Detection details
            "detections": prediction["detections"],

            # Annotated image
            "annotated_image_url": annotated_url,

            # Image metadata
            "image_width": prediction["image_width"],
            "image_height": prediction["image_height"],
        }

        logger.info(
            f"Detection complete: {prediction['spore_count']} spores, "
            f"risk={risk_assessment['risk_level']}"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during analysis: {str(e)}"
        )
    finally:
        # Clean up the uploaded file
        if upload_path:
            cleanup_file(upload_path)
