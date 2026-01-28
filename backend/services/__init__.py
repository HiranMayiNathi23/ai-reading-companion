"""
Services package initialization
"""
from .session import session_manager, SessionManager, SessionData
from .ocr import extract_text_from_image, validate_image
from .translation import translate_to_telugu
from .summary import generate_summary
from .characters import extract_characters
from .tts import generate_speech, get_audio_duration_estimate
from .text_correction import correct_ocr_text

__all__ = [
    "session_manager",
    "SessionManager", 
    "SessionData",
    "extract_text_from_image",
    "validate_image",
    "translate_to_telugu",
    "generate_summary",
    "extract_characters",
    "generate_speech",
    "get_audio_duration_estimate",
    "correct_ocr_text"
]
