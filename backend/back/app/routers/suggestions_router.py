from fastapi import APIRouter, HTTPException
from app.models.models import SuggestionInput
from app.services.suggestions_generation import generate_suggestions_service

router = APIRouter(
    prefix="/generate-suggestions",
    tags=["Suggestions Generation"]
)


@router.post("/")
async def generate_suggestions(input: SuggestionInput):

    try:
        suggestions = generate_suggestions_service(
            insights=input.insights,
            risks=input.risks,
            overall_risk_level=input.overall_risk_level,
            risk_summary=input.risk_summary
        )

        return {"suggestions": suggestions}

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    