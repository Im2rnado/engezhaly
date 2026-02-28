/** Formats status values: in_progress → "IN PROGRESS" */
export const formatStatus = (s: string) => (s || '').replace(/_/g, ' ').toUpperCase();
