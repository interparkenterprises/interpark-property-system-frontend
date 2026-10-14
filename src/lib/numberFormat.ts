const exactKes = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatExactKes = (value: number) => exactKes.format(value).replace(/^KES\s*/, 'Ksh ');

export const formatCompactKes = (value: number) => {
  const units = [
    { value: 1_000_000_000_000, suffix: 'T' },
    { value: 1_000_000_000, suffix: 'B' },
    { value: 1_000_000, suffix: 'M' },
    { value: 1_000, suffix: 'K' },
  ] as const;
  const absolute = Math.abs(value);
  const unitIndex = units.findIndex(unit => absolute >= unit.value);

  if (unitIndex === -1) return formatExactKes(value);

  let selectedIndex = unitIndex;
  let scaled = value / units[selectedIndex].value;
  let rounded = Number(scaled.toFixed(2));

  while (Math.abs(rounded) >= 1_000 && selectedIndex > 0) {
    selectedIndex -= 1;
    scaled = value / units[selectedIndex].value;
    rounded = Number(scaled.toFixed(2));
  }

  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);

  return `Ksh ${formatted}${units[selectedIndex].suffix}`;
};
