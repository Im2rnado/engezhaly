/** Formats status values: in_progress → "IN PROGRESS" */
export const formatStatus = (s: string) => (s || '').replace(/_/g, ' ').toUpperCase();

/** Human-readable revisions for offers, packages, and orders (never shows ∞ for unlimited). */
export function formatRevisionsLabel(
    revisionsUnlimited: boolean | null | undefined,
    revisions: number | string | null | undefined,
    style: 'long' | 'short' = 'long'
): string {
    if (revisionsUnlimited) return 'Unlimited';
    const raw = typeof revisions === 'string' ? Number(revisions) : Number(revisions);
    const n = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    if (style === 'short') {
        return String(n);
    }
    if (n === 0) return 'No revisions';
    if (n === 1) return '1 revision';
    return `${n} revisions`;
}

/** Format date as DD/MM/YYYY (day/month/year) */
export const formatDateDDMMYYYY = (d: Date | string | null | undefined): string => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};
