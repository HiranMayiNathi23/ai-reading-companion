"""
Personal AI Reading Companion - FastAPI Backend

A private, in-session reading assistant for user-uploaded book page images.
All data is temporary and auto-deleted after 1 hour.

PRIVACY GUARANTEES:
- No permanent storage of images or text
- No database persistence
- Auto-delete after session TTL (1 hour)
- No sharing or export functionality
"""

from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io

from models import (
    UploadResponse, PagesResponse, PageText,
    TranslateRequest, TranslateResponse,
    SummaryRequest, SummaryResponse,
    CharactersRequest, CharactersResponse, Character,
    TTSRequest,
    DeleteSessionResponse, ErrorResponse
)
from services import (
    session_manager,
    extract_text_from_image, validate_image,
    translate_to_telugu,
    generate_summary,
    extract_characters,
    generate_speech,
    correct_ocr_text
)

# Maximum pages per session
MAX_PAGES = 15


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - start/stop background tasks"""
    # Startup: begin session cleanup task
    await session_manager.start_cleanup_task()
    print("[Server] Started session cleanup background task")
    yield
    # Shutdown: stop cleanup task
    await session_manager.stop_cleanup_task()
    print("[Server] Stopped session cleanup background task")


# Create FastAPI app
app = FastAPI(
    title="Personal AI Reading Companion",
    description="Private reading assistant with OCR, translation, TTS, and summarization",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.post("/upload-images", response_model=UploadResponse)
async def upload_images(files: List[UploadFile] = File(...)):
    """
    Upload book page images for OCR processing.
    
    - Maximum 15 images per session
    - Supported formats: JPG, PNG
    - Images are processed in-memory and not saved
    - Returns session_id for subsequent requests
    """
    # Validate file count
    if len(files) > MAX_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_PAGES} pages allowed per session"
        )
    
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    # Create new session
    session_id = session_manager.create_session()
    
    # Process each image
    for idx, file in enumerate(files, start=1):
        # Read file into memory
        image_bytes = await file.read()
        
        # Validate image
        is_valid, error_msg = validate_image(image_bytes)
        if not is_valid:
            # Clean up session on error
            session_manager.delete_session(session_id)
            raise HTTPException(status_code=400, detail=f"File {file.filename}: {error_msg}")
        
        # Extract text using OCR
        text = extract_text_from_image(image_bytes)
        if text is None:
            text = "[Unable to extract text from this page]"
        else:
            # Apply AI-powered text correction to fix OCR errors
            text = await correct_ocr_text(text)
        
        # Store in session (in-memory only)
        session_manager.add_page(session_id, idx, text)
        
        # Clear image from memory
        del image_bytes
    
    return UploadResponse(
        session_id=session_id,
        page_count=len(files),
        message=f"Successfully processed {len(files)} page(s)"
    )


@app.get("/pages/{session_id}", response_model=PagesResponse)
async def get_pages(session_id: str):
    """
    Get extracted text for all pages in a session.
    """
    pages = session_manager.get_pages(session_id)
    
    if pages is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    return PagesResponse(
        session_id=session_id,
        pages=[PageText(page_number=p["page_number"], text=p["text"]) for p in pages]
    )


@app.post("/translate", response_model=TranslateResponse)
async def translate_page(request: TranslateRequest):
    """
    Translate a page's text from English to Telugu.
    Proper nouns are preserved in English.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Check for cached translation
    cached = session_manager.get_translation(request.session_id, request.page_number)
    if cached:
        # Find English text
        for page in session.pages:
            if page["page_number"] == request.page_number:
                return TranslateResponse(
                    page_number=request.page_number,
                    english_text=page["text"],
                    telugu_text=cached
                )
    
    # Find the page
    english_text = None
    for page in session.pages:
        if page["page_number"] == request.page_number:
            english_text = page["text"]
            break
    
    if english_text is None:
        raise HTTPException(status_code=404, detail=f"Page {request.page_number} not found")
    
    # Translate
    try:
        telugu_text = await translate_to_telugu(english_text)
        
        # Cache the translation
        session_manager.add_translation(request.session_id, request.page_number, telugu_text)
        
        return TranslateResponse(
            page_number=request.page_number,
            english_text=english_text,
            telugu_text=telugu_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summary", response_model=SummaryResponse)
async def get_summary(request: SummaryRequest):
    """
    Generate a summary of all extracted text.
    
    - short: 5-7 bullet points
    - medium: 2-3 paragraphs
    - language: english or telugu
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Combine all page text
    full_text = "\n\n".join(p["text"] for p in session.pages)
    
    if not full_text.strip():
        raise HTTPException(status_code=400, detail="No text available for summarization")
    
    try:
        # Generate English summary first
        summary = await generate_summary(full_text, request.summary_type.value)
        
        # Translate to Telugu if requested
        if request.language.value == "telugu":
            summary = await translate_to_telugu(summary)
        
        return SummaryResponse(
            summary_type=request.summary_type, 
            summary=summary,
            language=request.language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/characters", response_model=CharactersResponse)
async def get_characters(request: CharactersRequest):
    """
    Extract character information from the text.
    
    Returns a table with:
    - Character name (always in English)
    - Role
    - Explicit relationships only
    - First appearance page number
    - language: english or telugu (role/relationships translated)
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    try:
        # Always extract in English first
        characters = await extract_characters(session.pages)
        
        # Translate role and relationships if Telugu requested
        if request.language.value == "telugu":
            translated_characters = []
            for char in characters:
                # Translate role
                translated_role = await translate_to_telugu(char["role"])
                # Translate relationships
                translated_rels = []
                for rel in char.get("relationships", []):
                    translated_rel = await translate_to_telugu(rel)
                    translated_rels.append(translated_rel)
                translated_characters.append({
                    "name": char["name"],  # Keep name in English
                    "role": translated_role,
                    "relationships": translated_rels,
                    "first_appearance_page": char["first_appearance_page"]
                })
            characters = translated_characters
        
        return CharactersResponse(
            characters=[Character(**c) for c in characters],
            language=request.language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tts/english")
async def text_to_speech(request: TTSRequest):
    """
    Generate English audio for a page using Piper TTS.
    
    Audio is streamed directly - no download option.
    Audio is generated locally, not stored.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Find the page text
    text = None
    for page in session.pages:
        if page["page_number"] == request.page_number:
            text = page["text"]
            break
    
    if text is None:
        raise HTTPException(status_code=404, detail=f"Page {request.page_number} not found")
    
    # Generate speech
    audio_bytes = generate_speech(text)
    
    if audio_bytes is None:
        raise HTTPException(status_code=500, detail="Failed to generate audio")
    
    # Stream the audio (no Content-Disposition to prevent download)
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={
            # Explicitly NOT setting Content-Disposition to prevent download
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache"
        }
    )


@app.delete("/session/{session_id}", response_model=DeleteSessionResponse)
async def delete_session(session_id: str):
    """
    Immediately delete a session and all its data.
    """
    if session_manager.delete_session(session_id):
        return DeleteSessionResponse(
            message="Session deleted successfully",
            session_id=session_id
        )
    else:
        raise HTTPException(status_code=404, detail="Session not found")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "AI Reading Companion"}


# Entry point for development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
