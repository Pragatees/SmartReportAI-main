import json
import logging
import os
import pickle
import numpy as np
import faiss
from threading import Lock
from fastapi import APIRouter, HTTPException
from sentence_transformers import SentenceTransformer
from models import VectorStoreInput, QueryInput
from typing import Dict, Any, List
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# ==============================
# LOAD ENV
# ==============================

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Vector Database"])

# ==============================
# GEMINI CONFIG
# ==============================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

# ==============================
# IN-MEMORY CHAT HISTORY
# ==============================

chat_history = []  # stored only in RAM
MAX_HISTORY = 6     # keep last 6 exchanges

# ==============================
# VECTOR DATABASE SETUP
# ==============================

vector_db_lock = Lock()
DATA_DIR = "data"
VECTOR_DB_PATH = os.path.join(DATA_DIR, "vector_db.pkl")
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "faiss_index.bin")
os.makedirs(DATA_DIR, exist_ok=True)


class VectorDatabase:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index = faiss.IndexFlatL2(dimension)
        self.stored_data = []
        self.load_database()

    def save_database(self):
        faiss.write_index(self.index, FAISS_INDEX_PATH)
        with open(VECTOR_DB_PATH, "wb") as f:
            pickle.dump(self.stored_data, f)

    def load_database(self):
        if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(VECTOR_DB_PATH):
            self.index = faiss.read_index(FAISS_INDEX_PATH)
            with open(VECTOR_DB_PATH, "rb") as f:
                self.stored_data = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.stored_data = []

    def add_vectors(self, texts_with_metadata: List[tuple]) -> bool:
        texts = [text for text, _ in texts_with_metadata]
        embeddings = self.model.encode(texts)
        embeddings = np.array(embeddings).astype("float32")

        self.index.add(embeddings)

        for _, metadata in texts_with_metadata:
            self.stored_data.append(metadata)

        self.save_database()
        return True

    def query_vectors(self, query_text: str, k: int = 5):
        if self.index.ntotal == 0:
            return {"results": [], "total_vectors": 0}

        query_embedding = self.model.encode([query_text]).astype("float32")
        actual_k = min(k, self.index.ntotal)
        distances, indices = self.index.search(query_embedding, actual_k)

        results = []
        for idx in indices[0]:
            if 0 <= idx < len(self.stored_data):
                results.append(self.stored_data[idx])

        return {
            "results": results,
            "total_vectors": self.index.ntotal
        }


vector_db = VectorDatabase()

# ==============================
# GEMINI CALL WITH MEMORY
# ==============================

def call_gemini_with_memory(prompt: str) -> Dict[str, Any]:
    try:
        chat = model.start_chat(history=chat_history.copy())
        response = chat.send_message(prompt)

        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Empty Gemini response")

        raw_text = response.text.strip()

        try:
            return json.loads(raw_text)
        except:
            start = raw_text.find("{")
            end = raw_text.rfind("}") + 1
            return json.loads(raw_text[start:end])

    except Exception as e:
        logger.error(f"Gemini error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini call failed: {str(e)}")


# ==============================
# QUERY VECTOR WITH CHAT MEMORY
# ==============================

@router.post("/query-vector")
async def query_vector_db(input: QueryInput):
    if not input.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    with vector_db_lock:

        query_result = vector_db.query_vectors(input.query, k=input.k)

        context_text = "\n".join(
            str(item.get("content", ""))
            for item in query_result["results"]
        )

        prompt = f"""
You are a helpful AI assistant.

Use:
1. Previous conversation history
2. Retrieved context

Answer clearly and concisely.

Return strictly JSON:

{{
  "response": "Answer here"
}}

Query:
{input.query}

Retrieved Context:
{context_text}
"""

        gemini_result = call_gemini_with_memory(prompt)

        if "response" not in gemini_result:
            raise HTTPException(status_code=500, detail="Invalid Gemini response")

        final_response = gemini_result["response"]

        # ==============================
        # UPDATE CHAT HISTORY (RAM ONLY)
        # ==============================

        chat_history.append({
            "role": "user",
            "parts": [input.query]
        })

        chat_history.append({
            "role": "model",
            "parts": [final_response]
        })

        # Keep only last N exchanges
        if len(chat_history) > MAX_HISTORY * 2:
            del chat_history[:2]

        return {
            "response": final_response,
            "chat_memory_length": len(chat_history) // 2,
            "total_vectors": query_result["total_vectors"]
        }


# ==============================
# CLEAR VECTOR DB
# ==============================

@router.delete("/clear-vector-db")
async def clear_vector_db():
    with vector_db_lock:
        vector_db.index = faiss.IndexFlatL2(vector_db.dimension)
        vector_db.stored_data = []

        if os.path.exists(FAISS_INDEX_PATH):
            os.remove(FAISS_INDEX_PATH)
        if os.path.exists(VECTOR_DB_PATH):
            os.remove(VECTOR_DB_PATH)

        return {"message": "Vector database cleared"}