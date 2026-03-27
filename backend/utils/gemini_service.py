"""
Gemini AI Integration Service
Responsible for generating dynamic context-aware risk assessments based on local YOLO detections.
"""

import os
import json
import logging
from dotenv import load_dotenv
import google.generativeai as genai
from config import SPORE_DISEASE_MAP

load_dotenv()

logger = logging.getLogger(__name__)

def initialize_gemini():
    """Initialize the Gemini API client using the environment variable."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not found in environment. Intelligent risk assessment will be disabled.")
        return False
    
    genai.configure(api_key=api_key)
    return True

def generate_risk_assessment(detections, spore_count, total_spore_area, image_width, image_height, main_class, crop_type):
    """
    Generate dynamic risk assessment via Gemini API.
    
    Args:
        detections (list): List of dicts representing raw YOLO detections.
        spore_count (int): Total number of spores detected.
        total_spore_area (float): Sum of bounding box areas for all detections.
        image_width (int): Image width in pixels.
        image_height (int): Image height in pixels.
        main_class (str): Code identifier for the primary spore type.
        crop_type (str): Name of the crop type submitted by the user.

    Returns:
        dict: Parsed JSON response containing dynamic assessment or None if failed.
    """
    if not initialize_gemini():
        return None

    actual_area = image_width * image_height
    coverage_percent = min((total_spore_area / actual_area) * 100, 100.0) if actual_area > 0 else 0.0

    # Format detection counts for prompt
    from collections import Counter
    class_counts = Counter(d["class"] for d in detections)
    detection_summary = ", ".join([f"{count} x {cls}" for cls, count in class_counts.items()])
    if not detection_summary:
        detection_summary = "None (No spores detected)"

    disease_info = SPORE_DISEASE_MAP.get(main_class, SPORE_DISEASE_MAP.get("default", {}))

    prompt = f"""
    You are an expert plant pathologist and AI assistant for the SporeNet early disease detection platform.
    
    The user submitted a microscopic image of a sample collected from a '{crop_type}' crop.
    Our local YOLOv8 detection engine found the following airborne fungal spores on the slide:
    - Total detected spores: {spore_count}
    - Spore types and breakdown: {detection_summary}
    - The most prominent detected class is '{main_class}', which is commonly associated with '{disease_info.get("disease", "Unknown disease")}'.
    - The raw physical coverage density of the spores across the slide is {coverage_percent:.2f}%.

    Based on the number and specific types of spores detected, combined with the crop type '{crop_type}':
    1. Determine the overall Disease Risk Level (Select strictly from: 'Low', 'Moderate', or 'High'). Provide a short, actionable recommendation (2-3 sentences max).
    2. Provide a list of critical precautions/action items tailored specifically to the '{crop_type}' crop dealing with the identified spores.
    3. Return your response STRICTLY as valid JSON code, with the following exact keys:
       "risk_level" (string), "disease" (string), "spore_type" (string), "description" (string, explaining the disease), "recommendation" (string), "precautions" (list of strings).
       Do not include markdown blocks or any other text outside the JSON.
    """

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up possible markdown code blocks returned by Gemini
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        result = json.loads(text)
        result["coverage_percent"] = round(coverage_percent, 2)
        
        # Determine strict color fallback
        risk = result.get("risk_level", "").lower()
        if risk == "low":
            result["risk_color"] = "#10B981"
        elif risk == "moderate":
            result["risk_color"] = "#F59E0B"
        else:
            result["risk_color"] = "#EF4444"
            
        return result

    except Exception as e:
        logger.error(f"Gemini API failure: {e}", exc_info=True)
        return None
