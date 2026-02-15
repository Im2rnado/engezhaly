"use client";

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function GlobalNotifications() {
    const [toasts, setToasts] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/components/GlobalNotifications.tsx:11', message: 'Initializing Socket for notifications', data: { hasToken: !!token }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '2' }) }).catch(() => { });
        // #endregion

        if (!token) return;

        const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
            extraHeaders: { 'x-auth-token': token }
        });

        socket.on('connect', () => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/components/GlobalNotifications.tsx:21', message: 'Socket connected', data: { socketId: socket.id }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '2' }) }).catch(() => { });
            // #endregion
        });

        socket.on('notification', (data: any) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/components/GlobalNotifications.tsx:27', message: 'Notification received', data: data, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '2' }) }).catch(() => { });
            // #endregion
            const id = Date.now();
            setToasts(prev => [...prev, { id, ...data }]);

            // Auto remove
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        });

        socket.on('connect_error', (err) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/components/GlobalNotifications.tsx:38', message: 'Socket connection error', data: { error: err.message }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '2' }) }).catch(() => { });
            // #endregion
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="bg-white border-l-4 border-[#09BF44] shadow-lg p-4 rounded-r-lg w-full md:w-80 animate-in slide-in-from-right duration-300 pointer-events-auto flex items-start gap-3">
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-sm">{toast.title}</h4>
                        <p className="text-gray-600 text-xs">{toast.message}</p>
                    </div>
                    <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
            ))}
        </div>
    );
}
