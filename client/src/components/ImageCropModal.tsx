"use client";

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, Loader2 } from 'lucide-react';

interface ImageCropModalProps {
    src: string; // data URL or object URL of the selected image
    onConfirm: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    );
}

export default function ImageCropModal({ src, onConfirm, onCancel }: ImageCropModalProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [processing, setProcessing] = useState(false);

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height));
    }, []);

    const handleConfirm = async () => {
        if (!completedCrop || !imgRef.current) return;
        setProcessing(true);
        try {
            const canvas = document.createElement('canvas');
            const image = imgRef.current;
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            const outputSize = 400; // final circle size in px

            canvas.width = outputSize;
            canvas.height = outputSize;
            const ctx = canvas.getContext('2d')!;

            // Circular clip
            ctx.beginPath();
            ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
            ctx.clip();

            ctx.drawImage(
                image,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                outputSize,
                outputSize
            );

            canvas.toBlob((blob) => {
                if (blob) onConfirm(blob);
                setProcessing(false);
            }, 'image/jpeg', 0.9);
        } catch {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-lg">Crop Profile Photo</h3>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[300px]">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop
                        keepSelection
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={src}
                            alt="Crop preview"
                            onLoad={onImageLoad}
                            style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }}
                        />
                    </ReactCrop>
                </div>
                <div className="flex gap-3 p-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={processing || !completedCrop}
                        className="flex-1 bg-[#09BF44] text-white font-bold py-3 rounded-xl hover:bg-[#07a63a] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Use This Photo
                    </button>
                </div>
            </div>
        </div>
    );
}
