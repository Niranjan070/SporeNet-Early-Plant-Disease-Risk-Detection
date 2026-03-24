"""
SporeNet Risk Calculator
Computes disease risk based on spore coverage percentage.
"""

from config import (
    COVERAGE_LOW_THRESHOLD,
    COVERAGE_MODERATE_THRESHOLD,
    SPORE_DISEASE_MAP,
)


def calculate_risk(spore_count: int, total_spore_area: float, image_width: int, image_height: int) -> dict:
    """
    Calculate disease risk based on spore coverage percentage.

    This determines the total area of all detected spore bounding boxes
    as a percentage of the entire image area. This is highly robust because
    it automatically accounts for different microscope magnifications!
    """
    actual_area = image_width * image_height

    # Avoid division by zero
    if actual_area == 0:
        coverage_percent = 0.0
    else:
        # Calculate coverage (capped at 100.0)
        coverage_percent = min((total_spore_area / actual_area) * 100, 100.0)

    # Determine risk level and generate recommendation
    if coverage_percent < COVERAGE_LOW_THRESHOLD:
        risk_level = "Low"
        risk_color = "#10B981"  # Emerald green
        recommendation = (
            "No immediate action needed. Spore coverage is strictly within safe limits. "
            "Continue regular field monitoring every 3–5 days."
        )
        precautions = [
            "Maintain regular crop inspection schedule",
            "Ensure proper field drainage",
            "Monitor weather conditions for humidity spikes",
        ]
    elif coverage_percent < COVERAGE_MODERATE_THRESHOLD:
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
            "Critical spore coverage detected! Immediate action required. "
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
        "coverage_percent": round(coverage_percent, 2),
        "raw_count": spore_count,
        "recommendation": recommendation,
        "precautions": precautions,
        "spore_type": disease_info.get("spore_type", "Unknown"),
        "disease": disease_info.get("disease", "Unknown"),
        "affected_crop": disease_info.get("affected_crop", "Unknown"),
        "description": disease_info.get("description", ""),
    }
