"use client";

import { useEffect } from 'react';
import { cleanEndpoint, isApiRequest, REPORT_URL, reportClientError, setErrorReporterFetch } from '@/lib/errorReporter';

export default function ErrorReporter() {
  useEffect(() => {
    const nativeFetch = window.fetch.bind(window);
    setErrorReporterFetch(nativeFetch);

    const handleWindowError = (event: ErrorEvent) => {
      const isExternalDomMutation = event.error?.name === 'NotFoundError'
        && /(?:insertBefore|removeChild).*not (?:a child|a child of)/i.test(event.message || event.error?.message || '');
      reportClientError({
        source: 'frontend',
        severity: isExternalDomMutation ? 'warning' : 'error',
        name: event.error?.name || 'WindowError',
        message: event.message || event.error?.message || 'Unknown browser error',
        stack: event.error?.stack
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason?.name === 'AbortError') return;
      reportClientError({
        source: 'frontend',
        severity: 'error',
        name: reason?.name || 'UnhandledRejection',
        message: reason?.message || String(reason || 'Unhandled promise rejection'),
        stack: reason?.stack
      });
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const shouldMonitor = isApiRequest(input) && cleanEndpoint(input) !== cleanEndpoint(REPORT_URL);
      try {
        const response = await nativeFetch(input, init);
        if (shouldMonitor && response.status >= 500) {
          reportClientError({
            source: 'api',
            severity: response.status >= 503 ? 'critical' : 'error',
            name: 'ApiError',
            message: `API returned ${response.status}`,
            endpoint: cleanEndpoint(input),
            method: init?.method || (input instanceof Request ? input.method : 'GET'),
            statusCode: response.status
          });
        }
        return response;
      } catch (error: unknown) {
        const err = error as Error;
        if (shouldMonitor && err?.name !== 'AbortError') {
          reportClientError({
            source: 'api',
            // A rejected fetch means the browser could not establish/complete a
            // connection. It is not evidence that the API itself crashed.
            severity: 'warning',
            name: err?.name || 'NetworkError',
            message: err?.message || 'API request failed',
            stack: err?.stack,
            endpoint: cleanEndpoint(input),
            method: init?.method || (input instanceof Request ? input.method : 'GET')
          });
        }
        throw error;
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.fetch = nativeFetch;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
