from fastapi import APIRouter, HTTPException
from app.models.models import RiskInput
from app.services.risk_detection import detect_risk_service

router = APIRouter(
    prefix="/detect-risk",
    tags=["Risk Detection"]
)


@router.post("/")
async def detect_risk(input: RiskInput):

    try:
        result = detect_risk_service(
            content=input.content,
            domain=input.domain,
            language=input.language
        )

        return result

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))