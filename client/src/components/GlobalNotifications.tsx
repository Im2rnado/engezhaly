"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

export default function GlobalNotifications() {
    const [toasts, setToasts] = useState<any[]>([]);
    const router = useRouter();
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
            auth: { token },
            extraHeaders: token ? { 'x-auth-token': token } : {}
        });

        socket.on('notification', (data: any) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, ...data }]);

            // Play notification sound (browsers may require user interaction first)
            if (typeof window !== 'undefined') {
                try {
                    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
                    const audioContext = AudioCtx ? new AudioCtx() : null;
                    if (audioContext) {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    }
                } catch (_) {}
            }

            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleToastClick = (toast: any) => {
        if (toast.link) {
            router.push(toast.link);
        }
        setToasts(prev => prev.filter(t => t.id !== toast.id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToastClick(toast)}
                    onKeyDown={(e) => e.key === 'Enter' && handleToastClick(toast)}
                    className="bg-white border-l-4 border-[#09BF44] shadow-lg p-4 rounded-r-lg w-full sm:w-80 max-w-sm animate-in slide-in-from-right duration-300 pointer-events-auto flex items-start gap-3 cursor-pointer hover:shadow-xl transition-shadow"
                >
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm">{toast.title}</h4>
                        <p className="text-gray-600 text-xs truncate">{toast.message}</p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setToasts(prev => prev.filter(t => t.id !== toast.id)); }}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                        aria-label="Dismiss"
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
}
