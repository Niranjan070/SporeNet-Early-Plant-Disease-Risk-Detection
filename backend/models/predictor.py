"""
SporeNet YOLO Model Predictor
Handles model loading and inference for spore detection.
"""

from ultralytics import YOLO
from config import MODEL_PATH, CONFIDENCE_THRESHOLD, IOU_THRESHOLD
import logging

logger = logging.getLogger(__name__)


class SporePredictor:
    """Wrapper around YOLOv8 model for spore detection."""

    def __init__(self):
        self.model = None
        self.class_names = {}

    def load_model(self):
        """Load the YOLOv8 model from disk."""
        try:
            logger.info(f"Loading model from: {MODEL_PATH}")
            self.model = YOLO(MODEL_PATH)
            self.class_names = self.model.names  # {0: 'spore', ...}
            logger.info(f"Model loaded successfully. Classes: {self.class_names}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise RuntimeError(f"Could not load YOLO model from {MODEL_PATH}: {e}")

    def predict(self, image_path: str) -> dict:
        """
        Run inference on an image.

        Args:
            image_path: Path to the input image file.

        Returns:
            Dictionary with detection results:
            {
                "detections": [
                    {"class": str, "confidence": float, "bbox": [x1, y1, x2, y2]},
                    ...
                ],
                "spore_count": int,
                "confidence_avg": float,
                "image_width": int,
                "image_height": int,
                "results_obj": Results  # raw YOLO results for annotation
            }
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        # Run inference
        results = self.model.predict(
            source=image_path,
            conf=CONFIDENCE_THRESHOLD,
            iou=IOU_THRESHOLD,
            verbose=False,
        )

        # Process results (first image only)
        result = results[0]
        boxes = result.boxes

        # Extract image dimensions
        img_height, img_width = result.orig_shape

        # Parse detections
        detections = []
        confidences = []
        total_spore_area = 0.0

        for box in boxes:
            # Get bounding box coordinates (xyxy format)
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = self.class_names.get(class_id, "unknown")

            # Calculate area of this bounding box
            box_area = (x2 - x1) * (y2 - y1)
            total_spore_area += box_area

            detections.append({
                "class": class_name,
                "confidence": round(confidence, 4),
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
            })
            confidences.append(confidence)

        spore_count = len(detections)
        confidence_avg = round(sum(confidences) / len(confidences), 4) if confidences else 0.0

        return {
            "detections": detections,
            "spore_count": spore_count,
            "total_spore_area": total_spore_area,
            "confidence_avg": confidence_avg,
            "image_width": img_width,
            "image_height": img_height,
            "results_obj": result,  # Keep raw result for annotation
        }


# Singleton instance
predictor = SporePredictor()
