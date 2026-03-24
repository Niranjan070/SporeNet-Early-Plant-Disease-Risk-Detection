"""
SporeNet Risk Calculator
Computes disease risk based on spore density, normalized to a reference field of view.
"""

from config import (
    REFERENCE_AREA,
    LOW_RISK_THRESHOLD,
    MODERATE_RISK_THRESHOLD,
    SPORE_DISEASE_MAP,
)


def calculate_risk(spore_count: int, image_width: int, image_height: int) -> dict:
    """
    Calculate disease risk based on spore density.

    Instead of using raw spore count, we normalize the count to a reference
    field of view (640×640 pixels). This ensures consistent risk assessment
    regardless of the image resolution or magnification level.

    Formula:
        actual_area = image_width × image_height
        normalization_factor = REFERENCE_AREA / actual_area
        normalized_count = spore_count × normalization_factor

    Args:
        spore_count: Number of spores detected in the image.
        image_width: Width of the input image in pixels.
        image_height: Height of the input image in pixels.

    Returns:
        Dictionary with risk assessment results.
    """
    actual_area = image_width * image_height

    # Avoid division by zero
    if actual_area == 0:
        normalization_factor = 1.0
    else:
        normalization_factor = REFERENCE_AREA / actual_area

    normalized_count = spore_count * normalization_factor

    # Determine risk level and generate recommendation
    if normalized_count < LOW_RISK_THRESHOLD:
        risk_level = "Low"
        risk_color = "#10B981"  # Emerald green
        recommendation = (
            "No immediate action needed. Spore density is within safe limits. "
            "Continue regular field monitoring every 3–5 days."
        )
        precautions = [
            "Maintain regular crop inspection schedule",
            "Ensure proper field drainage",
            "Monitor weather conditions for humidity spikes",
        ]
    elif normalized_count < MODERATE_RISK_THRESHOLD:
        risk_level = "Moderate"
        risk_color = "#F59E0B"  # Amber
        recommendation = (
            "Elevated spore density detected. Consider applying preventive fungicide "
            "(e.g., Tricyclazole or Isoprothiolane). Increase monitoring to every 1–2 days."
        )
        precautions = [
            "Apply preventive fungicide within 24–48 hours",
            "Reduce nitrogen fertilizer application",
            "Ensure proper spacing between plants for air circulation",
            "Monitor neighboring fields for infection signs",
            "Consider draining standing water if present",
        ]
    else:
        risk_level = "High"
        risk_color = "#EF4444"  # Red
        recommendation = (
            "Critical spore density detected! Immediate action required. "
            "Apply systemic fungicide immediately. Inspect crop for visible symptoms "
            "(lesions, spots). Consider isolating the affected area."
        )
        precautions = [
            "Apply systemic fungicide IMMEDIATELY",
            "Inspect all plants for blast lesions (diamond-shaped spots)",
            "Isolate affected area to prevent spread",
            "Stop nitrogen fertilizer application",
            "Drain excess water from the field",
            "Report to local agricultural extension office",
            "Document affected areas with photographs",
        ]

    # Get disease info
    disease_info = SPORE_DISEASE_MAP.get("default", {})

    return {
        "risk_level": risk_level,
        "risk_color": risk_color,
        "normalized_count": round(normalized_count, 1),
        "raw_count": spore_count,
        "density_per_field": round(normalized_count, 1),
        "recommendation": recommendation,
        "precautions": precautions,
        "spore_type": disease_info.get("spore_type", "Unknown"),
        "disease": disease_info.get("disease", "Unknown"),
        "affected_crop": disease_info.get("affected_crop", "Unknown"),
        "description": disease_info.get("description", ""),
    }
