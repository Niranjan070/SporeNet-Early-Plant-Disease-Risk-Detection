"""
SporeNet Image Utilities
Handles image validation, saving, and annotation generation.
"""

import os
import uuid
import cv2
import numpy as np
from PIL import Image
from config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, OUTPUT_DIR


def validate_image(filename: str, file_size: int) -> tuple[bool, str]:
    """
    Validate uploaded image file.

    Args:
        filename: Original filename of the upload.
        file_size: Size of the file in bytes.

    Returns:
        Tuple of (is_valid, error_message).
    """
    # Check file extension
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return False, (
            f"Invalid file type '.{ext}'. "
            f"Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        return False, (
            f"File too large ({file_size / (1024*1024):.1f}MB). "
            f"Maximum allowed: {MAX_FILE_SIZE_MB}MB"
        )

    return True, ""


def save_upload(file_bytes: bytes, filename: str) -> str:
    """
    Save uploaded file to a temporary location.

    Args:
        file_bytes: Raw bytes of the uploaded file.
        filename: Original filename.

    Returns:
        Path to the saved file.
    """
    ext = filename.rsplit(".", 1)[-1].lower()
    unique_name = f"upload_{uuid.uuid4().hex[:12]}.{ext}"
    save_path = os.path.join(OUTPUT_DIR, unique_name)

    with open(save_path, "wb") as f:
        f.write(file_bytes)

    return save_path


def generate_annotated_image(yolo_result) -> str:
    """
    Generate an annotated image with bounding boxes from YOLO results.

    Args:
        yolo_result: Raw YOLO result object with plot() method.

    Returns:
        URL path to the annotated image.
    """
    # Use YOLO's built-in plot method for clean annotations
    annotated_frame = yolo_result.plot(
        conf=True,       # Show confidence scores
        labels=True,     # Show class labels
        line_width=2,    # Bounding box line width
    )

    # Generate unique filename
    unique_name = f"annotated_{uuid.uuid4().hex[:12]}.jpg"
    save_path = os.path.join(OUTPUT_DIR, unique_name)

    # Save with good quality
    cv2.imwrite(save_path, annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 92])

    # Return the URL path (relative to static mount)
    return f"/static/outputs/{unique_name}"


def cleanup_file(file_path: str):
    """Remove a temporary file if it exists."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        pass
