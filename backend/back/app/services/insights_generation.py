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
                "content": "You are a professional domain analyst. Return only valid JSON."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.4,
        top_p=0.9,
        max_tokens=3000,
        response_format={"type": "json_object"}
    )

    raw_text = completion.choices[0].message.content.strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON returned: {raw_text}")
        raise Exception("Model returned invalid JSON format")


# ==============================
# MAIN SERVICE FUNCTION
# ==============================

def generate_insights_service(content: str, domain: str, language: str):

    if not content.strip() or not domain.strip():
        raise ValueError("Content and domain cannot be empty")

    prompt = f"""
You are a highly skilled and domain-aware AI Insight Agent.

Analyze the document deeply based on its domain and full content.

Respond ONLY with valid JSON in this exact format:

{{
  "detailed_insights": [
    {{
      "title": "Insight Title",
      "description": "Detailed explanation with reasoning and implications.",
      "supporting_data": ["fact1", "fact2"]
    }}
  ],
  "domain_summary": "Deep summary of document purpose and key findings."
}}

Rules:
- No text before or after JSON
- Provide at least 3 insights
- Avoid generic statements

Domain: {domain}
Language: {language}

Content:
{content[:8000]}
"""

    result = call_groq(prompt)

    if "detailed_insights" not in result or "domain_summary" not in result:
        raise Exception("Missing required fields in response")

    if not isinstance(result["detailed_insights"], list):
        raise Exception("detailed_insights must be a list")

    if len(result["detailed_insights"]) < 3:
        raise Exception("At least 3 insights must be generated")

    return result