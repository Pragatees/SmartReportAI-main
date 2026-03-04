import json
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger(__name__)

# ==============================
# LOAD ENV
# ==============================

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

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

def call_groq(prompt: str):

    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": "You are a strict JSON-only API. Return only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        max_tokens=2000,
        response_format={"type": "json_object"}
    )

    raw_text = completion.choices[0].message.content.strip()

    try:
        parsed = json.loads(raw_text)

        if "suggestions" not in parsed:
            raise Exception("Missing 'suggestions' field in response")

        return parsed["suggestions"]

    except json.JSONDecodeError:
        logger.error(f"Invalid JSON returned from model: {raw_text}")
        raise Exception("Model returned invalid JSON format")


# ==============================
# PROMPT BUILDER
# ==============================

def build_prompt(insights, risks=None, overall_risk_level=None, risk_summary=None):

    # Safe conversion
    insights_json = json.dumps(jsonable_encoder(insights), indent=2)

    base_prompt = """
You are a professional AI Suggestion Agent.

Generate EXACTLY ONE actionable suggestion per insight.

Rules:
- Same number of suggestions as insights
- Each suggestion must be specific
- Address risk mitigation if risks exist

Return ONLY JSON in this format:

{
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ]
}
"""

    risk_block = ""

    if risks:

        # Safe conversion of RiskItem objects
        risks_json = json.dumps(
            jsonable_encoder(risks),
            indent=2
        )

        risk_block = f"""
=== RISK CONTEXT ===
Overall Risk Level: {overall_risk_level or "Unknown"}
Risk Summary: {risk_summary or "N/A"}

Detected Risks:
{risks_json}
====================
"""

    insight_block = f"""
=== INPUT INSIGHTS ===
{insights_json}
======================
"""

    return base_prompt + risk_block + insight_block


# ==============================
# MAIN SERVICE FUNCTION
# ==============================

def generate_suggestions_service(
    insights,
    risks=None,
    overall_risk_level=None,
    risk_summary=None
):

    if not insights or not isinstance(insights, list):
        raise ValueError("Insights must be a non-empty list")

    prompt = build_prompt(
        insights,
        risks,
        overall_risk_level,
        risk_summary
    )

    suggestions = call_groq(prompt)

    if not isinstance(suggestions, list):
        raise Exception("Response must be a JSON array")

    return suggestions