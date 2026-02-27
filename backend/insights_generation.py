import json
import logging
from fastapi import APIRouter, HTTPException
from models import InsightInput
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

router = APIRouter(prefix="/generate-insights", tags=["Insights Generation"])

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

        # Try direct JSON parse
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Extract JSON safely
            start = raw_text.find("{")
            end = raw_text.rfind("}") + 1

            if start == -1 or end == -1:
                raise HTTPException(
                    status_code=500,
                    detail="Gemini did not return valid JSON"
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
            detail=f"Failed to generate insights: {str(e)}"
        )


# ==============================
# MAIN ENDPOINT
# ==============================

@router.post("/")
async def generate_insights(input: InsightInput):

    if not input.content.strip() or not input.domain.strip():
        logger.warning("Empty content or domain received")
        raise HTTPException(
            status_code=400,
            detail="Content and domain cannot be empty"
        )

    prompt = f"""
You are a highly skilled and domain-aware AI Insight Agent.

Analyze the document below based on its domain and full content.

Respond ONLY with valid JSON in this exact format:

{{
  "detailed_insights": [
    {{
      "title": "Insight Title",
      "description": "Detailed explanation with reasoning.",
      "supporting_data": ["fact1", "fact2"],
      "risk_factors": ["Risk 1", "Risk 2"]
    }}
  ],
  "domain_summary": "Deep summary of document purpose and key findings."
}}

STRICT RULES:
- No text before or after JSON.
- No markdown.
- Use only real content.
- Risk factors must be domain-aware.
- All required fields must exist.

Domain-specific risk guidance:
- Legal → contractual, compliance risks
- Medical → patient, treatment risks
- Finance → fraud, economic risks
- Education → policy, learning risks
- Others → logical domain risks

Domain: {input.domain}
Language: {input.language}

Content:
{input.content[:10000]}
"""

    result = call_gemini(prompt)

    # ==============================
    # VALIDATION
    # ==============================

    if "detailed_insights" not in result or "domain_summary" not in result:
        raise HTTPException(
            status_code=500,
            detail="Missing required fields in response"
        )

    if not isinstance(result["detailed_insights"], list):
        raise HTTPException(
            status_code=500,
            detail="detailed_insights must be a list"
        )

    for insight in result["detailed_insights"]:
        if "risk_factors" not in insight:
            raise HTTPException(
                status_code=500,
                detail="Missing risk_factors in insights"
            )

    return result