export const formatNaira = (value: unknown) => `₦${Math.round(Number(value) || 0).toLocaleString('en-NG')}`;

export const formatDateRange = (start?: string, end?: string) => {
  if (!start || !end) return 'Dates not supplied';
  const format = (value: string) => new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${format(start)} – ${format(end)}`;
};

export const reservationLabel = (value?: string) => ({ normal: 'Normal stay', party: 'Party', movie: 'Movie shoot', photo: 'Photo shoot' }[value || 'normal'] || 'Normal stay');

export const bargainStatus = (status?: string) => {
  const value = String(status || 'pending').toLowerCase();
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'Awaiting owner', className: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800' },
    countered: { label: 'Counter offer', className: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800' },
    accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800' },
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800' },
    declined: { label: 'Declined', className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700' },
  };
  return map[value] || { label: value, className: 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700' };
};
