from fastapi import APIRouter, HTTPException
from app.models.models import VectorStoreInput, QueryInput
from app.services.vector_database import (
    store_vector_service,
    query_vector_service,
    clear_vector_db_service
)

router = APIRouter(tags=["Vector Database"])


@router.post("/store-vector")
async def store_vector(input: VectorStoreInput):

    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    total = store_vector_service(
        input.text,
        input.domain_result,
        input.insights_result,
        input.suggestions,
        input.risk_result
    )

    return {
        "message": "Vector stored successfully",
        "total_vectors": total
    }


@router.post("/query-vector")
async def query_vector(input: QueryInput):

    if not input.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    response, total = query_vector_service(input.query, input.k)

    return {
        "response": response,
        "total_vectors": total
    }


@router.delete("/clear-vector-db")
async def clear_vector_db():

    clear_vector_db_service()

    return {"message": "Vector database cleared"}