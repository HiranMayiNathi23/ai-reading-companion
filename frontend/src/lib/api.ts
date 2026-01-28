/**
 * API client for communicating with the backend
 */

const API_BASE = 'http://localhost:8000';

/**
 * Types for API responses
 */
export interface PageText {
  page_number: number;
  text: string;
}

export interface UploadResponse {
  session_id: string;
  page_count: number;
  message: string;
}

export interface PagesResponse {
  session_id: string;
  pages: PageText[];
}

export interface TranslateResponse {
  page_number: number;
  english_text: string;
  telugu_text: string;
}

export type Language = 'english' | 'telugu';

export interface SummaryResponse {
  summary_type: 'short' | 'medium';
  summary: string;
  language: Language;
}

export interface Character {
  name: string;
  role: string;
  relationships: string[];
  first_appearance_page: number;
}

export interface CharactersResponse {
  characters: Character[];
  language: Language;
}

/**
 * Upload book page images for OCR processing
 */
export async function uploadImages(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE}/upload-images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

/**
 * Get extracted text for all pages in a session
 */
export async function getPages(sessionId: string): Promise<PagesResponse> {
  const response = await fetch(`${API_BASE}/pages/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get pages');
  }

  return response.json();
}

/**
 * Translate a page to Telugu
 */
export async function translatePage(
  sessionId: string,
  pageNumber: number
): Promise<TranslateResponse> {
  const response = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      page_number: pageNumber,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Translation failed');
  }

  return response.json();
}

/**
 * Get summary of all text
 */
export async function getSummary(
  sessionId: string,
  summaryType: 'short' | 'medium',
  language: Language = 'english'
): Promise<SummaryResponse> {
  const response = await fetch(`${API_BASE}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      summary_type: summaryType,
      language: language,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Summary generation failed');
  }

  return response.json();
}

/**
 * Get character information
 */
export async function getCharacters(
  sessionId: string,
  language: Language = 'english'
): Promise<CharactersResponse> {
  const response = await fetch(`${API_BASE}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      language: language,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Character extraction failed');
  }

  return response.json();
}

/**
 * Get TTS audio URL for a page (streamed, not downloadable)
 */
export function getTTSUrl(sessionId: string, pageNumber: number): string {
  return `${API_BASE}/tts/english?session_id=${sessionId}&page_number=${pageNumber}`;
}

/**
 * Request TTS audio (returns audio blob)
 */
export async function getTTSAudio(
  sessionId: string,
  pageNumber: number
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/tts/english`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      page_number: pageNumber,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'TTS generation failed');
  }

  return response.blob();
}

/**
 * Delete session and all data
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete session');
  }
}
