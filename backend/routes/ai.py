"""
AI routes for Gemini-powered assistants.
"""

from __future__ import annotations

import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from utils.gemini_service import generate_farming_chat_response, generate_image_diagnosis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatHistoryItem(BaseModel):
    """One conversation turn exchanged with the assistant."""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class FarmingChatRequest(BaseModel):
    """Request payload for the general farming assistant."""

    message: str = Field(..., min_length=1, max_length=4000)
    crop_type: str = Field(default="", max_length=120)
    history: list[ChatHistoryItem] = Field(default_factory=list)


class FarmingChatResponse(BaseModel):
    """Response payload for the general farming assistant."""

    reply: str
    advice: dict[str, Any]


class ImageDiagnosisRequest(BaseModel):
    """Request payload for the image-specific diagnosis assistant."""

    analysis: dict[str, Any]
    crop_type: str = Field(default="", max_length=120)
    question: str = Field(default="", max_length=4000)
    history: list[ChatHistoryItem] = Field(default_factory=list)


class ImageDiagnosisResponse(BaseModel):
    """Response payload for the image-specific diagnosis assistant."""

    reply: str
    diagnosis: dict[str, Any]


@router.post("/chat", response_model=FarmingChatResponse)
async def farming_chat(request: FarmingChatRequest) -> FarmingChatResponse:
    """Handle general farming questions through Gemini."""
    try:
        advice = generate_farming_chat_response(
            message=request.message,
            crop_type=request.crop_type,
            history=[item.model_dump() for item in request.history],
        )
        return FarmingChatResponse(
            reply=advice.get("farmer_message") or advice.get("simple_answer") or "Guidance is ready.",
            advice=advice,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Farming assistant failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate farming assistant response.") from exc


@router.post("/image-diagnosis", response_model=ImageDiagnosisResponse)
async def image_diagnosis(request: ImageDiagnosisRequest) -> ImageDiagnosisResponse:
    """Handle diagnosis requests tied to a specific analyzed microscope image."""
    if not request.analysis:
        raise HTTPException(status_code=400, detail="Analysis data is required for image diagnosis.")

    try:
        diagnosis = generate_image_diagnosis(
            analysis=request.analysis,
            crop_type=request.crop_type,
            question=request.question,
            history=[item.model_dump() for item in request.history],
        )
        return ImageDiagnosisResponse(
            reply=diagnosis.get("farmer_message") or diagnosis.get("headline") or "Diagnosis ready.",
            diagnosis=diagnosis,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Image diagnosis assistant failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate image diagnosis response.") from exc
