'use client';

import { useState, useCallback } from 'react';
import { getCharacters, Character, Language } from '@/lib/api';

interface CharacterTableProps {
    sessionId: string;
}

/**
 * Character reference table showing extracted character information
 * With language toggle for English/Telugu
 */
export default function CharacterTable({ sessionId }: CharacterTableProps) {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [language, setLanguage] = useState<Language>('english');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasLoaded, setHasLoaded] = useState(false);

    // Extract characters
    const handleExtractCharacters = useCallback(async (lang: Language) => {
        setIsLoading(true);
        setError(null);
        setLanguage(lang);

        try {
            const result = await getCharacters(sessionId, lang);
            setCharacters(result.characters);
            setHasLoaded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Character extraction failed');
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    // Filter characters by search
    const filteredCharacters = characters.filter(char =>
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 transition-colors"
            >
                <h2 className="text-xl font-bold text-white">👥 Characters</h2>
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
                            onClick={() => {
                                setLanguage('english');
                                if (hasLoaded) handleExtractCharacters('english');
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${language === 'english'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => {
                                setLanguage('telugu');
                                if (hasLoaded) handleExtractCharacters('telugu');
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${language === 'telugu'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                                }`}
                        >
                            తెలుగు
                        </button>
                    </div>

                    {/* Extract button (if not loaded) */}
                    {!hasLoaded && !isLoading && (
                        <div className="text-center">
                            <button
                                onClick={() => handleExtractCharacters(language)}
                                className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Extract Characters from All Pages
                            </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Identifies names, roles, and explicit relationships
                            </p>
                        </div>
                    )}

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="ml-3 text-gray-500">Extracting characters...</span>
                        </div>
                    )}

                    {/* Character table */}
                    {hasLoaded && !isLoading && characters.length > 0 && (
                        <div>
                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search characters..."
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Table - scrollable */}
                            <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {language === 'telugu' ? 'పాత్ర' : 'Role'}
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {language === 'telugu' ? 'సంబంధాలు' : 'Relationships'}
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {language === 'telugu' ? 'పేజీ' : 'First Seen'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredCharacters.map((char, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                                        {char.name}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-gray-600 dark:text-gray-400 ${language === 'telugu' ? 'telugu-text' : ''}`}>
                                                    {char.role}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {char.relationships.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {char.relationships.map((rel, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`inline-block px-2 py-1 text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full ${language === 'telugu' ? 'telugu-text' : ''}`}
                                                                >
                                                                    {rel}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-block px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                                                        {language === 'telugu' ? `పేజీ ${char.first_appearance_page}` : `Page ${char.first_appearance_page}`}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* No matches */}
                            {filteredCharacters.length === 0 && searchQuery && (
                                <p className="text-center py-4 text-gray-500">
                                    No characters matching &quot;{searchQuery}&quot;
                                </p>
                            )}

                            {/* Refresh button */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => handleExtractCharacters(language)}
                                    disabled={isLoading}
                                    className="text-rose-600 hover:text-rose-700 font-medium text-sm"
                                >
                                    ↻ Re-extract characters
                                </button>
                            </div>
                        </div>
                    )}

                    {/* No characters found */}
                    {hasLoaded && !isLoading && characters.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No named characters found in the text.</p>
                            <button
                                onClick={() => handleExtractCharacters(language)}
                                className="mt-2 text-rose-600 hover:text-rose-700 font-medium text-sm"
                            >
                                Try again
                            </button>
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
