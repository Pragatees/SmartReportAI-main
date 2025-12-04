# specify_goal.py

import json
import logging
import re
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/specify-goal", tags=["Goal Specification"])

# Your actual Perplexity API key
PERPLEXITY_API_KEY = "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"
HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json"
}
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"


class GoalInput(BaseModel):
    goal: str
    pdf_content: str


def clean_json_response(content: str) -> str:
    """
    Extract clean JSON from Perplexity's sonar-pro response.
    Handles markdown code blocks, <think> tags, extra text, etc.
    """
    if not content:
        return "{}"

    text = content.strip()

    # Remove <think>...</think> reasoning blocks (common in sonar-pro)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)

    # Remove markdown code fences: ```json ... ``` or just ```
    text = re.sub(r"^```[a-z]*\n|```$", "", text, flags=re.MULTILINE)

    # Remove any leading/trailing text before first { and after last }
    text = re.sub(r"^.*?(\{.*\}$)", r"\1", text, flags=re.DOTALL)
    text = re.sub(r"(^\{.*?\}).*$", r"\1", text, flags=re.DOTALL)

    # Final brace extraction fallback
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        text = text[start:end]

    return text.strip()


@router.post("/")
async def specify_goal(input: GoalInput):
    if not input.goal.strip():
        logger.warning("Empty goal received")
        raise HTTPException(status_code=400, detail="Goal input cannot be empty")
    if not input.pdf_content.strip():
        logger.warning("Empty PDF content received")
        raise HTTPException(status_code=400, detail="PDF content cannot be empty")

    # Strongly enforce pure JSON output
    system_prompt = """
You are an expert goal specification assistant. Analyze the user's goal and document content.

IMPORTANT RULES:
- Respond with ONLY a valid JSON object.
- NO markdown, NO code blocks, NO ```json, NO explanations, NO extra text.
- NO <think> tags.
- Output must be parseable by json.loads() directly.

Return exactly this format:
{
  "procedure": "1-2 sentence high-level plan",
  "approach": "2-3 sentence strategic approach",
  "steps": ["step 1", "step 2", "step 3", "step 4", "step 5"]
}

If the goal is unrelated to the document content, respond with:
{"error": "Goal does not match document domain"}
"""

    user_prompt = f"""
User Goal: {input.goal}

Document Content (first 10000 chars):
{input.pdf_content[:10000]}
"""

    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 500
    }

    try:
        response = requests.post(PERPLEXITY_API_URL, headers=HEADERS, json=payload, timeout=40)
        
        if response.status_code != 200:
            error_detail = response.text[:500]
            logger.error(f"Perplexity API error {response.status_code}: {error_detail}")
            raise HTTPException(status_code=502, detail=f"Perplexity API error: {response.status_code}")

        data = response.json()
        logger.debug(f"Raw Perplexity response: {data}")

        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        if not content:
            raise HTTPException(status_code=500, detail="Empty response from AI model")

        # Clean and parse JSON safely
        cleaned = clean_json_response(content)
        logger.debug(f"Cleaned JSON string: {cleaned}")

        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON after cleaning:\nRaw: {content}\nCleaned: {cleaned}\nError: {e}")
            raise HTTPException(status_code=500, detail="AI returned invalid JSON format")

        # Handle domain mismatch case
        if "error" in result and "domain" in result.get("error", "").lower():
            return {"error": "Goal does not match document domain"}

        # Validate required structure
        required = ["procedure", "approach", "steps"]
        if not all(k in result for k in required):
            logger.error(f"Missing keys in AI response: {result}")
            raise HTTPException(status_code=500, detail="Invalid response structure from AI")

        if not isinstance(result["steps"], list) or not (3 <= len(result["steps"]) <= 5):
            logger.error(f"Invalid steps format: {result['steps']}")
            raise HTTPException(status_code=500, detail="Steps must be a list of 3-5 items")

        logger.info("Goal specification successful")
        return result

    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to AI service")
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")