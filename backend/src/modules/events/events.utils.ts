import { EventStatus } from '@prisma/client';

export const validateStatusTransition = (current: EventStatus, next: EventStatus): boolean => {
  const allowedTransitions: Record<EventStatus, EventStatus[]> = {
    [EventStatus.DRAFT]: [EventStatus.PENDING_APPROVAL],
    [EventStatus.PENDING_APPROVAL]: [EventStatus.APPROVED, EventStatus.REJECTED],
    [EventStatus.APPROVED]: [EventStatus.REGISTRATION_CLOSED, EventStatus.ONGOING, EventStatus.COMPLETED],
    [EventStatus.REJECTED]: [EventStatus.PENDING_APPROVAL, EventStatus.DRAFT],
    [EventStatus.REGISTRATION_CLOSED]: [EventStatus.ONGOING, EventStatus.COMPLETED],
    [EventStatus.ONGOING]: [EventStatus.COMPLETED],
    [EventStatus.COMPLETED]: [EventStatus.ATTENDANCE_VERIFIED],
    [EventStatus.ATTENDANCE_VERIFIED]: [EventStatus.OD_GENERATED],
    [EventStatus.OD_GENERATED]: [],
  };

  return allowedTransitions[current]?.includes(next) || false;
};
