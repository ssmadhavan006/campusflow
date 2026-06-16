import { prisma } from '../../config/db';
import { EventStatus, Role } from '@prisma/client';
import { logAudit } from '../../utils/audit';
import { validateStatusTransition } from './events.utils';

export class EventsService {
  static async createEvent(data: {
    title: string;
    description: string;
    date: Date;
    duration: number;
    location: string;
    capacity: number;
    isPaid: boolean;
    price: number;
    clubId: string;
    organizerId: string;
  }) {
    const club = await prisma.club.findUnique({ where: { id: data.clubId } });
    if (!club) throw new Error('Club not found.');

    // Fetch user to check role
    const user = await prisma.user.findUnique({ where: { id: data.organizerId } });
    if (!user) throw new Error('User not found.');

    if (user.role !== Role.ADMIN && club.createdById !== data.organizerId) {
      // Must be a LEADER or CO_LEADER in ClubMember
      const membership = await prisma.clubMember.findUnique({
        where: { clubId_userId: { clubId: data.clubId, userId: data.organizerId } },
      });
      if (!membership || (membership.role !== 'LEADER' && membership.role !== 'CO_LEADER')) {
        throw new Error('Only club leaders or co-leaders can create events on behalf of the club.');
      }
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        duration: data.duration,
        location: data.location,
        capacity: data.capacity,
        remainingSeats: data.capacity,
        isPaid: data.isPaid,
        price: data.isPaid ? data.price : 0.0,
        status: EventStatus.DRAFT,
        clubId: data.clubId,
        organizerId: data.organizerId,
      },
    });

    await logAudit(data.organizerId, 'EVENT_CREATE', 'Event', event.id);

    return event;
  }

  static async updateEvent(
    id: string,
    organizerId: string,
    role: Role,
    data: Partial<{
      title: string;
      description: string;
      date: Date;
      duration: number;
      location: string;
      capacity: number;
      isPaid: boolean;
      price: number;
    }>
  ) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found.');

    const club = await prisma.club.findUnique({ where: { id: event.clubId } });
    const isCoordinator = club?.createdById === organizerId;
    if (event.organizerId !== organizerId && role !== Role.ADMIN && !isCoordinator) {
      throw new Error('Not authorized to update this event.');
    }

    if (event.status !== EventStatus.DRAFT && event.status !== EventStatus.REJECTED && role !== Role.ADMIN) {
      throw new Error('Can only update draft or rejected events.');
    }

    let remainingSeats = event.remainingSeats;
    if (data.capacity !== undefined) {
      const seatsDifference = data.capacity - event.capacity;
      remainingSeats = event.remainingSeats + seatsDifference;
      if (remainingSeats < 0) {
        throw new Error('New capacity is less than currently registered seats.');
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...data,
        remainingSeats,
      },
    });

    await logAudit(organizerId, 'EVENT_UPDATE', 'Event', event.id, data);

    return updatedEvent;
  }

  static async submitForApproval(id: string, organizerId: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found.');

    const club = await prisma.club.findUnique({ where: { id: event.clubId } });
    const isCoordinator = club?.createdById === organizerId;
    if (event.organizerId !== organizerId && !isCoordinator) {
      throw new Error('Not authorized to submit this event.');
    }

    if (!validateStatusTransition(event.status, EventStatus.PENDING_APPROVAL)) {
      throw new Error(`Cannot submit event for approval from status: ${event.status}`);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: EventStatus.PENDING_APPROVAL },
    });

    await logAudit(organizerId, 'EVENT_SUBMIT', 'Event', id);

    return updated;
  }

  static async reviewEvent(
    id: string,
    coordinatorId: string,
    approved: boolean,
    comments?: string
  ) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found.');

    const club = await prisma.club.findUnique({ where: { id: event.clubId } });
    const user = await prisma.user.findUnique({ where: { id: coordinatorId } });
    if (club?.createdById !== coordinatorId && user?.role !== Role.ADMIN) {
      throw new Error('Only the club faculty coordinator or admin can review this event.');
    }

    const nextStatus = approved ? EventStatus.APPROVED : EventStatus.REJECTED;

    if (!validateStatusTransition(event.status, nextStatus)) {
      throw new Error(`Cannot transition event to ${nextStatus} from status: ${event.status}`);
    }

    const [updatedEvent] = await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: { status: nextStatus },
      }),
      prisma.eventApproval.create({
        data: {
          eventId: id,
          coordinatorId,
          approved,
          comments,
        },
      }),
    ]);

    await logAudit(coordinatorId, approved ? 'EVENT_APPROVE' : 'EVENT_REJECT', 'Event', id, { comments });

    return updatedEvent;
  }

  static async updateStatus(id: string, userId: string, role: Role, nextStatus: EventStatus) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found.');

    const club = await prisma.club.findUnique({ where: { id: event.clubId } });
    const isCoordinator = club?.createdById === userId;
    if (event.organizerId !== userId && role !== Role.ADMIN && !isCoordinator) {
      throw new Error('Not authorized to change status of this event.');
    }

    if (!validateStatusTransition(event.status, nextStatus)) {
      throw new Error(`Cannot transition event from ${event.status} to ${nextStatus}`);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: nextStatus },
    });

    await logAudit(userId, `EVENT_STATUS_TO_${nextStatus}`, 'Event', id);

    return updated;
  }

  static async getEvents(filters: {
    status?: EventStatus;
    clubId?: string;
    role?: Role;
    userId?: string;
    onlyManage?: boolean;
  }) {
    const where: any = {};

    if (filters.clubId) {
      where.clubId = filters.clubId;
    }

    if (filters.onlyManage && filters.userId) {
      where.OR = [
        { organizerId: filters.userId },
        { club: { createdById: filters.userId } }
      ];
      if (filters.status) {
        where.status = filters.status;
      }
    } else if (filters.role === Role.ADMIN) {
      if (filters.status) {
        where.status = filters.status;
      }
    } else {
      const publicStatuses = [
        EventStatus.APPROVED,
        EventStatus.REGISTRATION_CLOSED,
        EventStatus.ONGOING,
        EventStatus.COMPLETED,
        EventStatus.ATTENDANCE_VERIFIED,
        EventStatus.OD_GENERATED,
      ];

      if (filters.status) {
        if ((publicStatuses as any[]).includes(filters.status)) {
          where.status = filters.status;
        } else {
          where.status = filters.status;
          where.OR = [
            { organizerId: filters.userId },
            { club: { createdById: filters.userId } }
          ];
        }
      } else {
        where.OR = [
          { status: { in: publicStatuses } },
          { organizerId: filters.userId },
          { club: { createdById: filters.userId } }
        ];
      }
    }

    return prisma.event.findMany({
      where,
      include: {
        club: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true, email: true } },
        approvals: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          include: { coordinator: { select: { name: true } } },
        },
        registrations: {
          include: {
            payment: true,
            attendance: true,
          },
        },
        _count: { select: { registrations: true, attendance: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  static async getEventById(id: string, userId: string, role: Role) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true, email: true } },
        approvals: {
          include: { coordinator: { select: { name: true } } },
        },
        volunteers: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { registrations: true, attendance: true } },
      },
    });

    if (!event) throw new Error('Event not found.');

    const secretStatuses: EventStatus[] = [EventStatus.DRAFT, EventStatus.PENDING_APPROVAL, EventStatus.REJECTED];
    if (
      secretStatuses.includes(event.status) &&
      role === Role.STUDENT &&
      event.organizerId !== userId
    ) {
      throw new Error('Not authorized to view this event.');
    }

    return event;
  }
}
