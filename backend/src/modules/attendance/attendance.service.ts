import { prisma } from '../../config/db';
import { verifyQRToken } from '../../utils/qr';
import { logAudit } from '../../utils/audit';
import { Role, RegistrationStatus } from '@prisma/client';

export class AttendanceService {
  static async assignVolunteer(eventId: string, userId: string, assignedById: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found.');

    const assignerUser = await prisma.user.findUnique({ where: { id: assignedById } });
    if (!assignerUser) throw new Error('Assigner not found.');

    const club = await prisma.club.findUnique({ where: { id: event.clubId } });
    const isCoordinator = club?.createdById === assignedById;

    const assignerMembership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: event.clubId, userId: assignedById } }
    });
    const isLeader = assignerMembership?.role === 'HOD' || assignerMembership?.role === 'FACULTY';

    const isCoHost = await prisma.eventCoHost.findUnique({
      where: { eventId_userId: { eventId, userId: assignedById } }
    }) !== null;

    if (
      event.organizerId !== assignedById &&
      !isCoHost &&
      !isCoordinator &&
      !isLeader &&
      assignerUser.role !== Role.ADMIN
    ) {
      throw new Error('Only the event organizer, co-host, club coordinator, HOD, Faculty, or admin can assign volunteers.');
    }

    const volunteerUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!volunteerUser) throw new Error('User not found.');

    const volunteerMembership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: event.clubId, userId } }
    });

    const isCoHostVolunteer = await prisma.eventCoHost.findUnique({
      where: { eventId_userId: { eventId, userId } }
    }) !== null;
    if (!volunteerMembership && event.organizerId !== userId && !isCoHostVolunteer) {
      throw new Error('Only members of the organizing club or co-hosts can be assigned as volunteers.');
    }

    const volunteer = await prisma.volunteer.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      update: {},
      create: {
        eventId,
        userId,
        assignedById,
      },
    });

    await logAudit(assignedById, 'VOLUNTEER_ASSIGN', 'Volunteer', volunteer.id, { eventId, userId });

    return volunteer;
  }

  static async scanAttendance(qrToken: string, volunteerId: string, deviceId: string | undefined) {
    const decoded = verifyQRToken(qrToken);
    if (!decoded) {
      throw new Error('Invalid QR Code signature.');
    }

    const { eventId, registrationId } = decoded;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true, student: true },
    });

    if (!registration) {
      throw new Error('Registration record not found.');
    }

    if (registration.eventId !== eventId) {
      throw new Error('Registration details mismatch.');
    }

    if (registration.status !== RegistrationStatus.ACTIVE) {
      throw new Error(`Registration is not active. Current status: ${registration.status}`);
    }

    const event = registration.event;

    const validStates = ['APPROVED', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED'];
    if (!validStates.includes(event.status)) {
      throw new Error(`Cannot record attendance for event with status: ${event.status}`);
    }

    const volunteerUser = await prisma.user.findUnique({ where: { id: volunteerId } });
    const isAssignedVolunteer = await prisma.volunteer.findUnique({
      where: { eventId_userId: { eventId, userId: volunteerId } }
    }) !== null;

    const isCoHostScanner = await prisma.eventCoHost.findUnique({
      where: { eventId_userId: { eventId, userId: volunteerId } }
    }) !== null;

    const club = await prisma.club.findUnique({ where: { id: event.clubId } });
    const isCoordinator = club?.createdById === volunteerId;

    const hasScanPermission = 
      isAssignedVolunteer || 
      event.organizerId === volunteerId || 
      isCoHostScanner || 
      isCoordinator || 
      volunteerUser?.role === Role.ADMIN ||
      volunteerUser?.role === Role.HOD;

    if (!hasScanPermission) {
      throw new Error('You are not authorized to scan tickets for this event. Only assigned volunteers, hosts, co-hosts, coordinators, department heads, or admin can scan.');
    }

    const existing = await prisma.attendance.findUnique({
      where: { registrationId },
    });

    if (existing) {
      throw new Error('Duplicate scan! Attendance has already been recorded for this student.');
    }

    const attendance = await prisma.attendance.create({
      data: {
        registrationId,
        eventId,
        volunteerId,
        deviceId,
      },
      include: {
        registration: {
          include: {
            student: { select: { name: true, rollNumber: true, department: true } },
          },
        },
      },
    });

    await logAudit(volunteerId, 'ATTENDANCE_SCAN', 'Attendance', attendance.id, {
      registrationId,
      eventId,
      studentId: registration.studentId,
    });

    return attendance;
  }

  static async getAttendanceStats(eventId: string, userId: string, role: Role) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found.');

    const club = await prisma.club.findUnique({ where: { id: event.clubId } });
    const isCoordinator = club?.createdById === userId;

    const membership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: event.clubId, userId } }
    });
    const isLeader = membership?.role === 'HOD' || membership?.role === 'FACULTY';

    const isCoHost = await prisma.eventCoHost.findUnique({
      where: { eventId_userId: { eventId, userId } }
    }) !== null;

    if (
      event.organizerId !== userId &&
      !isCoHost &&
      !isCoordinator &&
      !isLeader &&
      role !== Role.ADMIN
    ) {
      throw new Error('Not authorized to view attendance logs.');
    }

    const attendanceLogs = await prisma.attendance.findMany({
      where: { eventId },
      include: {
        volunteer: { select: { name: true, email: true } },
        registration: {
          include: {
            student: { select: { id: true, name: true, rollNumber: true, department: true, email: true } },
          },
        },
      },
      orderBy: { scannedAt: 'desc' },
    });

    return attendanceLogs;
  }
}
