'use client';

import { useState, useCallback } from 'react';
import { getSummary, SummaryResponse, Language } from '@/lib/api';

interface SummaryPanelProps {
    sessionId: string;
}

/**
 * Panel for displaying text summaries (short or medium format)
 * With language toggle for English/Telugu
 */
export default function SummaryPanel({ sessionId }: SummaryPanelProps) {
    const [summaryType, setSummaryType] = useState<'short' | 'medium'>('short');
    const [language, setLanguage] = useState<Language>('english');
    const [summary, setSummary] = useState<SummaryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    // Generate summary
    const handleGenerateSummary = useCallback(async (type: 'short' | 'medium', lang: Language) => {
        setIsLoading(true);
        setError(null);
        setSummaryType(type);
        setLanguage(lang);

        try {
            const result = await getSummary(sessionId, type, lang);
            setSummary(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Summary generation failed');
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 transition-colors"
            >
                <h2 className="text-xl font-bold text-white">📝 Summary</h2>
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
                    {/* Language toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setLanguage('english')}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${language === 'english'
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setLanguage('telugu')}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${language === 'telugu'
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                                }`}
                        >
                            తెలుగు
                        </button>
                    </div>

                    {/* Summary type toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => handleGenerateSummary('short', language)}
                            disabled={isLoading}
                            className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-all
                ${summaryType === 'short' && summary
                                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                        >
                            📌 Short (5-7 bullet points)
                        </button>
                        <button
                            onClick={() => handleGenerateSummary('medium', language)}
                            disabled={isLoading}
                            className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-all
                ${summaryType === 'medium' && summary
                                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                        >
                            📄 Medium (2-3 paragraphs)
                        </button>
                    </div>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <svg className="animate-spin h-8 w-8 text-violet-500" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="ml-3 text-gray-500">Generating summary...</span>
                        </div>
                    )}

                    {/* Summary content - scrollable */}
                    {!isLoading && summary && (
                        <div className={`max-h-[300px] overflow-y-auto prose prose-lg dark:prose-invert max-w-none ${summary.language === 'telugu' ? 'telugu-text' : ''}`}>
                            {summary.summary_type === 'short' ? (
                                <div className="space-y-2">
                                    {summary.summary.split('\n').filter(line => line.trim()).map((line, index) => (
                                        <div key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
                                            <span className="text-violet-500 mt-1">•</span>
                                            <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4 text-gray-700 dark:text-gray-200 leading-relaxed">
                                    {summary.summary.split('\n\n').map((para, index) => (
                                        <p key={index}>{para}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Initial state - prompt to generate */}
                    {!isLoading && !summary && !error && (
                        <div className="text-center py-8 text-gray-500">
                            <p>Click a button above to generate a summary of all pages</p>
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
