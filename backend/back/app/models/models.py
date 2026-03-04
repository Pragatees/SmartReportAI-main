from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ==============================
# DOMAIN IDENTIFICATION
# ==============================

class TextInput(BaseModel):
    text: str


# ==============================
# INSIGHTS GENERATION
# ==============================

class InsightInput(BaseModel):
    content: str
    domain: str
    language: str = "English"


# ==============================
# RISK DETECTION
# ==============================

class RiskInput(BaseModel):
    content: str
    domain: str
    language: str = "English"


# ==============================
# SUGGESTIONS GENERATION
# ==============================

class RiskItem(BaseModel):
    risk_title: str
    risk_type: str
    severity: str
    description: str
    impact: str
    ipc_reference: Optional[str] = None
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)


class SuggestionInput(BaseModel):
    insights: List[Any]
    risks: Optional[List[RiskItem]] = None
    overall_risk_level: Optional[str] = None
    risk_summary: Optional[str] = None


# ==============================
# GOAL SPECIFICATION
# ==============================

class GoalInput(BaseModel):
    goal: str
    pdf_content: str


# ==============================
# VECTOR DATABASE
# ==============================

class VectorStoreInput(BaseModel):
    text: str
    domain_result: Dict[str, Any]
    insights_result: Dict[str, Any]
    suggestions: List[Any]
    risk_result: Optional[Dict[str, Any]] = None


class QueryInput(BaseModel):
    query: str
    k: int = 5