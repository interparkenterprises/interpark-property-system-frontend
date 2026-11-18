import type { PersonnelPortalState } from '@/types/personnelPortal';

export type PersonnelPortalAction = 'invite' | 'resend' | 'disable' | 'enable';

export const actionsForPortalState = (state: PersonnelPortalState): PersonnelPortalAction[] => {
  if (state === 'NOT_GRANTED') return ['invite'];
  if (state === 'PENDING_ACTIVATION') return ['resend', 'disable'];
  if (state === 'ENABLED') return ['disable'];
  return ['enable'];
};
