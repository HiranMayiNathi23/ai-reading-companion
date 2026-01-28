'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PageText } from '@/lib/api';

interface ReaderViewProps {
    pages: PageText[];
    currentPage: number;
    onPageChange: (page: number) => void;
    fontSize?: number;
    onIncreaseFontSize?: () => void;
    onDecreaseFontSize?: () => void;
    canIncrease?: boolean;
    canDecrease?: boolean;
}

/**
 * Reader view component displaying extracted English text
 * with font size controls and scroll progress bar
 */
export default function ReaderView({
    pages,
    currentPage,
    onPageChange,
    fontSize = 18,
    onIncreaseFontSize,
    onDecreaseFontSize,
    canIncrease = true,
    canDecrease = true,
}: ReaderViewProps) {
    const page = pages.find(p => p.page_number === currentPage);
    const totalPages = pages.length;
    const contentRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    const goToPrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const goToNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Handle scroll to update progress
    const handleScroll = useCallback(() => {
        if (!contentRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const maxScroll = scrollHeight - clientHeight;
        if (maxScroll > 0) {
            setScrollProgress((scrollTop / maxScroll) * 100);
        } else {
            setScrollProgress(100);
        }
    }, []);

    // Reset scroll when page changes
    useEffect(() => {
        setScrollProgress(0);
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [currentPage]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header with page navigation and font controls */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                <h2 className="text-xl font-bold text-white">📖 English Text</h2>

                <div className="flex items-center gap-3">
                    {/* Font size controls */}
                    <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
                        <button
                            onClick={onDecreaseFontSize}
                            disabled={!canDecrease}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${canDecrease
                                    ? 'text-white hover:bg-white/20'
                                    : 'text-white/40 cursor-not-allowed'
                                }`}
                            aria-label="Decrease font size"
                            title="Zoom out"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                        </button>
                        <span className="text-white text-xs font-medium px-1">{fontSize}px</span>
                        <button
                            onClick={onIncreaseFontSize}
                            disabled={!canIncrease}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${canIncrease
                                    ? 'text-white hover:bg-white/20'
                                    : 'text-white/40 cursor-not-allowed'
                                }`}
                            aria-label="Increase font size"
                            title="Zoom in"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    {/* Page navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPrevious}
                            disabled={currentPage <= 1}
                            className={`p-2 rounded-lg transition-all ${currentPage <= 1
                                    ? 'text-white/40 cursor-not-allowed'
                                    : 'text-white hover:bg-white/20'
                                }`}
                            aria-label="Previous page"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <span className="text-white font-medium px-3 py-1 bg-white/20 rounded-full text-sm">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={goToNext}
                            disabled={currentPage >= totalPages}
                            className={`p-2 rounded-lg transition-all ${currentPage >= totalPages
                                    ? 'text-white/40 cursor-not-allowed'
                                    : 'text-white hover:bg-white/20'
                                }`}
                            aria-label="Next page"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scroll progress bar */}
            <div className="h-1 bg-gray-200 dark:bg-gray-700">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Page content */}
            <div
                ref={contentRef}
                onScroll={handleScroll}
                className="p-6 max-h-[500px] overflow-y-auto"
            >
                {page ? (
                    <div className="max-w-none">
                        <p
                            className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 leading-relaxed"
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
                        >
                            {page.text}
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>Page not found</p>
                    </div>
                )}
            </div>

            {/* Page thumbnails */}
            {totalPages > 1 && (
                <div className="px-6 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {pages.map((p) => (
                            <button
                                key={p.page_number}
                                onClick={() => onPageChange(p.page_number)}
                                className={`flex-shrink-0 w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200 ${p.page_number === currentPage
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                                    }`}
                            >
                                {p.page_number}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

