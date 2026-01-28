"""
Character extraction service using OpenAI API.
Extracts character information including names, roles, relationships, and first appearances.
"""
import os
import json
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict

# Load .env from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def extract_characters(pages: List[Dict]) -> List[Dict]:
    """
    Extract character information from the text.
    
    Args:
        pages: List of {"page_number": int, "text": str}
    
    Returns:
        List of character dictionaries with:
        - name: Character name
        - role: Brief description of their role
        - relationships: List of explicit relationships mentioned
        - first_appearance_page: Page number where first mentioned
    """
    if not pages:
        return []
    
    # Combine all text with page markers
    combined_text = ""
    for page in sorted(pages, key=lambda x: x["page_number"]):
        combined_text += f"\n[PAGE {page['page_number']}]\n{page['text']}\n"
    
    if not combined_text.strip():
        return []
    
    system_prompt = """You are analyzing a text to extract character information.

Rules:
1. Identify all named characters (people/beings with names)
2. For each character, determine:
   - name: Their full name as it appears
   - role: Brief description (e.g., "protagonist", "Harry's friend", "dark wizard")
   - relationships: ONLY explicit relationships stated in the text (e.g., "father of Harry", "friend of Ron")
   - first_appearance_page: The page number where they are first mentioned (look for [PAGE X] markers)
3. Do NOT infer relationships not explicitly stated
4. Do NOT include unnamed characters

Output ONLY valid JSON array, no markdown formatting:
[
  {
    "name": "Character Name",
    "role": "Brief role description",
    "relationships": ["explicit relationship 1", "explicit relationship 2"],
    "first_appearance_page": 1
  }
]"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract characters from this text:\n\n{combined_text}"}
            ],
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            data = json.loads(result)
            # Handle both direct array and object with characters key
            if isinstance(data, list):
                characters = data
            elif isinstance(data, dict) and "characters" in data:
                characters = data["characters"]
            else:
                characters = []
            
            return characters
            
        except json.JSONDecodeError:
            print(f"[Characters] Failed to parse JSON: {result}")
            return []
        
    except Exception as e:
        print(f"[Characters] Error: {e}")
        raise Exception(f"Character extraction failed: {str(e)}")
