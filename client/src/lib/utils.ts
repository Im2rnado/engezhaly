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

/** Delivery instant for order countdowns: order row, linked custom offer, or bundle package days from order date. */
export function getOrderDeliveryDeadlineIso(order: any): string | null {
    if (!order) return null;
    const tryDate = (v: unknown): string | null => {
        if (v == null || v === '') return null;
        const d = new Date(v as string | Date);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };
    const fromOrder = tryDate(order.deliveryDate);
    if (fromOrder) return fromOrder;
    const off = order.offerId;
    if (off && typeof off === 'object' && off.deliveryDate) {
        const fromOffer = tryDate(off.deliveryDate);
        if (fromOffer) return fromOffer;
    }
    const pkgs = order.projectId?.packages;
    const pkgType = order.packageType;
    if (Array.isArray(pkgs) && pkgType && order.createdAt) {
        const pkg = pkgs.find((p: { type?: string }) => p?.type === pkgType);
        const days = pkg?.days;
        if (days != null && !Number.isNaN(Number(days))) {
            const d = new Date(order.createdAt);
            d.setDate(d.getDate() + Number(days));
            if (!Number.isNaN(d.getTime())) return d.toISOString();
        }
    }
    return null;
}

/** Show delivery countdown for in-flight marketplace / custom orders (not completed or refunded). */
export function orderStatusShowsDeliveryCountdown(status: string | undefined): boolean {
    return ['pending_approval', 'pending_payment', 'active', 'disputed'].includes(status || '');
}

/** Posted-job delivery instant: job createdAt + accepted proposal deliveryDays (job.deadline is a label string, not a Date). */
export function getPostedJobDeliveryDeadlineIso(job: any): string | null {
    if (!job || job.status !== 'in_progress') return null;
    const proposal = job.myProposal;
    if (!proposal || proposal.status !== 'accepted') return null;
    const days = proposal.deliveryDays;
    if (days == null || Number.isNaN(Number(days))) return null;
    const d = new Date(job.createdAt);
    d.setDate(d.getDate() + Number(days));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
