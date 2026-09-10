import React from 'react';
import { AlertCircle, RefreshCw, FolderOpen } from 'lucide-react';

// ── Severity & Status Badges ──────────────────────────────────────────────────

export interface SeverityBadgeProps {
  severity: 'CRITICAL' | 'EMERGENT' | 'URGENT' | 'LESS_URGENT' | 'NON_URGENT' | 'Standard' | 'Urgent' | 'Critical' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const norm = String(severity || '').toUpperCase();
  
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = norm;

  if (norm === 'CRITICAL' || norm === 'LEVEL 1') {
    colorStyle = 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
    label = 'CRITICAL';
  } else if (norm === 'EMERGENT' || norm === 'LEVEL 2') {
    colorStyle = 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20';
    label = 'EMERGENT';
  } else if (norm === 'URGENT' || norm === 'LEVEL 3') {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
    label = 'URGENT';
  } else if (norm === 'LESS_URGENT' || norm === 'LEVEL 4' || norm === 'STANDARD') {
    colorStyle = 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20';
    label = norm === 'STANDARD' ? 'STANDARD' : 'LESS URGENT';
  } else if (norm === 'NON_URGENT' || norm === 'LEVEL 5') {
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
    label = 'NON URGENT';
  }

  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center font-bold border rounded-md uppercase tracking-wider ${colorStyle} ${sizeStyle}`}>
      {label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const norm = String(status || '').toUpperCase();

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  if (norm === 'CONFIRMED' || norm === 'ACTIVE' || norm === 'OPEN' || norm === '24_7' || norm === 'AVAILABLE' || norm === 'COMPLETED') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (norm === 'SCHEDULED' || norm === 'IN_PROGRESS' || norm === 'PENDING' || norm === 'APPOINTMENT_ONLY') {
    style = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (norm === 'CANCELLED' || norm === 'NO_SHOW' || norm === 'CLOSED' || norm === 'SUSPENDED' || norm === 'OCCUPIED') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (norm === 'MAINTENANCE' || norm === 'TEMPORARILY_UNAVAILABLE' || norm === 'TRAINING') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center font-bold border rounded-md uppercase ${style} ${padding}`}>
      {status}
    </span>
  );
};

// ── Skeletons ────────────────────────────────────────────────────────────────

export const CardSkeleton: React.FC<{ height?: string }> = ({ height = 'h-32' }) => (
  <div className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse space-y-3 ${height}`}>
    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse space-y-4">
    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
      <div className="h-5 bg-slate-200 rounded w-1/4"></div>
      <div className="h-8 bg-slate-200 rounded w-24"></div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-50">
        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-6 bg-slate-200 rounded w-16 ml-auto"></div>
      </div>
    ))}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse p-2">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-7 bg-slate-200 rounded w-48"></div>
        <div className="h-4 bg-slate-100 rounded w-72"></div>
      </div>
      <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <TableSkeleton rows={4} />
  </div>
);

// ── Error & Empty States ─────────────────────────────────────────────────────

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Unable to load data from backend server.',
  onRetry,
}) => (
  <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 text-center space-y-3 my-4">
    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
      <AlertCircle className="w-5 h-5" />
    </div>
    <div className="space-y-1">
      <h4 className="font-bold text-sm text-slate-900">Backend Communication Error</h4>
      <p className="text-xs text-slate-600 max-w-md mx-auto">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry Request
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title?: string; message?: string; action?: { label: string; onClick: () => void } }> = ({
  title = 'No records found',
  message = 'There are no active entries to display for this view.',
  action,
}) => (
  <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3 my-4">
    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
      <FolderOpen className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h4 className="font-bold text-sm text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">{message}</p>
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-[#003087] hover:bg-[#002060] text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
      >
        {action.label}
      </button>
    )}
  </div>
);
