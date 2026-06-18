import { prisma } from '../../config/db';
import { EventStatus, Role } from '@prisma/client';
import { logAudit } from '../../utils/audit';
import { validateStatusTransition } from './events.utils';
import { storageService } from '../../utils/storage';

export class EventsService {
  static async savePosterBase64(base64Str: string): Promise<string> {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid poster image format.');
    }
    const fileType = matches[1];
    const extension = fileType.split('/')[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `posters/poster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    await storageService.saveFile(filename, buffer);
    return filename;
  }
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
    poster?: string;
  }) {
    const club = await prisma.club.findUnique({ where: { id: data.clubId } });
    if (!club) throw new Error('Club not found.');

    const user = await prisma.user.findUnique({ where: { id: data.organizerId } });
    if (!user) throw new Error('User not found.');

    if (user.role !== Role.ADMIN && user.role !== Role.FACULTY && user.role !== Role.HOD) {
      throw new Error('Only faculty coordinators, HODs, or admins can create events.');
    }

    let posterPath: string | null = null;
    if (data.poster) {
      posterPath = await this.savePosterBase64(data.poster);
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
        poster: posterPath,
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
      poster: string;
    }>
  ) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found.');

    const coHost = await prisma.eventCoHost.findUnique({
      where: { eventId_userId: { eventId: id, userId: organizerId } },
    });
    const isCoHost = !!coHost;
    if (event.organizerId !== organizerId && role !== Role.ADMIN && role !== Role.HOD && !isCoHost) {
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

    let posterPath: string | undefined = undefined;
    if (data.poster) {
      posterPath = await this.savePosterBase64(data.poster);
    }

    // Extract poster from data to avoid passing base64 directly to prisma update
    const { poster, ...prismaUpdateData } = data;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...prismaUpdateData,
        remainingSeats,
        ...(posterPath !== undefined ? { poster: posterPath } : {}),
      },
    });

    await logAudit(organizerId, 'EVENT_UPDATE', 'Event', event.id, data);

    return updatedEvent;
  }

  static async submitForApproval(id: string, organizerId: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found.');

    const coHost = await prisma.eventCoHost.findUnique({
      where: { eventId_userId: { eventId: id, userId: organizerId } },
    });
    const isCoHost = !!coHost;
    if (event.organizerId !== organizerId && !isCoHost) {
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

    const user = await prisma.user.findUnique({ where: { id: coordinatorId } });
    if (user?.role !== Role.HOD && user?.role !== Role.ADMIN) {
      throw new Error('Only the HOD or admin can review this event.');
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

    const coHost = await prisma.eventCoHost.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });
    const isCoHost = !!coHost;
    if (event.organizerId !== userId && role !== Role.ADMIN && role !== Role.HOD && !isCoHost) {
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
        { club: { createdById: filters.userId } },
        { coHosts: { some: { userId: filters.userId } } }
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
            { club: { createdById: filters.userId } },
            { coHosts: { some: { userId: filters.userId } } }
          ];
        }
      } else {
        where.OR = [
          { status: { in: publicStatuses } },
          { organizerId: filters.userId },
          { club: { createdById: filters.userId } },
          { coHosts: { some: { userId: filters.userId } } }
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
        coHosts: {
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

  static async assignCoHost(eventId: string, email: string, userId: string, role: Role) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found.');

    if (event.organizerId !== userId && role !== Role.ADMIN && role !== Role.HOD) {
      throw new Error('Only the event host, HOD, or admin can assign co-hosts.');
    }

    const coHostUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!coHostUser) {
      throw new Error('User not found. Ensure they have registered an account.');
    }

    if (coHostUser.role !== Role.FACULTY && coHostUser.role !== Role.HOD) {
      throw new Error('Only faculty members or HODs can be assigned as co-hosts.');
    }

    const coHost = await prisma.eventCoHost.create({
      data: {
        eventId,
        userId: coHostUser.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit(userId, 'EVENT_ASSIGN_COHOST', 'Event', eventId, { coHostId: coHostUser.id });

    return coHost;
  }

  static async deleteEvent(id: string, adminId: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found.');

    const deleted = await prisma.event.delete({ where: { id } });
    await logAudit(adminId, 'EVENT_DELETE', 'Event', id, { title: event.title });
    return deleted;
  }
}
