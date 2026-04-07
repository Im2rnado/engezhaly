"use client";

import { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
    src?: string | null;
    name?: string | null;
    size?: number; // px
    className?: string;
    /** Extra classes for the fallback div */
    fallbackClassName?: string;
}

function getInitials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
}

export default function Avatar({ src, name, size = 40, className = '', fallbackClassName = '' }: AvatarProps) {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;

    return (
        <div
            className={`relative rounded-full overflow-hidden bg-gray-200 shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            {showImage ? (
                <Image
                    src={src}
                    alt={name || 'Avatar'}
                    width={size}
                    height={size}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setImgError(true)}
                    unoptimized
                />
            ) : (
                <div className={`w-full h-full rounded-full bg-gradient-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black select-none ${fallbackClassName}`}
                    style={{ fontSize: Math.max(10, size * 0.35) }}
                >
                    {getInitials(name)}
                </div>
            )}
        </div>
    );
}
