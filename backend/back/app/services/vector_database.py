import json
import logging
import os
import pickle
import numpy as np
import faiss
from threading import Lock
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, Any, List
from sentence_transformers import SentenceTransformer
from groq import Groq
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# ==============================
# LOAD ENV
# ==============================

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found")

client = Groq(api_key=GROQ_API_KEY)
MODEL_NAME = "llama-3.1-8b-instant"

# ==============================
# DATA PATHS
# ==============================

DATA_DIR = "data"
VECTOR_DB_PATH = os.path.join(DATA_DIR, "vector_db.pkl")
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "faiss_index.bin")

os.makedirs(DATA_DIR, exist_ok=True)

vector_db_lock = Lock()

# ==============================
# CHAT MEMORY
# ==============================

chat_history: List[Dict[str, str]] = []
MAX_HISTORY = 6


# ==============================
# VECTOR DATABASE CLASS
# ==============================

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

    def add_vectors(self, texts_with_metadata):

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

        _, indices = self.index.search(query_embedding, actual_k)

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
# GROQ WITH MEMORY
# ==============================

def call_groq_with_memory(prompt: str):

    try:

        messages = []

        for msg in chat_history:

            content = msg["content"]

            if not isinstance(content, str):
                content = json.dumps(content)

            messages.append({
                "role": msg["role"],
                "content": content
            })

        messages.append({
            "role": "user",
            "content": prompt
        })

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        raw_text = completion.choices[0].message.content.strip()

        return json.loads(raw_text)

    except Exception as e:
        logger.error(f"Groq error: {str(e)}")
        raise HTTPException(status_code=502, detail=str(e))


# ==============================
# SERVICE FUNCTIONS
# ==============================

def store_vector_service(text, domain, insights, suggestions, risks):

    with vector_db_lock:

        metadata = {
            "content": text,
            "domain": domain,
            "insights": insights,
            "suggestions": suggestions,
            "risks": risks
        }

        vector_db.add_vectors([(text, metadata)])

        return vector_db.index.ntotal


def query_vector_service(query, k):

    with vector_db_lock:

        query_result = vector_db.query_vectors(query, k)

        context_parts = []

        for item in query_result["results"]:

            context_parts.append(f"Content: {item.get('content','')}")

            if item.get("domain"):
                context_parts.append(json.dumps(item["domain"]))

            if item.get("insights"):
                context_parts.append(json.dumps(item["insights"]))

            if item.get("suggestions"):
                context_parts.append(json.dumps(item["suggestions"]))

            if item.get("risks"):
                context_parts.append(json.dumps(item["risks"]))

        context_text = "\n".join(context_parts)

        prompt = f"""
Return strictly JSON:

{{
 "response": "Answer"
}}

Query:
{query}

Context:
{context_text}
"""

        result = call_groq_with_memory(prompt)

        response = result.get("response")

        if not isinstance(response, str):
            response = json.dumps(response)

        chat_history.append({"role": "user", "content": query})
        chat_history.append({"role": "assistant", "content": response})

        if len(chat_history) > MAX_HISTORY * 2:
            chat_history[:] = chat_history[-MAX_HISTORY * 2:]

        return response, query_result["total_vectors"]


def clear_vector_db_service():

    with vector_db_lock:

        vector_db.index = faiss.IndexFlatL2(vector_db.dimension)
        vector_db.stored_data = []

        if os.path.exists(FAISS_INDEX_PATH):
            os.remove(FAISS_INDEX_PATH)

        if os.path.exists(VECTOR_DB_PATH):
            os.remove(VECTOR_DB_PATH)

    chat_history.clear()

    return True