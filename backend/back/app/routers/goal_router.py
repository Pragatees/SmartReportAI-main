from fastapi import APIRouter, HTTPException
from app.models.models import GoalInput
from app.services.specify_goal import specify_goal_service

router = APIRouter(
    prefix="/specify-goal",
    tags=["Goal Specification"]
)


@router.post("/")
async def specify_goal(input: GoalInput):

    try:
        result = specify_goal_service(
            goal=input.goal,
            pdf_content=input.pdf_content
        )

        return result

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))