"use client";

import { useEffect, useRef } from 'react';

// Geidea Egypt JS SDK URL
const GEIDEA_SCRIPT_URL = 'https://www.merchant.geidea.net/hpp/geideaCheckout.min.js';

interface GeideaCheckoutProps {
    sessionId: string | null;
    onComplete: (success: boolean, data?: any) => void;
}

/**
 * GeideaCheckout — triggers the Geidea HPP payment overlay.
 * When `sessionId` is set, dynamically loads the Geidea JS SDK (if not already present)
 * and calls payment.startPayment(sessionId). Geidea renders its own modal overlay —
 * no iframe needed on our side.
 */
export default function GeideaCheckout({ sessionId, onComplete }: GeideaCheckoutProps) {
    const startedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        // Prevent double-firing if sessionId doesn't change
        if (startedRef.current === sessionId) return;
        startedRef.current = sessionId;

        const launch = () => {
            const onSuccess = (data: any) => {
                onComplete(true, { type: 'success', data });
            };
            const onError = (data: any) => {
                console.error('[Geidea] Payment error:', data);
                onComplete(false, { type: 'error', data });
            };
            const onCancel = (data: any) => {
                console.log('[Geidea] Payment cancelled:', data);
                onComplete(false, { type: 'cancel', data });
            };

            try {
                // @ts-expect-error — GeideaCheckout is loaded from external script
                const payment = new window.GeideaCheckout(onSuccess, onError, onCancel);
                payment.startPayment(sessionId);
            } catch (err) {
                console.error('[Geidea] Failed to start payment:', err);
                onComplete(false, { type: 'error', error: err });
            }
        };

        // Check if script is already loaded
        if (typeof window !== 'undefined' && (window as any).GeideaCheckout) {
            launch();
            return;
        }

        // Dynamically load Geidea SDK
        const existing = document.querySelector(`script[src="${GEIDEA_SCRIPT_URL}"]`);
        if (existing) {
            // Script tag exists but GeideaCheckout not yet ready — wait for load
            existing.addEventListener('load', launch);
            return;
        }

        const script = document.createElement('script');
        script.src = GEIDEA_SCRIPT_URL;
        script.async = true;
        script.onload = launch;
        script.onerror = () => {
            console.error('[Geidea] Failed to load GeideaCheckout script');
            onComplete(false, { type: 'error', error: 'Failed to load payment SDK' });
        };
        document.head.appendChild(script);
    }, [sessionId, onComplete]);

    // No visible UI — Geidea renders its own overlay
    return null;
}
