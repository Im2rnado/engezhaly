/** Formats status values: in_progress → "IN PROGRESS" */
export const formatStatus = (s: string) => (s || '').replace(/_/g, ' ').toUpperCase();

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
