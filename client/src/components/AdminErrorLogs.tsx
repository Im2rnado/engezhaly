"use client";

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Eye, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { api } from '@/lib/api';

type ErrorStats = { total: number; unresolved: number; critical: number; last24Hours: number };

const badgeClass = (value: string) => {
  if (value === 'critical' || value === 'unresolved') return 'bg-red-100 text-red-700';
  if (value === 'resolved') return 'bg-green-100 text-green-700';
  if (value === 'ignored' || value === 'warning') return 'bg-yellow-100 text-yellow-700';
  return 'bg-blue-100 text-blue-700';
};

export default function AdminErrorLogs({ onStatsChange }: { onStatsChange?: (stats: ErrorStats) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<ErrorStats>({ total: 0, unresolved: 0, critical: 0, last24Hours: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('unresolved');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [result, nextStats] = await Promise.all([
        api.admin.getErrorLogs({ page, status, source, search }),
        api.admin.getErrorStats()
      ]);
      setLogs(result.logs || []);
      setPages(result.pages || 1);
      setStats(nextStats);
      onStatsChange?.(nextStats);
    } catch (error: any) {
      setLoadError(error?.message || 'Failed to load error logs');
    } finally {
      setLoading(false);
    }
  }, [page, status, source, search, onStatsChange]);

  useEffect(() => setPage(1), [status, source, search]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const changeStatus = async (log: any, nextStatus: 'unresolved' | 'resolved' | 'ignored') => {
    const updated = await api.admin.updateErrorStatus(log._id, nextStatus);
    setSelected(updated);
    await load();
  };

  const cards = [
    ['Total errors', stats.total, 'text-gray-900'],
    ['Unresolved', stats.unresolved, 'text-red-600'],
    ['Critical', stats.critical, 'text-orange-600'],
    ['Last 24 hours', stats.last24Hours, 'text-blue-600']
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {cards.map(([label, value, color]) => (
          <div key={String(label)} className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl sm:text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search error, page, or user" className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#09BF44]" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold bg-white">
            <option value="">All statuses</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold bg-white">
            <option value="">All sources</option>
            <option value="frontend">Browser</option>
            <option value="api">API</option>
            <option value="server">Server</option>
          </select>
          <button onClick={load} className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50" aria-label="Refresh error logs"><RefreshCw className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="p-14 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></div>
        ) : loadError ? (
          <div className="p-14 text-center text-red-600"><AlertTriangle className="w-10 h-10 mx-auto mb-3" /><p className="font-bold">{loadError}</p><button onClick={load} className="mt-4 rounded-xl border border-red-200 px-4 py-2 font-bold">Try again</button></div>
        ) : logs.length === 0 ? (
          <div className="p-14 text-center text-gray-500"><CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" /><p className="font-bold">No matching errors</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <button key={log._id} onClick={() => setSelected(log)} className="w-full p-4 sm:p-5 text-start hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${log.severity === 'critical' ? 'text-red-600' : 'text-orange-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black capitalize ${badgeClass(log.severity)}`}>{log.severity}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black capitalize ${badgeClass(log.status)}`}>{log.status}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase bg-gray-100 text-gray-600">{log.source}</span>
                      {log.count > 1 && <span className="text-xs font-bold text-gray-500">×{log.count}</span>}
                    </div>
                    <p className="mt-2 font-bold text-gray-900 break-words line-clamp-2">{log.message}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{log.userSnapshot?.name || 'Unauthenticated session'}{log.userSnapshot?.role ? ` · ${log.userSnapshot.role}` : ''}</span>
                      <span>{log.page || log.endpoint || 'Unknown page'}</span>
                      <span>{new Date(log.lastSeenAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
        {!loading && !loadError && pages > 1 && (
          <div className="border-t border-gray-100 p-4 flex items-center justify-between text-sm">
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:opacity-40">Previous</button>
            <span className="font-bold text-gray-500">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[70] bg-black/50 p-3 sm:p-6 flex items-center justify-center" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between z-10">
              <div><h3 className="text-xl font-black text-gray-900">Error details</h3><p className="text-xs text-gray-500 mt-1">ID: {selected._id}</p></div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4"><p className="font-bold text-red-800 break-words">{selected.message}</p></div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ['User', selected.userSnapshot?.name || 'Unauthenticated session'],
                  ['Email', selected.userSnapshot?.email || '-'],
                  ['Role', selected.userSnapshot?.role || '-'],
                  ['Time', new Date(selected.lastSeenAt).toLocaleString()],
                  ['First seen', new Date(selected.firstSeenAt).toLocaleString()],
                  ['Occurrences', selected.count || 1],
                  ['Page', selected.page || '-'],
                  ['Endpoint', selected.endpoint || '-'],
                  ['Request', [selected.method, selected.statusCode].filter(Boolean).join(' · ') || '-'],
                  ['Device', [selected.deviceType, selected.browser, selected.os].filter(Boolean).join(' · ')],
                  ['Viewport', selected.viewport?.width ? `${selected.viewport.width} × ${selected.viewport.height}` : '-'],
                  ['Session', selected.sessionId ? `${selected.sessionId.slice(0, 8)}…` : '-']
                ].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-gray-50 p-3 min-w-0"><p className="text-xs font-bold text-gray-400 uppercase">{label}</p><p className="mt-1 font-semibold text-gray-800 break-words">{value}</p></div>)}
              </div>
              {(selected.stack || selected.componentStack) && <div><p className="text-sm font-black mb-2">Technical stack</p><pre className="max-h-72 overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100 whitespace-pre-wrap break-words" dir="ltr">{selected.stack || selected.componentStack}</pre></div>}
              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => changeStatus(selected, 'resolved')} className="rounded-xl bg-[#09BF44] px-4 py-2.5 text-sm font-bold text-white">Mark resolved</button>
                <button onClick={() => changeStatus(selected, 'unresolved')} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold">Reopen</button>
                <button onClick={() => changeStatus(selected, 'ignored')} className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-bold text-yellow-800">Ignore</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
