'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
    onNextPage?: () => void;
    onPrevPage?: () => void;
    onTogglePlayPause?: () => void;
    onSkipForward?: () => void;
    onSkipBackward?: () => void;
    enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts in the reading companion
 * 
 * Shortcuts:
 * - Arrow Right / Arrow Down: Next page
 * - Arrow Left / Arrow Up: Previous page
 * - Space: Toggle play/pause audio
 * - ] : Skip forward 10s
 * - [ : Skip backward 10s
 */
export function useKeyboardShortcuts({
    onNextPage,
    onPrevPage,
    onTogglePlayPause,
    onSkipForward,
    onSkipBackward,
    enabled = true,
}: KeyboardShortcutsOptions) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ignore if user is typing in an input field
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                onSkipForward?.();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                onSkipBackward?.();
                break;
            case 'ArrowDown':
                event.preventDefault();
                onNextPage?.();
                break;
            case 'ArrowUp':
                event.preventDefault();
                onPrevPage?.();
                break;
            case ' ': // Space
                event.preventDefault();
                onTogglePlayPause?.();
                break;
        }
    }, [onNextPage, onPrevPage, onTogglePlayPause, onSkipForward, onSkipBackward]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, handleKeyDown]);
}
