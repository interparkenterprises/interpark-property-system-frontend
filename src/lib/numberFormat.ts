const exactKes = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const compactKes = new Intl.NumberFormat('en-KE', {
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatExactKes = (value: number) => exactKes.format(value).replace(/^KES\s*/, 'Ksh ');

export const formatCompactKes = (value: number) => {
  if (Math.abs(value) < 1_000_000) return formatExactKes(value);
  return `Ksh ${compactKes.format(value)}`;
};
