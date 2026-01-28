"""
Summary generation service using OpenAI API.
Generates short (bullet points) or medium (paragraphs) summaries.
"""
import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from typing import Literal

# Load .env from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def generate_summary(
    text: str, 
    summary_type: Literal["short", "medium"]
) -> str:
    """
    Generate a summary of the given text.
    
    Args:
        text: Full text to summarize
        summary_type: "short" for 5-7 bullet points, "medium" for 2-3 paragraphs
    
    Returns:
        Formatted summary string
    """
    if not text.strip():
        return ""
    
    # Different prompts for different summary types
    if summary_type == "short":
        system_prompt = """You are a skilled summarizer. Create a concise summary.

Rules:
1. Provide exactly 5-7 bullet points
2. Each bullet should be one clear, complete sentence
3. Capture the main events and key information
4. Use "•" as the bullet character
5. Focus on what happens, not interpretation

Format:
• First key point
• Second key point
...
"""
    else:  # medium
        system_prompt = """You are a skilled summarizer. Create a medium-length summary.

Rules:
1. Write exactly 2-3 well-structured paragraphs
2. First paragraph: main events and plot
3. Second paragraph: key details and context
4. Third paragraph (if needed): themes or significance
5. Use clear, flowing prose
6. Be comprehensive but not verbose

Output only the paragraphs, no headers or labels."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Summarize the following text:\n\n{text}"}
            ],
            temperature=0.5,
            max_tokens=1000
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"[Summary] Error: {e}")
        raise Exception(f"Summary generation failed: {str(e)}")
