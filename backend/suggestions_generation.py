import json
import logging
from fastapi import APIRouter, HTTPException
from models import SuggestionInput

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

router = APIRouter(prefix="/generate-suggestions", tags=["Suggestions Generation"])

# ==============================
# GEMINI CONFIG
# ==============================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY missing in backend/.env")
    raise RuntimeError("GEMINI_API_KEY not found")

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


# ==============================
# GEMINI CALL FUNCTION
# ==============================

def call_gemini(prompt: str):
    try:
        chat = model.start_chat(history=[])
        response = chat.send_message(prompt)

        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Empty response from Gemini")

        raw_text = response.text.strip()

        # Try direct parsing
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Extract JSON array safely
            start = raw_text.find("[")
            end = raw_text.rfind("]") + 1

            if start == -1 or end == -1:
                raise HTTPException(
                    status_code=500,
                    detail="Gemini did not return valid JSON array"
                )

            cleaned_json = raw_text[start:end]
            return json.loads(cleaned_json)

    except json.JSONDecodeError as je:
        logger.error(f"Invalid JSON returned: {raw_text}")
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Model returned invalid JSON format",
                "original_response": raw_text,
                "error": str(je)
            }
        )

    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate suggestions: {str(e)}"
        )


# ==============================
# MAIN ENDPOINT
# ==============================

@router.post("/")
async def generate_suggestions(input: SuggestionInput):

    if not input.insights or not isinstance(input.insights, list):
        logger.warning("Invalid or empty insights received")
        raise HTTPException(
            status_code=400,
            detail="Insights must be a non-empty list"
        )

    insights_json = json.dumps(input.insights, indent=2)

    prompt = f"""
You are a professional AI Suggestion Agent.

Based on each of the following detailed insights, generate EXACTLY ONE clear,
focused, and actionable suggestion per insight.

STRICT RULES:
- Return the SAME number of suggestions as insights (1-to-1 mapping).
- Each suggestion must directly resolve or mitigate the issue.
- Avoid generic advice.
- If risk_factors exist, prioritize mitigating them.
- Return ONLY a valid JSON array of strings.
- No explanations. No markdown.

Required format:

[
  "Suggestion for Insight 1",
  "Suggestion for Insight 2"
]

Input Insights:
{insights_json}
"""

    suggestions = call_gemini(prompt)

    # ==============================
    # VALIDATION
    # ==============================

    if not isinstance(suggestions, list):
        raise HTTPException(
            status_code=500,
            detail="Response must be a JSON array"
        )

    if len(suggestions) != len(input.insights):
        raise HTTPException(
            status_code=500,
            detail="Mismatch in number of suggestions and insights"
        )

    return {"suggestions": suggestions}