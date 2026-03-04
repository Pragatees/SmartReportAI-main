from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from app.services.ocr_extraction import extract_text_from_file

router = APIRouter(
    prefix="/ocr",
    tags=["OCR"]
)


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        text = extract_text_from_file(contents, file.filename)

        return {
            "filename": file.filename,
            "text": text
        }

    except ValueError as ve:
        return JSONResponse(
            content={"error": str(ve)},
            status_code=400
        )

    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )
    
    