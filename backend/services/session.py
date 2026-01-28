"""
Session management service with TTL-based auto-deletion.
All data is stored in-memory only - no persistence.
"""
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from dataclasses import dataclass, field
import os
from dotenv import load_dotenv

load_dotenv()

# Session TTL from environment (default 1 hour)
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", 3600))


@dataclass
class SessionData:
    """In-memory session data container"""
    session_id: str
    created_at: datetime
    last_accessed: datetime
    pages: List[Dict] = field(default_factory=list)  # [{page_number, text}]
    translations: Dict[int, str] = field(default_factory=dict)  # page_number -> telugu text
    summary_short: Optional[str] = None
    summary_medium: Optional[str] = None
    characters: Optional[List[Dict]] = None


class SessionManager:
    """
    Manages in-memory sessions with automatic TTL cleanup.
    No data is persisted to disk or database.
    """
    
    def __init__(self):
        self._sessions: Dict[str, SessionData] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
    
    def create_session(self) -> str:
        """Create a new session and return its ID"""
        session_id = str(uuid.uuid4())
        now = datetime.now()
        self._sessions[session_id] = SessionData(
            session_id=session_id,
            created_at=now,
            last_accessed=now
        )
        return session_id
    
    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Get session data, updating last accessed time"""
        session = self._sessions.get(session_id)
        if session:
            session.last_accessed = datetime.now()
        return session
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session and all its data"""
        if session_id in self._sessions:
            # Clear all data explicitly
            session = self._sessions[session_id]
            session.pages.clear()
            session.translations.clear()
            session.summary_short = None
            session.summary_medium = None
            session.characters = None
            del self._sessions[session_id]
            return True
        return False
    
    def session_exists(self, session_id: str) -> bool:
        """Check if session exists"""
        return session_id in self._sessions
    
    def add_page(self, session_id: str, page_number: int, text: str) -> bool:
        """Add extracted page text to session"""
        session = self.get_session(session_id)
        if session:
            session.pages.append({"page_number": page_number, "text": text})
            return True
        return False
    
    def get_pages(self, session_id: str) -> Optional[List[Dict]]:
        """Get all pages for a session"""
        session = self.get_session(session_id)
        return session.pages if session else None
    
    def add_translation(self, session_id: str, page_number: int, telugu_text: str) -> bool:
        """Store translation for a page"""
        session = self.get_session(session_id)
        if session:
            session.translations[page_number] = telugu_text
            return True
        return False
    
    def get_translation(self, session_id: str, page_number: int) -> Optional[str]:
        """Get cached translation for a page"""
        session = self.get_session(session_id)
        return session.translations.get(page_number) if session else None
    
    def _cleanup_expired_sessions(self):
        """Remove sessions that have exceeded TTL"""
        now = datetime.now()
        ttl = timedelta(seconds=SESSION_TTL_SECONDS)
        expired = [
            sid for sid, session in self._sessions.items()
            if now - session.last_accessed > ttl
        ]
        for sid in expired:
            self.delete_session(sid)
        return len(expired)
    
    async def start_cleanup_task(self):
        """Start background task to clean up expired sessions"""
        async def cleanup_loop():
            while True:
                await asyncio.sleep(300)  # Check every 5 minutes
                count = self._cleanup_expired_sessions()
                if count > 0:
                    print(f"[SessionManager] Cleaned up {count} expired session(s)")
        
        self._cleanup_task = asyncio.create_task(cleanup_loop())
    
    async def stop_cleanup_task(self):
        """Stop the cleanup background task"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass


# Global session manager instance
session_manager = SessionManager()
