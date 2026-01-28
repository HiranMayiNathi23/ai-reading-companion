'use client';

import { useState, useCallback } from 'react';
import { translatePage, TranslateResponse } from '@/lib/api';

interface TranslationPanelProps {
    sessionId: string;
    currentPage: number;
}

/**
 * Panel for displaying Telugu translation of the current page
 */
export default function TranslationPanel({
    sessionId,
    currentPage,
}: TranslationPanelProps) {
    const [translation, setTranslation] = useState<TranslateResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    // Translate current page
    const handleTranslate = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await translatePage(sessionId, currentPage);
            setTranslation(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Translation failed');
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, currentPage]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
                <h2 className="text-xl font-bold text-white">🔤 Telugu Translation</h2>
                <svg
                    className={`w-5 h-5 text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="p-6">
                    {/* Translate button */}
                    {!translation || translation.page_number !== currentPage ? (
                        <div className="text-center">
                            <button
                                onClick={handleTranslate}
                                disabled={isLoading}
                                className={`
                  px-6 py-3 rounded-xl font-semibold text-white
                  transition-all duration-300
                  ${isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                                    }
                `}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Translating...
                                    </span>
                                ) : (
                                    `Translate Page ${currentPage} to Telugu`
                                )}
                            </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Proper nouns will be preserved in English
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Translation result - scrollable */}
                            <div className="max-h-[300px] overflow-y-auto prose prose-lg dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 leading-relaxed text-lg" style={{ fontFamily: 'Noto Sans Telugu, sans-serif' }}>
                                    {translation.telugu_text}
                                </p>
                            </div>

                            {/* Translate different page button */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={handleTranslate}
                                    disabled={isLoading}
                                    className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                                >
                                    ↻ Re-translate page {currentPage}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
