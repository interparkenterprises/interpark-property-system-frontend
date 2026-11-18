export const PERSONNEL_CSRF_STORAGE_KEY = 'interpark_personnel_csrf';

export const personnelPasswordRequirements = (password: string) => ({
  minimumLength: password.length >= 8,
  maximumLength: password.length <= 128,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  specialCharacter: /[^A-Za-z0-9]/.test(password),
  noWhitespace: !/\s/.test(password),
  recommendedLength: password.length >= 12,
});

export const readFragmentToken = (hash: string): string | null => {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  return value?.trim() || null;
};

export const passwordMeetsPersonnelPolicy = (password: string): boolean => (
  Object.entries(personnelPasswordRequirements(password))
    .filter(([name]) => name !== 'recommendedLength')
    .every(([, met]) => met)
);
