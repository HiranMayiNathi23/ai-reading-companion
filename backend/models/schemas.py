"""
Pydantic models for API request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class SummaryType(str, Enum):
    """Summary format options"""
    SHORT = "short"    # 5-7 bullet points
    MEDIUM = "medium"  # 2-3 paragraphs


class Language(str, Enum):
    """Language options for output"""
    ENGLISH = "english"
    TELUGU = "telugu"


class PageText(BaseModel):
    """Extracted text for a single page"""
    page_number: int
    text: str


class UploadResponse(BaseModel):
    """Response after uploading images"""
    session_id: str
    page_count: int
    message: str


class PagesResponse(BaseModel):
    """Response with all extracted page texts"""
    session_id: str
    pages: List[PageText]


class TranslateRequest(BaseModel):
    """Request to translate text to Telugu"""
    session_id: str
    page_number: int


class TranslateResponse(BaseModel):
    """Response with translated Telugu text"""
    page_number: int
    english_text: str
    telugu_text: str


class SummaryRequest(BaseModel):
    """Request for text summary"""
    session_id: str
    summary_type: SummaryType = SummaryType.SHORT
    language: Language = Language.ENGLISH


class SummaryResponse(BaseModel):
    """Response with summary"""
    summary_type: SummaryType
    summary: str
    language: Language = Language.ENGLISH


class Character(BaseModel):
    """Character information extracted from text"""
    name: str
    role: str
    relationships: List[str] = Field(default_factory=list, description="Explicit relationships only")
    first_appearance_page: int


class CharactersRequest(BaseModel):
    """Request to extract characters"""
    session_id: str
    language: Language = Language.ENGLISH


class CharactersResponse(BaseModel):
    """Response with character table"""
    characters: List[Character]
    language: Language = Language.ENGLISH


class TTSRequest(BaseModel):
    """Request for text-to-speech"""
    session_id: str
    page_number: int


class DeleteSessionResponse(BaseModel):
    """Response after deleting a session"""
    message: str
    session_id: str


class ErrorResponse(BaseModel):
    """Error response format"""
    error: str
    detail: Optional[str] = None
