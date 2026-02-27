# domain_identification.py

import json
import logging
from fastapi import APIRouter, HTTPException
from models import TextInput

# 🔹 Load .env
from pathlib import Path
from dotenv import load_dotenv
import os

import google.generativeai as genai

# ==============================
# LOAD ENV
# ==============================

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/identify-domain",
    tags=["Domain Identification"]
)

# ==============================
# GEMINI CONFIG
# ==============================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("❌ GEMINI_API_KEY not found in backend/.env")

genai.configure(api_key=GEMINI_API_KEY)

# Use your reference model
model = genai.GenerativeModel("gemini-2.5-flash")


# ==============================
# GEMINI CALL FUNCTION
# ==============================

def call_gemini(system_prompt: str, user_prompt: str):

    try:
        # Start chat session (like your reference code)
        chat = model.start_chat(history=[
            {"role": "user", "parts": [system_prompt]}
        ])

        response = chat.send_message(user_prompt)

        if not response or not response.text:
            raise HTTPException(
                status_code=500,
                detail="Empty response from Gemini"
            )

        raw_text = response.text.strip()

        # Try direct JSON parse
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Extract JSON safely if Gemini added extra text
            start = raw_text.find("{")
            end = raw_text.rfind("}") + 1

            if start == -1 or end == -1:
                raise HTTPException(
                    status_code=500,
                    detail="Gemini did not return valid JSON"
                )

            cleaned = raw_text[start:end]
            return json.loads(cleaned)

    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to parse Gemini response as JSON"
        )

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Gemini request failed: {str(e)}"
        )


# ==============================
# MAIN ENDPOINT
# ==============================

@router.post("/")
async def identify_domain(input: TextInput):

    if not input.text or not input.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text input cannot be empty"
        )

    system_prompt = """
You are an expert domain classifier.

Respond ONLY in this exact JSON format:

{
  "domain": "Healthcare | Finance | Education | Legal | Resume/Career | Technology | Government | General Knowledge | Others",
  "confidence": 0.00,
  "reason": "Short explanation"
}

Rules:
- Only one domain allowed.
- Confidence must be a float between 0.00 and 1.00.
- Do NOT return anything outside JSON.
"""

    user_prompt = f"Classify this text:\n{input.text[:8000]}"

    result = call_gemini(system_prompt, user_prompt)

    required_keys = {"domain", "confidence", "reason"}

    if not all(k in result for k in required_keys):
        raise HTTPException(
            status_code=500,
            detail="Gemini JSON missing required fields"
        )

    return result