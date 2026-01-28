'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

/**
 * Camera capture component using WebRTC to access device camera
 */
export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Initialize camera on mount
    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsReady(true);
                }
            } catch (err) {
                console.error('Camera access error:', err);
                setError('Could not access camera. Please ensure camera permissions are granted.');
            }
        };

        startCamera();

        return () => {
            document.body.style.overflow = '';
            // Stop all tracks when component unmounts
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Capture photo from video stream
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !isReady) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                // Stop camera before closing
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                onCapture(file);
            }
        }, 'image/jpeg', 0.92);
    }, [isReady, onCapture]);

    // Handle close - stop camera
    const handleClose = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        onClose();
    }, [onClose]);

    if (!mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 bg-black flex flex-col"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                height: '100vh',
                width: '100vw',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black border-b border-gray-700">
                <h3 className="text-white font-semibold text-lg">
                    📷 Take Photo
                </h3>
                <p className="text-gray-400 text-sm hidden sm:block">
                    Position the book page in frame and capture
                </p>
            </div>

            {/* Camera view - Full screen */}
            <div
                className="flex-1 flex items-center justify-center bg-gray-900 overflow-hidden"
                style={{ minHeight: 0 }}
            >
                {error ? (
                    <div className="text-center p-8">
                        <p className="text-red-400 text-lg mb-4">{error}</p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: '#111'
                        }}
                    />
                )}
            </div>

            {/* Footer with capture button */}
            {!error && (
                <div className="flex-shrink-0 flex items-center justify-center gap-4 px-4 py-4 bg-black border-t border-gray-700">
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors text-base font-medium shadow-lg"
                    >
                        ✕ Cancel
                    </button>
                    <button
                        onClick={capturePhoto}
                        disabled={!isReady}
                        className={`px-8 py-3 rounded-xl text-base font-bold shadow-lg transition-colors ${isReady
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/30'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        📸 {isReady ? 'Capture' : 'Loading...'}
                    </button>
                </div>
            )}
        </div>
    );

    return createPortal(modalContent, document.body);
}
