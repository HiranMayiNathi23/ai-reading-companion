'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    uploadImages,
    getPages,
    deleteSession,
    PageText,
} from '@/lib/api';

/**
 * Custom hook for managing session state
 */
export function useSession() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [pages, setPages] = useState<PageText[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Upload images and create session
    const upload = useCallback(async (files: File[]) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await uploadImages(files);
            setSessionId(response.session_id);

            // Fetch the extracted pages
            const pagesResponse = await getPages(response.session_id);
            setPages(pagesResponse.pages);

            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Clear session
    const clearSession = useCallback(async () => {
        if (sessionId) {
            try {
                await deleteSession(sessionId);
            } catch {
                // Ignore errors on cleanup
            }
        }
        setSessionId(null);
        setPages([]);
        setError(null);
    }, [sessionId]);

    // Clean up session on unmount
    useEffect(() => {
        return () => {
            if (sessionId) {
                deleteSession(sessionId).catch(() => { });
            }
        };
    }, [sessionId]);

    return {
        sessionId,
        pages,
        isLoading,
        error,
        upload,
        clearSession,
    };
}
