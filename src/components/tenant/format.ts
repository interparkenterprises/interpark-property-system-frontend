// ---------- Shared, null-safe formatters for the tenant portal ----------

/** Format a number as Kenyan Shillings; returns an em-dash for null/undefined/invalid. */
export const ksh = (n?: number | null): string =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : `KSh ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

/** Format an ISO date as e.g. "12 Mar 2026"; returns an em-dash for null/invalid. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

/** Format an ISO date+time as e.g. "12 Mar 2026, 14:05". */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

/** Human-readable file size, e.g. "1.4 MB". */
export function formatFileSize(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(Number(bytes))) return '—';
  const b = Number(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

/** Render any possibly-missing value as visible text (never "undefined"/"null"). */
export function orDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}
