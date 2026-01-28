'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ReaderPreferences {
    fontSize: number;
    theme: Theme;
}

const DEFAULT_PREFERENCES: ReaderPreferences = {
    fontSize: 18,
    theme: 'dark',
};

const STORAGE_KEY = 'reader-preferences';
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;
const FONT_SIZE_STEP = 2;

/**
 * Hook to manage reader preferences with localStorage persistence
 */
export function useReaderPreferences() {
    const [fontSize, setFontSize] = useState(DEFAULT_PREFERENCES.fontSize);
    const [theme, setTheme] = useState<Theme>(DEFAULT_PREFERENCES.theme);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load preferences from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const prefs = JSON.parse(stored) as Partial<ReaderPreferences>;
                if (prefs.fontSize && prefs.fontSize >= MIN_FONT_SIZE && prefs.fontSize <= MAX_FONT_SIZE) {
                    setFontSize(prefs.fontSize);
                }
                if (prefs.theme && (prefs.theme === 'light' || prefs.theme === 'dark')) {
                    setTheme(prefs.theme);
                }
            }
        } catch (e) {
            console.warn('Failed to load reader preferences:', e);
        }
        setIsLoaded(true);
    }, []);

    // Save preferences to localStorage whenever they change
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize, theme }));
        } catch (e) {
            console.warn('Failed to save reader preferences:', e);
        }
    }, [fontSize, theme, isLoaded]);

    // Apply theme to document
    useEffect(() => {
        if (!isLoaded) return;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme, isLoaded]);

    const increaseFontSize = useCallback(() => {
        setFontSize(prev => Math.min(MAX_FONT_SIZE, prev + FONT_SIZE_STEP));
    }, []);

    const decreaseFontSize = useCallback(() => {
        setFontSize(prev => Math.max(MIN_FONT_SIZE, prev - FONT_SIZE_STEP));
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    return {
        fontSize,
        theme,
        increaseFontSize,
        decreaseFontSize,
        toggleTheme,
        canIncrease: fontSize < MAX_FONT_SIZE,
        canDecrease: fontSize > MIN_FONT_SIZE,
        isLoaded,
    };
}
