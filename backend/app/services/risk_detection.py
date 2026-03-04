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

MODEL_NAME = "qwen/qwen3-32b"


# ==============================
# GROQ CALL FUNCTION
# ==============================

def call_groq(prompt: str):

    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an advanced multi-domain Risk Detection Agent. "
                    "Analyze deeply. Return only valid JSON."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        top_p=0.9,
        max_tokens=3500,
        response_format={"type": "json_object"}
    )

    raw_text = completion.choices[0].message.content.strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON returned: {raw_text}")
        raise Exception("Model returned invalid JSON format")


# ==============================
# MAIN SERVICE FUNCTION
# ==============================

def detect_risk_service(content: str, domain: str, language: str):

    if not content.strip() or not domain.strip():
        raise ValueError("Content and domain cannot be empty")

    prompt = f"""
You are a highly intelligent, domain-aware Risk Detection Agent.

Analyze the document deeply and identify risks.

Return ONLY JSON in this format:

{{
  "risk_summary": "Overall risk assessment summary.",
  "overall_risk_level": "Low | Medium | High | Critical",
  "risks": [
    {{
      "risk_title": "Short risk title",
      "risk_type": "Legal | Financial | Operational | Compliance | Strategic | Medical | Academic | Other",
      "severity": "Low | Medium | High | Critical",
      "description": "Detailed explanation",
      "impact": "Potential consequence",
      "ipc_reference": "Relevant IPC section or null",
      "confidence_score": 0.0
    }}
  ]
}}

Rules:
- Only JSON output
- Confidence score must be between 0 and 1
- Avoid hallucinating IPC sections

Domain: {domain}
Language: {language}

Document Content:
{content[:8000]}
"""

    result = call_groq(prompt)

    required_keys = ["risk_summary", "overall_risk_level", "risks"]

    if not all(key in result for key in required_keys):
        raise Exception("Missing required fields in risk response")

    if not isinstance(result["risks"], list):
        raise Exception("Risks must be a list")

    for risk in result["risks"]:
        required_risk_keys = [
            "risk_title",
            "risk_type",
            "severity",
            "description",
            "impact",
            "ipc_reference",
            "confidence_score"
        ]

        if not all(key in risk for key in required_risk_keys):
            raise Exception("Invalid risk object structure")

        if not isinstance(risk["confidence_score"], (int, float)) or not (0 <= risk["confidence_score"] <= 1):
            raise Exception("confidence_score must be between 0 and 1")

    return result