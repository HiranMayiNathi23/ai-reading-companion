'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
    imageUrl: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

/**
 * Image cropper component for selecting region of interest before OCR
 */
export default function ImageCropper({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [mounted, setMounted] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Track mount state for portal (needed for SSR)
    useEffect(() => {
        setMounted(true);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Generate cropped image blob
    const getCroppedImage = useCallback(async () => {
        if (!completedCrop || !imgRef.current) {
            // If no crop selected, use full image
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            onCropComplete(blob);
            return;
        }

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate scale ratio between displayed and natural size
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Set canvas size to cropped area
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        // Draw cropped portion
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Convert to blob
        canvas.toBlob((blob) => {
            if (blob) {
                onCropComplete(blob);
            }
        }, 'image/jpeg', 0.95);
    }, [completedCrop, imageUrl, onCropComplete]);

    // Don't render until mounted (for SSR safety with portal)
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
            {/* Header - Fixed at top */}
            <div
                className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black border-b border-gray-700"
            >
                <h3 className="text-white font-semibold text-lg">
                    ✂️ Crop Image (Select text area)
                </h3>
                <p className="text-gray-400 text-sm hidden sm:block">
                    Drag to select the text area you want to extract
                </p>
            </div>

            {/* Crop area - Scrollable middle section */}
            <div
                className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-900"
                style={{ minHeight: 0 }}
            >
                <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                >
                    <img
                        ref={imgRef}
                        src={imageUrl}
                        alt="Crop preview"
                        style={{
                            maxHeight: 'calc(100vh - 160px)',
                            maxWidth: '95vw',
                            objectFit: 'contain',
                            display: 'block'
                        }}
                    />
                </ReactCrop>
            </div>

            {/* Footer Action Bar - Fixed at bottom */}
            <div
                className="flex-shrink-0 flex items-center justify-center gap-4 px-4 py-4 bg-black border-t border-gray-700"
            >
                <button
                    onClick={onCancel}
                    className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors text-base font-medium shadow-lg"
                >
                    ✕ Cancel
                </button>
                <button
                    onClick={getCroppedImage}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors text-base font-bold shadow-lg shadow-emerald-500/30"
                >
                    ✓ {completedCrop ? 'Use Selection' : 'Use Full Image'}
                </button>
            </div>
        </div>
    );

    // Use portal to render at document.body level, escaping all parent constraints
    return createPortal(modalContent, document.body);
}
