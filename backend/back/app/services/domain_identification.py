import json
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# ==============================
# LOAD ENV
# ==============================

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger(__name__)

# ==============================
# GROQ CONFIG
# ==============================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found in .env")

client = Groq(api_key=GROQ_API_KEY)

MODEL_NAME = "llama-3.1-8b-instant"


# ==============================
# GROQ CALL FUNCTION
# ==============================

def call_groq(system_prompt: str, user_prompt: str):

    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0,
        max_tokens=1000,
        response_format={"type": "json_object"}
    )

    raw_text = completion.choices[0].message.content.strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        raise Exception("Failed to parse Groq JSON response")


# ==============================
# MAIN SERVICE FUNCTION
# ==============================

def identify_domain_service(text: str):

    if not text or not text.strip():
        raise ValueError("Text input cannot be empty")

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

    user_prompt = f"Classify this text:\n{text[:6000]}"

    result = call_groq(system_prompt, user_prompt)

    required_keys = {"domain", "confidence", "reason"}

    if not all(k in result for k in required_keys):
        raise Exception("Model JSON missing required fields")

    return result