"""
Translation service using OpenAI API.
Translates English text to Telugu while preserving proper nouns.
"""
import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key or api_key == "your_openai_api_key_here":
    print("[Translation] WARNING: OPENAI_API_KEY not set in .env file")
client = OpenAI(api_key=api_key)


async def translate_to_telugu(english_text: str) -> str:
    """
    Translate English text to Telugu using OpenAI.
    Proper nouns (names, places) are preserved in English.
    
    Args:
        english_text: Source text in English
    
    Returns:
        Translated text in Telugu with proper nouns preserved
    """
    if not english_text.strip():
        return ""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a professional English to Telugu translator.
                    
Rules:
1. Translate the given English text to Telugu accurately
2. DO NOT translate proper nouns (names of people, places, brands, titles)
3. Keep proper nouns in their original English spelling
4. Maintain the meaning and tone of the original text
5. Use natural Telugu that flows well when read

Example:
English: "Harry Potter went to London to meet Hermione."
Telugu: "Harry Potter London కి Hermione ని కలవడానికి వెళ్ళాడు."

Only output the Telugu translation, nothing else."""
                },
                {
                    "role": "user",
                    "content": english_text
                }
            ],
            temperature=0.3,  # Lower temperature for more consistent translations
            max_tokens=4000
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"[Translation] Error: {e}")
        raise Exception(f"Translation failed: {str(e)}")
