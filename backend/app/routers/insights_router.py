from fastapi import APIRouter, HTTPException
from app.models.models import InsightInput
from app.services.insights_generation import generate_insights_service

router = APIRouter(
    prefix="/generate-insights",
    tags=["Insights Generation"]
)


@router.post("/")
async def generate_insights(input: InsightInput):

    try:
        result = generate_insights_service(
            content=input.content,
            domain=input.domain,
            language=input.language
        )

        return result

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))