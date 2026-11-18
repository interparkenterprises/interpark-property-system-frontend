import type { PersonnelType, ServiceCategory, ServiceShiftType, WeekDay } from '@/types';

export type PersonnelPortalState = 'NOT_GRANTED' | 'PENDING_ACTIVATION' | 'ENABLED' | 'DISABLED';
export type InvitationDeliveryStatus = 'PREPARED' | 'ACCEPTED' | 'FAILED' | 'NOT_CONFIGURED';

export interface PersonnelInvitationStatus {
  prepared: boolean;
  delivered: boolean;
  deliveryStatus: InvitationDeliveryStatus;
  expiresAt: string;
  deliveryAttemptedAt: string | null;
  deliveredAt: string | null;
}

export interface PersonnelPortalAccess {
  personnelId: string;
  email: string | null;
  portalState: PersonnelPortalState;
  hasAccount: boolean;
  activatedAt: string | null;
  loginEnabled: boolean;
  invitation: PersonnelInvitationStatus | null;
}

export interface PersonnelLoginUser {
  id: string;
  name: string;
  email: string;
  role: 'PERSONNEL';
  personnel: { id: string; name: string; jobRole: string };
}

export interface PersonnelLoginResult {
  user: PersonnelLoginUser;
  csrfToken: string;
  expiresInSeconds: number;
}

export interface PersonnelPortalSchedule {
  id: string;
  dayOfWeek: WeekDay;
  shiftType: ServiceShiftType;
  startTime: string | null;
  endTime: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
}

export interface PersonnelPortalAssignment {
  id: string;
  serviceCategory: ServiceCategory;
  jobRole: string;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE';
  assignmentTiming: 'CURRENT' | 'UPCOMING';
  notes: string | null;
  property: {
    id: string;
    name: string;
    address: string;
    form: string;
    usage: string;
  };
  schedules: PersonnelPortalSchedule[];
}

export interface PersonnelPortalProfile {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  jobRole: string;
  personnelType: PersonnelType;
  status: 'ACTIVE';
  assignments: PersonnelPortalAssignment[];
  upcomingAssignments: PersonnelPortalAssignment[];
}
