"""
Gemini AI Integration Service
Shared Gemini helpers for risk assessment, farming chat, and image diagnosis.
"""

from __future__ import annotations

import json
import logging
import os
from collections import Counter
from typing import Any

from dotenv import load_dotenv
from google.api_core.exceptions import NotFound
import google.generativeai as genai

from config import SPORE_DISEASE_MAP

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"


def is_gemini_configured() -> bool:
    """Return whether a Gemini API key is available."""
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


def initialize_gemini() -> bool:
    """Initialize the Gemini API client using the environment variable."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        logger.warning("GEMINI_API_KEY not found in environment. Gemini features are disabled.")
        return False

    genai.configure(api_key=api_key)
    return True


def _candidate_models() -> list[str]:
    """Return an ordered set of model names to try."""
    candidates = [
        DEFAULT_GEMINI_MODEL,
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
    ]

    unique_candidates = []
    seen = set()
    for model_name in candidates:
        normalized = model_name.strip()
        if normalized and normalized not in seen:
            unique_candidates.append(normalized)
            seen.add(normalized)

    return unique_candidates


def _get_model(model_name: str) -> genai.GenerativeModel:
    """Create a configured Gemini model instance."""
    if not initialize_gemini():
        raise RuntimeError("Gemini AI is not configured. Add GEMINI_API_KEY in backend/.env.")

    return genai.GenerativeModel(model_name)


def _clean_model_text(text: str) -> str:
    """Normalize Gemini text output and strip markdown fences when present."""
    cleaned = text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]

    return cleaned.strip()


def _call_model(prompt: str) -> str:
    """Send a prompt to Gemini and return cleaned text."""
    last_error: Exception | None = None
    attempted_models = _candidate_models()

    for model_name in attempted_models:
        try:
            model = _get_model(model_name)
            response = model.generate_content(prompt)
            text = getattr(response, "text", "") or ""

            if not text.strip():
                raise RuntimeError(f"Gemini model '{model_name}' returned an empty response.")

            return _clean_model_text(text)
        except NotFound as exc:
            logger.warning("Gemini model '%s' is unavailable. Trying next fallback.", model_name)
            last_error = exc

    if last_error:
        attempted = ", ".join(attempted_models)
        raise RuntimeError(
            f"No supported Gemini text model is currently available. Tried: {attempted}. "
            "Set GEMINI_MODEL in backend/.env to a currently supported model such as gemini-2.5-flash."
        ) from last_error

    raise RuntimeError("Gemini request failed before any model could return a response.")


def _parse_json_response(text: str) -> dict[str, Any]:
    """Parse a Gemini JSON response, tolerating a small amount of surrounding text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start_index = text.find("{")
        end_index = text.rfind("}")
        if start_index == -1 or end_index == -1:
            raise
        return json.loads(text[start_index : end_index + 1])


def _string_list(value: Any) -> list[str]:
    """Normalize a value into a list of non-empty strings."""
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _format_history(history: list[dict[str, str]] | None) -> str:
    """Serialize recent chat history into a prompt-friendly block."""
    if not history:
        return "No previous conversation."

    lines = []
    for item in history[-8:]:
        role = str(item.get("role", "user")).strip().lower() or "user"
        content = str(item.get("content", "")).strip()
        if content:
            lines.append(f"{role.title()}: {content}")

    return "\n".join(lines) if lines else "No previous conversation."


def _format_detection_breakdown(detections: list[dict[str, Any]]) -> str:
    """Summarize detection classes and counts."""
    if not detections:
        return "No spores detected"

    class_counts = Counter(detection.get("class", "Unknown") for detection in detections)
    return "; ".join(f"{name}: {count}" for name, count in class_counts.items())


def _risk_color_for(level: str) -> str:
    """Map risk labels to UI colors."""
    normalized = level.strip().lower()
    if normalized == "low":
        return "#10B981"
    if normalized == "moderate":
        return "#F59E0B"
    return "#EF4444"


def generate_risk_assessment(
    detections: list[dict[str, Any]],
    spore_count: int,
    total_spore_area: float,
    image_width: int,
    image_height: int,
    main_class: str,
    crop_type: str,
) -> dict[str, Any] | None:
    """
    Generate dynamic risk assessment via Gemini API.

    Returns None when Gemini is unavailable or parsing fails, allowing the
    deterministic local fallback to take over.
    """
    if not is_gemini_configured():
        return None

    actual_area = image_width * image_height
    coverage_percent = min((total_spore_area / actual_area) * 100, 100.0) if actual_area > 0 else 0.0
    detection_summary = _format_detection_breakdown(detections)
    disease_info = SPORE_DISEASE_MAP.get(main_class, SPORE_DISEASE_MAP.get("default", {}))

    prompt = f"""
You are an expert plant pathologist supporting the SporeNet disease detection platform.

The user submitted a microscopic image from a '{crop_type}' crop.
YOLO analysis details:
- Total detected spores: {spore_count}
- Spore breakdown: {detection_summary}
- Dominant detected class: {main_class}
- Linked disease from local mapping: {disease_info.get("disease", "Unknown disease")}
- Slide coverage percent: {coverage_percent:.2f}%

Task:
1. Determine the disease risk level using only: Low, Moderate, or High.
2. Explain the disease briefly and in practical language.
3. Provide one short recommendation paragraph.
4. Provide a list of precautions tailored to the crop context.

Return strict JSON with exactly these keys:
{{
  "risk_level": "",
  "disease": "",
  "spore_type": "",
  "affected_crop": "",
  "description": "",
  "recommendation": "",
  "precautions": []
}}

Do not include markdown.
"""

    try:
        result = _parse_json_response(_call_model(prompt))
        risk_level = str(result.get("risk_level", "High")).strip() or "High"
        return {
            "risk_level": risk_level,
            "risk_color": _risk_color_for(risk_level),
            "disease": str(result.get("disease", disease_info.get("disease", "Unknown Disease"))).strip()
            or disease_info.get("disease", "Unknown Disease"),
            "spore_type": str(result.get("spore_type", disease_info.get("spore_type", "Unknown"))).strip()
            or disease_info.get("spore_type", "Unknown"),
            "affected_crop": str(result.get("affected_crop", disease_info.get("affected_crop", "Unknown"))).strip()
            or disease_info.get("affected_crop", "Unknown"),
            "description": str(result.get("description", disease_info.get("description", ""))).strip()
            or disease_info.get("description", ""),
            "recommendation": str(result.get("recommendation", "")).strip()
            or "Review the sample carefully and continue close monitoring.",
            "precautions": _string_list(result.get("precautions")),
            "coverage_percent": round(coverage_percent, 2),
        }
    except Exception as exc:
        logger.error("Gemini risk assessment failed: %s", exc, exc_info=True)
        return None


def generate_farming_chat_reply(
    message: str,
    crop_type: str = "",
    history: list[dict[str, str]] | None = None,
) -> str:
    """Generate a Gemini response for the general farming assistant."""
    prompt = f"""
You are SporeNet Farm Assistant, a practical agricultural support chatbot for farmers.

Your mission:
- Help with crop care, plant disease prevention, irrigation, soil health, pest awareness, and field decisions.
- Use simple language first.
- Prefer practical and low-cost advice when possible.
- Mention uncertainty clearly if the information is incomplete.
- Do not invent pesticide dosages or region-specific legal guidance.
- End with 2 to 4 practical next steps.

Farmer crop context:
{crop_type.strip() or "Unknown crop"}

Conversation so far:
{_format_history(history)}

Latest farmer question:
{message.strip()}
"""

    return _call_model(prompt)


def generate_image_diagnosis(
    analysis: dict[str, Any],
    crop_type: str = "",
    question: str = "",
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """Generate structured diagnosis guidance for a specific analyzed image."""
    detections = analysis.get("detections", []) or []
    default_question = (
        "Give a full diagnosis for this analyzed microscope image and recommend prevention steps based on the spore frequency."
    )
    prompt = f"""
You are SporeNet Image Diagnosis Copilot, an agricultural AI assistant that receives structured microscope-analysis data from a YOLO spore detection pipeline.

You must explain the detected spore, interpret the frequency signal, connect it to likely disease risk, and give prevention steps that a farmer can act on.

Crop context:
- farmer_crop_type: {crop_type.strip() or analysis.get("affected_crop") or "Unknown crop"}

Current analysis from the app:
- detected_spore_type: {analysis.get("spore_type", "Unknown")}
- likely_disease: {analysis.get("disease", "Unknown Disease")}
- affected_crop_from_model: {analysis.get("affected_crop", "Unknown")}
- spore_count: {analysis.get("spore_count", "Unknown")}
- coverage_percent: {analysis.get("coverage_percent", "Unknown")}
- average_confidence: {analysis.get("confidence_avg", "Unknown")}
- risk_level: {analysis.get("risk_level", "Unknown")}
- recommendation_from_backend: {analysis.get("recommendation", "No recommendation available")}
- precautions_from_backend: {'; '.join(analysis.get("precautions", []) or ["No backend precautions provided"])}
- detection_breakdown: {_format_detection_breakdown(detections)}

Conversation so far:
{_format_history(history)}

Latest farmer request:
{question.strip() or default_question}

Instructions:
1. Explain the spore in farmer-friendly language.
2. Interpret both spore_count and coverage_percent together.
3. Say whether the pattern looks isolated, emerging, recurring, or dense.
4. Explain how this may affect early disease development.
5. Give prevention guidance split into immediate actions, next week actions, and monitoring plan.
6. Mention urgent flags if the farmer should escalate to a local agronomist or plant pathologist.
7. Be honest about uncertainty from a single image.

Return strict JSON with exactly these keys:
{{
  "headline": "",
  "spore_explanation": "",
  "frequency_interpretation": "",
  "disease_outlook": "",
  "immediate_actions": [],
  "next_week_actions": [],
  "monitoring_plan": [],
  "urgent_flags": [],
  "farmer_message": ""
}}

Do not return markdown.
Do not invent measurements not present in the input.
"""

    result = _parse_json_response(_call_model(prompt))

    return {
        "headline": str(result.get("headline", "Image diagnosis ready")).strip() or "Image diagnosis ready",
        "spore_explanation": str(result.get("spore_explanation", "")).strip(),
        "frequency_interpretation": str(result.get("frequency_interpretation", "")).strip(),
        "disease_outlook": str(result.get("disease_outlook", "")).strip(),
        "immediate_actions": _string_list(result.get("immediate_actions")),
        "next_week_actions": _string_list(result.get("next_week_actions")),
        "monitoring_plan": _string_list(result.get("monitoring_plan")),
        "urgent_flags": _string_list(result.get("urgent_flags")),
        "farmer_message": str(result.get("farmer_message", "")).strip(),
    }
