'use client';

import { useState, useRef, useCallback } from 'react';
import CameraCapture from './CameraCapture';

interface ImageUploaderProps {
    onUpload: (files: File[]) => Promise<void>;
    maxFiles?: number;
    isDisabled?: boolean;
}

/**
 * Image uploader component with file upload and camera capture
 */
export default function ImageUploader({
    onUpload,
    maxFiles = 15,
    isDisabled = false,
}: ImageUploaderProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Allowed file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    // Handle file selection - directly add to queue
    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        setError(null);

        const file = files[0];

        // Validate file type
        if (!allowedTypes.includes(file.type)) {
            setError(`${file.name} is not a valid image type. Use JPG, PNG, WebP, or GIF.`);
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError(`${file.name} is too large. Maximum size is 10MB.`);
            return;
        }

        // Check if we have room
        if (selectedFiles.length >= maxFiles) {
            setError(`Maximum ${maxFiles} images allowed.`);
            return;
        }

        // Add file directly to the queue
        const preview = URL.createObjectURL(file);
        setSelectedFiles(prev => [...prev, file]);
        setPreviews(prev => [...prev, preview]);
    }, [allowedTypes, maxFiles, selectedFiles.length]);

    // Remove a file from selection
    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Clear all files
    const clearAll = () => {
        previews.forEach(url => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviews([]);
        setError(null);
    };

    // Handle upload
    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        setError(null);

        try {
            await onUpload(selectedFiles);
            clearAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    // Open file dialog
    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    // Open camera
    const openCamera = () => {
        if (selectedFiles.length >= maxFiles) {
            setError(`Maximum ${maxFiles} images allowed.`);
            return;
        }
        setShowCamera(true);
    };

    // Handle camera capture
    const handleCameraCapture = useCallback((file: File) => {
        const preview = URL.createObjectURL(file);
        setSelectedFiles(prev => [...prev, file]);
        setPreviews(prev => [...prev, preview]);
        setShowCamera(false);
    }, []);

    return (
        <div className="space-y-6">

            {/* Upload buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Upload from device button */}
                <button
                    onClick={openFileDialog}
                    disabled={isDisabled || isUploading || selectedFiles.length >= maxFiles}
                    className={`
                        flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg
                        transition-all duration-300 shadow-lg
                        ${isDisabled || isUploading || selectedFiles.length >= maxFiles
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:-translate-y-1'
                        }
                    `}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Image
                </button>

                {/* Camera capture button (for mobile) */}
                <button
                    onClick={openCamera}
                    disabled={isDisabled || isUploading || selectedFiles.length >= maxFiles}
                    className={`
                        flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg
                        transition-all duration-300 shadow-lg
                        ${isDisabled || isUploading || selectedFiles.length >= maxFiles
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:-translate-y-1'
                        }
                    `}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    📷 Take Photo
                </button>
            </div>

            {/* Camera Capture Modal */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                    handleFileSelect(e.target.files);
                    e.target.value = ''; // Reset to allow same file
                }}
                className="hidden"
            />

            {/* Info text */}
            <p className="text-center text-gray-400 text-sm">
                Upload up to {maxFiles} book page images · Max 10MB each
            </p>

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                    <p className="text-red-300 text-center">{error}</p>
                </div>
            )}

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold">
                            Selected: {selectedFiles.length} / {maxFiles} pages
                        </h3>
                        <button
                            onClick={clearAll}
                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Preview grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative group aspect-[3/4]">
                                <img
                                    src={preview}
                                    alt={`Page ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg border-2 border-white/20"
                                />
                                <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                                    {index + 1}
                                </span>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Upload/Process button */}
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || isDisabled}
                        className={`
                            w-full py-4 rounded-xl font-bold text-lg
                            transition-all duration-300
                            ${isUploading || isDisabled
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl'
                            }
                        `}
                    >
                        {isUploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            `Process ${selectedFiles.length} Page${selectedFiles.length !== 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
