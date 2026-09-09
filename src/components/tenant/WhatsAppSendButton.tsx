'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, CheckCheck, XCircle, Loader2 } from 'lucide-react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { toast } from 'sonner';

interface WhatsAppSendButtonProps {
  tenantId: string;
  documentType:
    | 'Invoice'
    | 'Demand Letter'
    | 'Bill Invoices'
    | 'All Payment Reports'
    | 'Bill Report'
    | 'Full Report';
  documentId?: string; // not required for the three combined-report types
  propertyId?: string;
  tenantPhone?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Document types that send a combined/tenant-level report -- no specific
// documentId needed, and each routes to its own dedicated send function.
const COMBINED_REPORT_TYPES = ['All Payment Reports', 'Bill Report', 'Full Report'] as const;

// Real WhatsApp glyph -- lucide-react has no brand icons, so this is an inline SVG
// of the official WhatsApp logo mark, styled with currentColor to match the button.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.48 1.32 4.99L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.83 14.13c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.81-.11-.42-.13-.96-.31-1.65-.6-2.91-1.26-4.81-4.17-4.96-4.36-.15-.2-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.01.9 2.16.07.15.11.32.02.51-.09.19-.13.31-.27.48-.13.16-.28.36-.4.48-.13.13-.27.28-.11.55.15.28.68 1.12 1.46 1.81 1.01.9 1.86 1.18 2.13 1.31.27.13.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.27.13.44.2.51.31.06.11.06.65-.18 1.33z"/>
    </svg>
  );
}

type SendStatus = 'never' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// WhatsApp's own brand colors -- green for the idle/active states so the
// button reads instantly as "send via WhatsApp" without needing a label.
// Failed state switches to red as a universal error cue; read receipts use
// WhatsApp's actual blue tick color for authenticity.
const STATUS_STYLES: Record<SendStatus, { bg: string; bgHover: string; icon: string }> = {
  never:    { bg: '#25D366', bgHover: '#1FAF57', icon: 'text-white' },
  sending:  { bg: '#25D366', bgHover: '#25D366', icon: 'text-white' },
  sent:     { bg: '#1FAF57', bgHover: '#1a9a4c', icon: 'text-white' },
  delivered:{ bg: '#1FAF57', bgHover: '#1a9a4c', icon: 'text-white' },
  read:     { bg: '#128C7E', bgHover: '#0f7568', icon: 'text-[#53BDEB]' },
  failed:   { bg: '#dc2626', bgHover: '#b91c1c', icon: 'text-white' },
};

const STATUS_LABELS: Record<SendStatus, string> = {
  never: 'Send',
  sending: 'Sending...',
  sent: 'Send Again',
  delivered: 'Send Again',
  read: 'Send Again',
  failed: 'Retry',
};

export function WhatsAppSendButton({
  tenantId,
  documentType,
  documentId,
  propertyId,
  tenantPhone,
  size = 'sm',
  showLabel = true,
}: WhatsAppSendButtonProps) {
  const {
    sendDocument,
    sendAllPaymentReports,
    sendBillReport,
    sendComprehensiveReport,
    getSendStatus,
  } = useWhatsApp();
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [status, setStatus] = useState<SendStatus>('never');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mapBackendStatus = (backendStatus: string | null | undefined): SendStatus => {
    switch (backendStatus) {
      case 'delivered': return 'delivered';
      case 'read': return 'read';
      case 'failed': return 'failed';
      case 'sent':
      case 'resent':
        return 'sent';
      default:
        return 'never';
    }
  };

  // Load the real last-known status on mount, so refreshing the page
  // shows the actual delivery outcome rather than resetting to blank.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const statuses = await getSendStatus(tenantId);
      const match = statuses.find(s => s.documentType === documentType);
      if (match && !cancelled) {
        setStatus(mapBackendStatus(match.status));
        setLastSent(match.lastSent);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, documentType]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // After a successful send, delivery/read status arrives asynchronously
  // via the WhatsApp webhook. Poll briefly to pick up that update live.
  const pollForDeliveryStatus = () => {
    if (pollRef.current) clearInterval(pollRef.current);

    let attempts = 0;
    const maxAttempts = 10; // ~50s total at 5s intervals

    pollRef.current = setInterval(async () => {
      attempts += 1;
      const statuses = await getSendStatus(tenantId);
      const match = statuses.find(s => s.documentType === documentType);

      if (match) {
        const mapped = mapBackendStatus(match.status);
        setStatus(mapped);
        setLastSent(match.lastSent);

        if (mapped === 'delivered' || mapped === 'read' || mapped === 'failed' || attempts >= maxAttempts) {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } else if (attempts >= maxAttempts) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 5000);
  };

  // Same handler covers both the first send AND retrying after a failure --
  // clicking a failed button just calls this again, no separate retry path
  // needed since a fresh send attempt IS the retry.
  const handleSend = async () => {
    if (!tenantPhone) {
      toast.error('Tenant has no phone number on file');
      return;
    }

    const isCombinedReport = (COMBINED_REPORT_TYPES as readonly string[]).includes(documentType);

    if (!isCombinedReport && !documentId) {
      toast.error('Missing document to send');
      return;
    }

    try {
      setIsSending(true);
      setStatus('sending');

      let result;
      if (documentType === 'All Payment Reports') {
        result = await sendAllPaymentReports(tenantId, propertyId);
      } else if (documentType === 'Bill Report') {
        result = await sendBillReport(tenantId, propertyId);
      } else if (documentType === 'Full Report') {
        result = await sendComprehensiveReport(tenantId, propertyId);
      } else {
        result = await sendDocument(tenantId, documentType, documentId!, propertyId);
      }

      if (result.success) {
        setStatus('sent');
        setLastSent(new Date().toISOString());
        toast.success(`${documentType} sent via WhatsApp!`);
        pollForDeliveryStatus();
      } else {
        setStatus('failed');
        toast.error(result.message || 'Failed to send document');
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send document';

      setStatus('failed');
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const formatSentTime = (iso: string) =>
    new Date(iso).toLocaleString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusInfo = () => {
    if (isSending || status === 'sending') {
      return {
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        tooltip: 'Sending...',
      };
    }

    if (status === 'read' && lastSent) {
      return {
        icon: <CheckCheck className="h-5 w-5" />,
        tooltip: `Read: ${formatSentTime(lastSent)}`,
      };
    }

    if (status === 'delivered' && lastSent) {
      return {
        icon: <CheckCheck className="h-5 w-5" />,
        tooltip: `Delivered: ${formatSentTime(lastSent)}`,
      };
    }

    if (status === 'sent' && lastSent) {
      return {
        icon: <Check className="h-5 w-5" />,
        tooltip: `Sent: ${formatSentTime(lastSent)}`,
      };
    }

    if (status === 'failed') {
      return {
        icon: <XCircle className="h-5 w-5" />,
        tooltip: 'Failed to send — click to retry',
      };
    }

    return {
      icon: <WhatsAppIcon className="h-5 w-5" />,
      tooltip: 'Send via WhatsApp',
    };
  };

  const statusInfo = getStatusInfo();
  const styles = STATUS_STYLES[isSending ? 'sending' : status];
  const label = STATUS_LABELS[isSending ? 'sending' : status];

  const sizeClasses = {
    sm: showLabel ? 'h-8 pl-2 pr-3 text-xs' : 'h-8 w-8',
    md: showLabel ? 'h-10 pl-2.5 pr-4 text-sm' : 'h-10 w-10',
    lg: showLabel ? 'h-12 pl-3 pr-5 text-base' : 'h-12 w-12',
  }[size];

  const iconWrapSize = { sm: 'h-6 w-6', md: 'h-7 w-7', lg: 'h-8 w-8' }[size];

  return (
    <div className="relative group inline-block">
      <button
        type="button"
        onClick={handleSend}
        disabled={isSending}
        title={statusInfo.tooltip}
        style={{ backgroundColor: styles.bg }}
        className={`
          group/btn flex items-center gap-2 rounded-full font-semibold
          transition-colors duration-200 shadow-sm hover:shadow-md
          disabled:cursor-not-allowed disabled:opacity-90
          ${sizeClasses} ${styles.icon}
        `}
        onMouseEnter={(e) => { if (!isSending) e.currentTarget.style.backgroundColor = styles.bgHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = styles.bg; }}
      >
        <span className={`flex items-center justify-center shrink-0 ${!showLabel ? 'w-full h-full' : iconWrapSize}`}>
          {statusInfo.icon}
        </span>
        {showLabel && <span className="whitespace-nowrap">{label}</span>}
      </button>

      {/* Tooltip on hover -- shown regardless of showLabel, since the label
          alone ("Sent") doesn't include the timestamp detail. */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap shadow-lg">
          {statusInfo.tooltip}
        </span>
      </div>
    </div>
  );
}