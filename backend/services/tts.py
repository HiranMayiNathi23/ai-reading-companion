"""
Text-to-Speech service using gTTS (Google Text-to-Speech).
Generates English audio - audio is streamed, not saved permanently.
"""
import io
from gtts import gTTS
from typing import Optional


def generate_speech(text: str) -> Optional[bytes]:
    """
    Generate English speech audio from text using Google TTS.
    
    Args:
        text: English text to convert to speech
    
    Returns:
        MP3 audio bytes, or None if generation fails
    
    Note:
        Audio is generated in-memory and not saved to disk.
    """
    if not text.strip():
        return None
    
    try:
        # Clean text for TTS (remove excessive whitespace)
        cleaned_text = " ".join(text.split())
        
        # Limit text length to prevent timeout
        if len(cleaned_text) > 5000:
            cleaned_text = cleaned_text[:5000] + "..."
        
        # Generate speech using gTTS
        tts = gTTS(text=cleaned_text, lang='en', slow=False)
        
        # Save to bytes buffer (in-memory)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return audio_buffer.read()
                
    except Exception as e:
        print(f"[TTS] Error: {e}")
        return None


def get_audio_duration_estimate(text: str) -> float:
    """
    Estimate audio duration based on text length.
    Average speaking rate is ~150 words per minute.
    
    Args:
        text: Input text
    
    Returns:
        Estimated duration in seconds
    """
    words = len(text.split())
    return (words / 150) * 60  # Convert to seconds
