# specify_goal.py

import json
import logging
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
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
router = APIRouter(prefix="/specify-goal", tags=["Goal Specification"])

# ==============================
# GEMINI CONFIG
# ==============================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY is missing. Check backend/.env")
    raise RuntimeError("GEMINI_API_KEY not found in environment")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

# ==============================
# INPUT MODEL
# ==============================

class GoalInput(BaseModel):
    goal: str
    pdf_content: str


# ==============================
# CLEAN JSON RESPONSE
# ==============================

def clean_json_response(content: str) -> str:
    if not content:
        return "{}"

    text = content.strip()

    # Remove markdown blocks
    text = re.sub(r"^```[a-z]*\n|```$", "", text, flags=re.MULTILINE)

    # Remove accidental extra text
    start = text.find("{")
    end = text.rfind("}") + 1

    if start >= 0 and end > start:
        text = text[start:end]

    return text.strip()


# ==============================
# GEMINI CALL
# ==============================

def call_gemini(system_prompt: str, user_prompt: str) -> dict:
    try:
        full_prompt = f"""
SYSTEM:
{system_prompt}

USER:
{user_prompt}

IMPORTANT:
Return ONLY valid JSON.
"""

        chat = model.start_chat(history=[])
        response = chat.send_message(
            full_prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 500,
            }
        )

        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Empty response from Gemini")

        cleaned = clean_json_response(response.text)

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from Gemini:\n{response.text}")
            raise HTTPException(status_code=500, detail="AI returned invalid JSON format")

    except Exception as e:
        logger.error(f"Gemini API error: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="Gemini request failed")


# ==============================
# ENDPOINT
# ==============================

@router.post("/")
async def specify_goal(input: GoalInput):

    if not input.goal.strip():
        raise HTTPException(status_code=400, detail="Goal input cannot be empty")

    if not input.pdf_content.strip():
        raise HTTPException(status_code=400, detail="PDF content cannot be empty")

    system_prompt = """
You are an expert goal specification assistant.

STRICT RULES:
- Respond with ONLY a valid JSON object.
- NO markdown
- NO code blocks
- NO explanations
- Output must be directly parseable with json.loads()

Return exactly this format:

{
  "procedure": "1-2 sentence high-level plan",
  "approach": "2-3 sentence strategic approach",
  "steps": ["step 1", "step 2", "step 3", "step 4"]
}

If the goal is unrelated to the document content:
{"error": "Goal does not match document domain"}
"""

    user_prompt = f"""
User Goal:
{input.goal}

Document Content (first 10000 chars):
{input.pdf_content[:10000]}
"""

    result = call_gemini(system_prompt, user_prompt)

    # ==============================
    # VALIDATION
    # ==============================

    if "error" in result:
        return {"error": "Goal does not match document domain"}

    required_keys = ["procedure", "approach", "steps"]

    if not all(key in result for key in required_keys):
        logger.error(f"Invalid structure from Gemini: {result}")
        raise HTTPException(status_code=500, detail="Invalid response structure from AI")

    if not isinstance(result["steps"], list) or not (3 <= len(result["steps"]) <= 5):
        raise HTTPException(status_code=500, detail="Steps must be a list of 3-5 items")

    logger.info("Goal specification successful via Gemini")

    return result