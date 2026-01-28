'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { getTTSAudio } from '@/lib/api';

interface AudioPlayerProps {
    sessionId: string;
    currentPage: number;
    pageText?: string;
    onProgressUpdate?: (progress: number, duration: number) => void;
}

// Expose these methods to parent components
export interface AudioPlayerRef {
    togglePlayPause: () => void;
    skipForward: () => void;
    skipBackward: () => void;
    isPlaying: boolean;
}

/**
 * Audio player for English TTS
 * NO download functionality - audio is only playable inline
 * Includes forward/backward skip and progress updates for text highlighting
 */
const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(function AudioPlayer({
    sessionId,
    currentPage,
    pageText,
    onProgressUpdate,
}, ref) {
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const loadedPageRef = useRef<number | null>(null);

    // Skip duration in seconds
    const SKIP_DURATION = 10;

    // Clean up audio URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    // Generate audio for current page
    const loadAudio = useCallback(async () => {
        if (loadedPageRef.current === currentPage && audioUrl) {
            // Audio already loaded for this page
            return;
        }

        setIsLoading(true);
        setError(null);

        // Clean up previous audio
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setProgress(0);

        try {
            const blob = await getTTSAudio(sessionId, currentPage);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            loadedPageRef.current = currentPage;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate audio');
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, currentPage, audioUrl]);

    // Toggle play/pause
    const togglePlayPause = useCallback(async () => {
        if (!audioUrl) {
            await loadAudio();
            return;
        }

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    }, [audioUrl, isPlaying, loadAudio]);

    // Stop audio
    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setProgress(0);
        onProgressUpdate?.(0, duration);
    }, [duration, onProgressUpdate]);

    // Skip backward
    const skipBackward = useCallback(() => {
        if (audioRef.current) {
            const newTime = Math.max(0, audioRef.current.currentTime - SKIP_DURATION);
            audioRef.current.currentTime = newTime;
            setProgress(newTime);
            onProgressUpdate?.(newTime, duration);
        }
    }, [duration, onProgressUpdate]);

    // Skip forward
    const skipForward = useCallback(() => {
        if (audioRef.current && duration > 0) {
            const newTime = Math.min(duration, audioRef.current.currentTime + SKIP_DURATION);
            audioRef.current.currentTime = newTime;
            setProgress(newTime);
            onProgressUpdate?.(newTime, duration);
        }
    }, [duration, onProgressUpdate]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        togglePlayPause,
        skipForward,
        skipBackward,
        isPlaying,
    }), [togglePlayPause, skipForward, skipBackward, isPlaying]);

    // Handle audio events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        onProgressUpdate?.(0, duration);
    };
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const currentProgress = audioRef.current.currentTime;
            setProgress(currentProgress);
            onProgressUpdate?.(currentProgress, duration);
        }
    };
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            // Auto-play when loaded
            audioRef.current.play();
        }
    };

    // Format time as mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Seek to position
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current && duration > 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            audioRef.current.currentTime = percentage * duration;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500">
                <h2 className="text-xl font-bold text-white">🔊 English Audio</h2>
            </div>

            {/* Player controls */}
            <div className="p-6">
                {/* Hidden audio element - NO controls attribute to prevent download */}
                {audioUrl && (
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onEnded={handleEnded}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        // Prevent right-click context menu (download prevention)
                        onContextMenu={(e) => e.preventDefault()}
                    />
                )}

                {/* Custom player UI */}
                <div className="flex items-center gap-3">
                    {/* Skip backward button */}
                    <button
                        onClick={skipBackward}
                        disabled={!audioUrl || isLoading}
                        className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-300
              ${!audioUrl || isLoading
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }
            `}
                        title="Skip back 10s"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                            <text x="9" y="15" fontSize="7" fontWeight="bold">10</text>
                        </svg>
                    </button>

                    {/* Play/Pause button */}
                    <button
                        onClick={togglePlayPause}
                        disabled={isLoading}
                        className={`
              w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-300
              ${isLoading
                                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl'
                            }
            `}
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : isPlaying ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Skip forward button */}
                    <button
                        onClick={skipForward}
                        disabled={!audioUrl || isLoading}
                        className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-300
              ${!audioUrl || isLoading
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }
            `}
                        title="Skip forward 10s"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                            <text x="9" y="15" fontSize="7" fontWeight="bold">10</text>
                        </svg>
                    </button>

                    {/* Stop button */}
                    <button
                        onClick={stopAudio}
                        disabled={!audioUrl || isLoading}
                        className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-300
              ${!audioUrl || isLoading
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }
            `}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 6h12v12H6z" />
                        </svg>
                    </button>

                    {/* Progress bar and time */}
                    <div className="flex-1">
                        <div
                            onClick={handleSeek}
                            className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer overflow-hidden"
                        >
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-100"
                                style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }}
                            />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatTime(progress)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>

                {/* Generate button if no audio */}
                {!audioUrl && !isLoading && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={loadAudio}
                            className="px-6 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                            Generate Audio for Page {currentPage}
                        </button>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Privacy notice */}
                <p className="mt-4 text-xs text-gray-400 text-center">
                    🔒 Audio is generated locally and not stored. Playback only, no download.
                </p>
            </div>
        </div>
    );
});

export default AudioPlayer;
