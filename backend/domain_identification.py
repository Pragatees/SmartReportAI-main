# domain_identification.py

import json
import logging
import re
import requests
from fastapi import APIRouter, HTTPException
from models import TextInput

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/identify-domain", tags=["Domain Identification"])

# Your actual Perplexity API key (keep it safe!)
PERPLEXITY_API_KEY = "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"
HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json"
}
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"


def clean_json_response(content: str) -> str:
    """
    Robustly extract JSON from Perplexity's sonar-pro response.
    Handles <think> reasoning tags, markdown code blocks, extra text, etc.
    Based on Perplexity's recommended parser for thinking models.
    """
    if not content:
        return "{}"

    text = content.strip()

    # Remove <think> reasoning sections (sonar-pro specific)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)

    # Remove common markdown code fences: ```json
    text = re.sub(r"^```[a-z]*\n|```$", "", text, flags=re.MULTILINE)

    # Strip any leading/trailing non-JSON text
    text = re.sub(r'^.*?(?=\{)', '', text)  # Remove text before first {
    text = re.sub(r'(?<=\}).*?$', '', text)  # Remove text after last }

    # Find the first { and last } to extract the main JSON object
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        text = text[start:end]

    return text.strip()


@router.post("/")
async def identify_domain(input: TextInput):
    if not input.text or not input.text.strip():
        logger.warning("Empty text received")
        raise HTTPException(status_code=400, detail="Text input cannot be empty")

    # System message for structure + user prompt
    system_prompt = """
You are an expert domain classifier. Respond with pure JSON only—no explanations, no markdown, no <think> tags, no code blocks.
Classify into exactly one domain: Healthcare, Finance, Education, Legal, Resume/Career, Technology, Government, General Knowledge, Others.
If it contains resume elements (education, skills, projects, internships, certifications), use "Resume/Career".
Confidence: 0.00-1.00. Reason: 1-2 sentences.
"""

    user_prompt = f"""
Text to classify:
{input.text[:10000]}
"""

    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.0,
        "max_tokens": 300
        # No response_format—unsupported on sonar-pro, causes 400
    }

    try:
        response = requests.post(PERPLEXITY_API_URL, headers=HEADERS, json=payload, timeout=30)
        
        # Log full response body on errors for debugging
        if response.status_code >= 400:
            error_body = response.text
            logger.error(f"Perplexity API {response.status_code} error. Body: {error_body}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Perplexity API error ({response.status_code}): {error_body[:500]}..."  # Truncate for logs
            )
        
        response.raise_for_status()
        data = response.json()

        logger.debug(f"Perplexity raw response: {data}")

        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not content:
            raise HTTPException(status_code=500, detail="Empty response from Perplexity API")

        # Clean and parse JSON safely
        cleaned_json_str = clean_json_response(content)
        logger.debug(f"Cleaned JSON string: {cleaned_json_str}")
        
        try:
            result = json.loads(cleaned_json_str)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed:\nRaw: {content}\nCleaned: {cleaned_json_str}\nError: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse model response as JSON")

        # Validate required fields
        required_keys = {"domain", "confidence", "reason"}
        if not all(key in result for key in required_keys):
            logger.error(f"Missing keys in result: {result}")
            raise HTTPException(status_code=500, detail="Invalid response format: missing domain, confidence, or reason")

        # Optional: Validate domain
        allowed_domains = {
            "Healthcare", "Finance", "Education", "Legal",
            "Resume/Career", "Technology", "Government",
            "General Knowledge", "Others"
        }
        if result["domain"] not in allowed_domains:
            logger.warning(f"Unexpected domain: {result['domain']}")

        logger.info(f"Domain identified: {result['domain']} (confidence: {result['confidence']})")
        return result

    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to reach Perplexity API")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during domain identification")