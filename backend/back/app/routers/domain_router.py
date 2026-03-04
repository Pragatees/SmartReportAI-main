from fastapi import APIRouter, HTTPException
from app.models.models import TextInput
from app.services.domain_identification import identify_domain_service

router = APIRouter(
    prefix="/identify-domain",
    tags=["Domain Identification"]
)


@router.post("/")
async def identify_domain(input: TextInput):

    try:
        result = identify_domain_service(input.text)
        return result

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))