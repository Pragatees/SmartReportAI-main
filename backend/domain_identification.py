# domain_identification.py

import json
import logging
import re
import requests
from fastapi import APIRouter, HTTPException
from models import TextInput

# 🔹 Load .env variables
from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")  # Load backend/.env

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/identify-domain", tags=["Domain Identification"])

# 🔹 Read API key from env
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

if not PERPLEXITY_API_KEY:
    logger.error("❌ PERPLEXITY_API_KEY is missing. Check backend/.env.")
    raise RuntimeError("PERPLEXITY_API_KEY not found in .env")

PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json"
}


# ==============================
# CLEAN JSON FROM PERPLEXITY
# ==============================
def clean_json_response(content: str) -> str:
    """Clean JSON from Perplexity's response."""
    if not content:
        return "{}"

    text = content.strip()

    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"^```[a-z]*\n|```$", "", text, flags=re.MULTILINE)
    text = re.sub(r'^.*?(?=\{)', '', text)
    text = re.sub(r'(?<=\}).*?$', '', text)

    start = text.find("{")
    end = text.rfind("}") + 1
    return text[start:end].strip() if start >= 0 and end > start else "{}"


# ==============================
# PERPLEXITY API CALL FUNCTION
# ==============================
def call_perplexity(system_prompt: str, user_prompt: str):
    """Send structured prompt to Perplexity Sonar Pro"""
    
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.0,
        "max_tokens": 300
    }

    try:
        response = requests.post(PERPLEXITY_API_URL, headers=HEADERS, json=payload, timeout=30)

        if response.status_code >= 400:
            logger.error(f"Perplexity API error {response.status_code}: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Perplexity API error: {response.text[:200]}..."
            )

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not content:
            raise HTTPException(status_code=500, detail="Empty response from Perplexity API")

        cleaned_json_str = clean_json_response(content)

        return json.loads(cleaned_json_str)

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse Perplexity response as JSON")

    except Exception as e:
        logger.error(f"Unexpected error calling Perplexity: {e}")
        raise HTTPException(status_code=502, detail="Perplexity request failed")


# ==============================
# MAIN ENDPOINT
# ==============================
@router.post("/")
async def identify_domain(input: TextInput):
    if not input.text or not input.text.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty")

    system_prompt = """
You are an expert domain classifier. Respond with pure JSON:
{
  "domain": "",
  "confidence": "",
  "reason": ""
}
Only one domain allowed: Healthcare, Finance, Education, Legal, Resume/Career,
Technology, Government, General Knowledge, Others.
Confidence is a float 0.00–1.00.
"""

    user_prompt = f"Text to classify:\n{input.text[:8000]}"

    result = call_perplexity(system_prompt, user_prompt)

    required_keys = {"domain", "confidence", "reason"}
    if not all(k in result for k in required_keys):
        raise HTTPException(status_code=500, detail="Perplexity JSON missing required fields")

    return result
