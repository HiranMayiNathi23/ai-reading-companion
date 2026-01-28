'use client';

import { useState, useRef, useCallback } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ReaderView from '@/components/ReaderView';
import TranslationPanel from '@/components/TranslationPanel';
import AudioPlayer, { AudioPlayerRef } from '@/components/AudioPlayer';
import SummaryPanel from '@/components/SummaryPanel';
import CharacterTable from '@/components/CharacterTable';
import { useSession } from '@/hooks/useSession';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useReaderPreferences } from '@/hooks/useReaderPreferences';

/**
 * Personal AI Reading Companion - Main Page
 * 
 * A private, in-session reading assistant for uploaded book page images.
 * All data is temporary and auto-deleted after 1 hour.
 */
export default function Home() {
  const { sessionId, pages, isLoading, error, upload, clearSession } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  // Reader preferences (font size)
  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    canIncrease,
    canDecrease,
  } = useReaderPreferences();

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    await upload(files);
    setCurrentPage(1);
  };

  // Handle new session (clear and start over)
  const handleNewSession = async () => {
    await clearSession();
    setCurrentPage(1);
  };

  // Page navigation callbacks
  const goToNextPage = useCallback(() => {
    if (currentPage < pages.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pages.length]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Audio control callbacks
  const togglePlayPause = useCallback(() => {
    audioPlayerRef.current?.togglePlayPause();
  }, []);

  const skipForward = useCallback(() => {
    audioPlayerRef.current?.skipForward();
  }, []);

  const skipBackward = useCallback(() => {
    audioPlayerRef.current?.skipBackward();
  }, []);

  // Enable keyboard shortcuts when session is active
  useKeyboardShortcuts({
    onNextPage: goToNextPage,
    onPrevPage: goToPrevPage,
    onTogglePlayPause: togglePlayPause,
    onSkipForward: skipForward,
    onSkipBackward: skipBackward,
    enabled: !!sessionId && pages.length > 0,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            📚 Personal AI Reading Companion
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Upload book pages to extract text, translate to Telugu, listen to audio,
            and explore summaries & characters.
          </p>

          {/* Privacy badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-300">
              Private session · Auto-deletes in 1 hour · No data stored
            </span>
          </div>

          {/* Keyboard shortcuts hint (shown when session active) */}
          {sessionId && pages.length > 0 && (
            <div className="mt-4 text-xs text-gray-400">
              ⌨️ Shortcuts: <span className="bg-gray-700 px-1.5 py-0.5 rounded">←</span> <span className="bg-gray-700 px-1.5 py-0.5 rounded">→</span> Skip 10s · <span className="bg-gray-700 px-1.5 py-0.5 rounded">↑</span> <span className="bg-gray-700 px-1.5 py-0.5 rounded">↓</span> Navigate pages · <span className="bg-gray-700 px-1.5 py-0.5 rounded">Space</span> Play/Pause
            </div>
          )}
        </header>

        {/* Upload Section (shown when no session) */}
        {!sessionId && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <ImageUploader
              onUpload={handleUpload}
              maxFiles={15}
              isDisabled={isLoading}
            />

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                <p className="text-red-300">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Reader Section (shown when session active) */}
        {sessionId && pages.length > 0 && (
          <div className="space-y-6">
            {/* Session controls */}
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl rounded-xl px-6 py-4 border border-white/20">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white font-medium">
                  Session active · {pages.length} page{pages.length !== 1 ? 's' : ''} loaded
                </span>
              </div>
              <button
                onClick={handleNewSession}
                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg font-medium hover:bg-red-500/30 transition-colors border border-red-500/50"
              >
                End Session & Start New
              </button>
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left column: Reader + Audio */}
              <div className="space-y-6">
                <ReaderView
                  pages={pages}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  fontSize={fontSize}
                  onIncreaseFontSize={increaseFontSize}
                  onDecreaseFontSize={decreaseFontSize}
                  canIncrease={canIncrease}
                  canDecrease={canDecrease}
                />
                <AudioPlayer
                  ref={audioPlayerRef}
                  sessionId={sessionId}
                  currentPage={currentPage}
                />
              </div>

              {/* Right column: Translation + Summary + Characters */}
              <div className="space-y-6">
                <TranslationPanel
                  sessionId={sessionId}
                  currentPage={currentPage}
                />
                <SummaryPanel sessionId={sessionId} />
                <CharacterTable sessionId={sessionId} />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>
            🔒 Your privacy is protected. All data is processed in-session only and
            automatically deleted after 1 hour.
          </p>
          <p className="mt-2">
            No images, text, or audio are permanently stored. No sharing or downloads allowed.
          </p>
        </footer>
      </div>
    </main>
  );
}

