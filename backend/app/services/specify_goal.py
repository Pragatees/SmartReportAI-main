import json
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

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
    raise RuntimeError("GROQ_API_KEY not found")

client = Groq(api_key=GROQ_API_KEY)

MODEL_NAME = "meta-llama/llama-4-maverick-17b-128e-instruct"


# ==============================
# GROQ CALL
# ==============================

def call_groq(system_prompt: str, user_prompt: str):

    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0,
        max_tokens=800,
        response_format={"type": "json_object"}
    )

    raw_text = completion.choices[0].message.content.strip()

    return json.loads(raw_text)


# ==============================
# SERVICE FUNCTION
# ==============================

def specify_goal_service(goal: str, pdf_content: str):

    if not goal.strip():
        raise ValueError("Goal input cannot be empty")

    if not pdf_content.strip():
        raise ValueError("PDF content cannot be empty")

    system_prompt = """
You are an expert goal specification assistant.

STRICT RULES:
- Respond with ONLY valid JSON
- No markdown
- No explanations

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
{goal}

Document Content (first 10000 chars):
{pdf_content[:10000]}
"""

    result = call_groq(system_prompt, user_prompt)

    if "error" in result:
        return {"error": "Goal does not match document domain"}

    required_keys = ["procedure", "approach", "steps"]

    if not all(key in result for key in required_keys):
        raise Exception("Invalid response structure from AI")

    if not isinstance(result["steps"], list) or not (3 <= len(result["steps"]) <= 5):
        raise Exception("Steps must contain 3-5 items")

    return result