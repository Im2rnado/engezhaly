const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.engezhaly.com/api';
const REPORT_URL = `${API_URL}/errors/report`;

export type ClientErrorReport = {
  source?: 'frontend' | 'api';
  severity?: 'warning' | 'error' | 'critical';
  name?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
};

let originalFetch: typeof window.fetch | null = null;
const recentReports = new Map<string, number>();

function getSessionId() {
  try {
    const key = 'engezhaly_error_session';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function setErrorReporterFetch(fetchFn: typeof window.fetch) {
  originalFetch = fetchFn;
}

export function reportClientError(report: ClientErrorReport) {
  if (typeof window === 'undefined' || !report.message) return;
  const key = [report.source, report.name, report.message, report.endpoint, report.statusCode].join('|');
  const lastSent = recentReports.get(key) || 0;
  if (Date.now() - lastSent < 10_000) return;
  recentReports.set(key, Date.now());

  const token = localStorage.getItem('token');
  const send = originalFetch || window.fetch.bind(window);
  void send(REPORT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-auth-token': token } : {})
    },
    body: JSON.stringify({
      ...report,
      page: `${window.location.pathname}${window.location.hash}`,
      sessionId: getSessionId(),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      language: document.documentElement.lang || navigator.language,
      online: navigator.onLine,
      release: process.env.NEXT_PUBLIC_APP_VERSION
    }),
    keepalive: true
  }).catch(() => {
    // Logging must never interfere with the visitor's experience.
  });
}

export function isApiRequest(input: RequestInfo | URL) {
  const value = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  try {
    const url = new URL(value, window.location.origin);
    const api = new URL(API_URL, window.location.origin);
    return url.origin === api.origin && url.pathname.startsWith(api.pathname.replace(/\/$/, ''));
  } catch {
    return false;
  }
}

export function cleanEndpoint(input: RequestInfo | URL) {
  const value = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  try {
    const url = new URL(value, window.location.origin);
    return url.pathname;
  } catch {
    return String(value).split('?')[0];
  }
}

export { REPORT_URL };
