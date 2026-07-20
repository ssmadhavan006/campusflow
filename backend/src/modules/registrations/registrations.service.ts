import { prisma } from '../../config/db';
import { RegistrationStatus, PaymentStatus, Role } from '@prisma/client';
import crypto from 'crypto';
import { generateQRToken } from '../../utils/qr';
import { logAudit } from '../../utils/audit';

export class RegistrationsService {
  static async registerForEvent(eventId: string, studentId: string) {
    const registrationId = crypto.randomUUID();
    const qrToken = generateQRToken(eventId, registrationId);

    const registration = await prisma.$transaction(async (tx) => {
      const events = await tx.$queryRaw<any[]>`
        SELECT id, status, capacity, "remainingSeats", "isPaid", price 
        FROM "Event" 
        WHERE id = ${eventId} 
        FOR UPDATE
      `;

      if (!events || events.length === 0) {
        throw new Error('Event not found.');
      }
      const event = events[0];

      if (event.status !== 'APPROVED') {
        throw new Error('Registrations are not open for this event.');
      }

      const existing = await tx.registration.findUnique({
        where: {
          eventId_studentId: { eventId, studentId },
        },
      });

      if (existing) {
        throw new Error('You are already registered for this event.');
      }

      let status: RegistrationStatus = RegistrationStatus.ACTIVE;

      if (event.remainingSeats <= 0) {
        status = RegistrationStatus.WAITLISTED;
      } else {
        await tx.event.update({
          where: { id: eventId },
          data: { remainingSeats: { decrement: 1 } },
        });
      }

      if (event.isPaid && status === RegistrationStatus.ACTIVE) {
        status = RegistrationStatus.PENDING;
      }

      const newReg = await tx.registration.create({
        data: {
          id: registrationId,
          eventId,
          studentId,
          qrToken,
          status,
        },
      });

      if (event.isPaid && status === RegistrationStatus.PENDING) {
        await tx.payment.create({
          data: {
            registrationId: newReg.id,
            amount: event.price,
            status: PaymentStatus.PENDING,
          },
        });
      }

      return newReg;
    });

    await logAudit(studentId, 'EVENT_REGISTER', 'Registration', registration.id, {
      eventId,
      status: registration.status,
    });

    return registration;
  }

  static async verifyPayment(registrationId: string, reference: string, status: PaymentStatus, userId: string, role: Role) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true, payment: true },
    });

    if (!registration) throw new Error('Registration not found.');
    if (!registration.payment) throw new Error('No payment record found for this registration.');

    const club = await prisma.club.findUnique({ where: { id: registration.event.clubId } });
    const isCoordinator = club?.createdById === userId;
    const isCoHost = await prisma.eventCoHost.findUnique({
      where: { eventId_userId: { eventId: registration.eventId, userId } }
    }) !== null;

    if (
      registration.event.organizerId !== userId &&
      !isCoHost &&
      !isCoordinator &&
      role !== Role.ADMIN
    ) {
      throw new Error('Not authorized to verify this payment.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({ where: { registrationId } });
      if (!currentPayment) throw new Error('No payment record found for this registration.');
      if (currentPayment.status === PaymentStatus.PAID) {
        throw new Error('Payment has already been processed.');
      }

      await tx.payment.update({
        where: { registrationId },
        data: {
          status,
          reference,
        },
      });

      let updatedReg;
      if (status === PaymentStatus.PAID) {
        updatedReg = await tx.registration.update({
          where: { id: registrationId },
          data: { status: RegistrationStatus.ACTIVE },
          include: { event: true, payment: true },
        });
      } else {
        updatedReg = await tx.registration.update({
          where: { id: registrationId },
          data: { status: RegistrationStatus.CANCELLED },
          include: { event: true, payment: true },
        });

        await tx.event.update({
          where: { id: registration.eventId },
          data: { remainingSeats: { increment: 1 } },
        });
      }

      return updatedReg;
    });

    await logAudit(userId, `PAYMENT_${status}`, 'Payment', registration.payment!.id, {
      registrationId,
      reference,
    });

    return updated;
  }

  static async cancelRegistration(registrationId: string, userId: string, role: Role) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) throw new Error('Registration not found.');

    const club = await prisma.club.findUnique({ where: { id: registration.event.clubId } });
    const isCoordinator = club?.createdById === userId;

    if (
      registration.studentId !== userId &&
      registration.event.organizerId !== userId &&
      !isCoordinator &&
      role !== Role.ADMIN
    ) {
      throw new Error('Not authorized to cancel this registration.');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new Error('Registration is already cancelled.');
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.registration.update({
        where: { id: registrationId },
        data: { status: RegistrationStatus.CANCELLED },
      });

      if (registration.status === RegistrationStatus.ACTIVE || registration.status === RegistrationStatus.PENDING) {
        await tx.event.update({
          where: { id: registration.eventId },
          data: { remainingSeats: { increment: 1 } },
        });
      }

      return updated;
    });

    await logAudit(userId, 'REGISTRATION_CANCEL', 'Registration', registrationId, { eventId: registration.eventId });

    return cancelled;
  }

  static async getRegistrationsByEvent(eventId: string, userId: string, role: Role) {
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
      throw new Error('Not authorized to view registrants for this event.');
    }

    return prisma.registration.findMany({
      where: { eventId },
      include: {
        student: { select: { id: true, name: true, email: true, rollNumber: true, department: true } },
        payment: true,
        attendance: true,
      },
    });
  }

  static async getMyRegistrations(studentId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where: { studentId },
        include: {
          event: {
            include: {
              club: { select: { name: true } },
              organizer: { select: { name: true } },
            },
          },
          payment: true,
          attendance: true,
          odLetter: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.registration.count({ where: { studentId } }),
    ]);
    return { registrations, total, page };
  }
}
