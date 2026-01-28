"""
Text correction service using OpenAI API.
Fixes common OCR errors and typos in extracted text.
"""
import os
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def is_text_severely_garbled(text: str) -> bool:
    """
    Detect if OCR text is severely garbled and likely unreadable.
    
    Signs of severe garbling:
    - Very high ratio of non-word characters
    - Very short average word length
    - Many words that don't look like English
    """
    if not text or len(text.strip()) < 50:
        return False
    
    words = text.split()
    if len(words) < 5:
        return False
    
    # Check average word length (English avg is ~4.5 chars)
    avg_word_len = sum(len(w) for w in words) / len(words)
    if avg_word_len < 2.5:
        return True
    
    # Check ratio of non-alphabetic characters
    alpha_chars = sum(1 for c in text if c.isalpha())
    total_chars = len(text.replace(' ', ''))
    if total_chars > 0 and alpha_chars / total_chars < 0.6:
        return True
    
    # Check for many single-character "words"
    single_char_words = sum(1 for w in words if len(w) == 1 and w.lower() not in ['a', 'i'])
    if single_char_words / len(words) > 0.3:
        return True
    
    return False


async def correct_ocr_text(ocr_text: str) -> str:
    """
    Correct OCR errors in the extracted text using AI.
    
    Fixes common OCR mistakes like:
    - Character substitutions (beart -> heart, \\ollows -> follows)
    - Number/letter confusion (1 -> I, 0 -> O)
    - Missing or extra spaces
    - Garbled words
    
    Args:
        ocr_text: Raw OCR-extracted text with potential errors
    
    Returns:
        Corrected text with OCR errors fixed
    """
    if not ocr_text or not ocr_text.strip():
        return ocr_text
    
    # Skip if text is too short
    if len(ocr_text.strip()) < 20:
        return ocr_text
    
    # Check if text is severely garbled
    severely_garbled = is_text_severely_garbled(ocr_text)
    
    try:
        if severely_garbled:
            # Use more aggressive reconstruction for severely garbled text
            system_prompt = """You are an OCR error correction specialist dealing with SEVERELY GARBLED text from a poor quality image.

The text is badly corrupted - many characters are wrong, words are broken, and some parts may be unreadable.

Your task:
1. Try to reconstruct readable English text from the garbled input
2. Look for patterns and context clues to guess what words should be
3. If a section is completely unreadable, mark it as [unclear]
4. Keep the general structure (paragraphs, line breaks)
5. Output ONLY the reconstructed text, nothing else

Be aggressive in fixing errors - the original is definitely wrong."""
        else:
            # Standard correction for minor errors
            system_prompt = """You are an OCR error correction specialist. Fix common OCR errors in the text while preserving the original meaning and structure.

Common OCR errors to fix:
- Character substitutions: beart→heart, \\ollows→follows, rn→m, cl→d, etc.
- Number/letter confusion: 1→I (when it should be "I"), 0→O, 5→S
- Broken words: re ligion→religion, asso ciation→association
- Missing spaces between sentences
- Random symbols that don't make sense in context

Rules:
1. ONLY fix obvious OCR errors - don't rewrite or paraphrase
2. Keep the exact same structure, paragraphs, and line breaks
3. Preserve proper nouns and names as-is
4. If unsure, keep the original
5. Output ONLY the corrected text, nothing else"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Fix OCR errors in this text:\n\n{ocr_text}"
                }
            ],
            temperature=0.2 if severely_garbled else 0.1,
            max_tokens=4000
        )
        
        corrected = response.choices[0].message.content.strip()
        return corrected if corrected else ocr_text
        
    except Exception as e:
        print(f"[TextCorrection] Error: {e}")
        # Return original text if correction fails
        return ocr_text

