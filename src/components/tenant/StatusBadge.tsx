// Status badge colours used across the tenant portal.
// Green: Paid / Successful · Amber: Partial · Red: Overdue / Failed / Unpaid
// Blue: Prepaid · Grey: Credit

const badgeClasses = (status: string): string => {
  switch (status) {
    case 'PAID':
    case 'SUCCESSFUL':
    case 'SETTLED':
    case 'ACKNOWLEDGED':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
    case 'PARTIAL':
    case 'PARTIALLY_PAID':
      return 'bg-amber-100 text-amber-800 ring-amber-200';
    case 'OVERDUE':
    case 'FAILED':
    case 'ESCALATED':
      return 'bg-red-100 text-red-800 ring-red-200';
    case 'PREPAID':
      return 'bg-blue-100 text-blue-800 ring-blue-200';
    case 'CREDIT':
      return 'bg-slate-200 text-slate-700 ring-slate-300';
    case 'UNPAID':
      return 'bg-red-100 text-red-800 ring-red-200';
    case 'CANCELLED':
    case 'DRAFT':
      return 'bg-slate-100 text-slate-600 ring-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
};

export default function StatusBadge({
  status,
  className = '',
}: {
  status?: string | null;
  className?: string;
}) {
  if (!status) return <span className="text-sm text-slate-500">—</span>;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeClasses(
        status
      )} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
