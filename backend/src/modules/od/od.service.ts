import { prisma } from '../../config/db';
import { EventStatus, Role } from '@prisma/client';
import crypto from 'crypto';
import path from 'path';
import { env } from '../../config/env';
import { generateODPDFBuffer } from '../../utils/pdf';
import { storageService } from '../../utils/storage';
import { logAudit } from '../../utils/audit';

export class ODService {
  static async approveEventAndGenerateODs(eventId: string, facultyId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: true },
    });

    if (!event) throw new Error('Event not found.');

    if (event.status !== EventStatus.ATTENDANCE_VERIFIED && event.status !== EventStatus.COMPLETED) {
      throw new Error(`Cannot approve OD generation for event in status: ${event.status}`);
    }

    const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
    if (!faculty) throw new Error('Faculty coordinator not found.');

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.OD_GENERATED },
    });

    await logAudit(facultyId, 'OD_APPROVE_EVENT', 'Event', eventId);

    if (env.DISABLE_AUTO_OD_GENERATION) {
      await logAudit(facultyId, 'OD_GENERATION_SKIPPED_GLOBAL_DISABLE', 'Event', eventId);
      return {
        message: 'Event attendance approved. Automatic OD generation is disabled globally by college policy.',
        event: updatedEvent,
      };
    }

    const attendanceLogs = await prisma.attendance.findMany({
      where: { eventId },
      include: {
        registration: {
          include: {
            student: true,
          },
        },
      },
    });

    let generatedCount = 0;

    for (const log of attendanceLogs) {
      const student = log.registration.student;
      const registrationId = log.registrationId;

      const existing = await prisma.oDLetter.findUnique({ where: { registrationId } });
      if (existing) continue;

      const verificationId = crypto.randomBytes(8).toString('hex').toUpperCase();

      const odData = {
        studentName: student.name,
        rollNumber: student.rollNumber || 'N/A',
        department: student.department || 'N/A',
        eventName: event.title,
        eventDate: event.date.toLocaleDateString(),
        eventDuration: event.duration.toString(),
        facultyName: faculty.name,
        approvalTimestamp: new Date().toLocaleString(),
        verificationId,
      };

      try {
        const pdfBuffer = await generateODPDFBuffer(odData);
        const fileName = `od_letters/${verificationId}.pdf`;
        await storageService.saveFile(fileName, pdfBuffer);

        await prisma.oDLetter.create({
          data: {
            registrationId,
            studentId: student.id,
            eventId,
            facultyId,
            filePath: fileName,
            verificationId,
          },
        });

        await prisma.notification.create({
          data: {
            userId: student.id,
            title: 'On-Duty Letter Available',
            message: `Your OD letter for event "${event.title}" has been approved and is ready for download.`,
          },
        });

        generatedCount++;
      } catch (err) {
        console.error(`[OD_GEN_ERROR] Failed to generate OD for student ${student.id}:`, err);
      }
    }

    await logAudit(facultyId, 'OD_BATCH_GENERATE', 'Event', eventId, { count: generatedCount });

    return {
      message: `Successfully approved event and generated ${generatedCount} OD letters.`,
      event: updatedEvent,
    };
  }

  static async getODLetterFilePath(verificationId: string, userId: string, role: Role) {
    const odLetter = await prisma.oDLetter.findUnique({
      where: { verificationId },
      include: { registration: { include: { event: true } } },
    });

    if (!odLetter) {
      throw new Error('OD Letter not found.');
    }

    if (
      role === Role.STUDENT &&
      odLetter.studentId !== userId
    ) {
      throw new Error('Not authorized to access this OD Letter.');
    }

    if (path.isAbsolute(odLetter.filePath)) {
      return odLetter.filePath;
    }

    return storageService.getFilePath(odLetter.filePath);
  }

  static async getMyODs(studentId: string) {
    return prisma.oDLetter.findMany({
      where: { studentId },
      include: {
        registration: {
          include: {
            event: {
              include: {
                club: { select: { name: true } },
              },
            },
          },
        },
      },
    });
  }

  static async getEventODs(eventId: string, userId: string, role: Role) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found.');

    const club = await prisma.club.findUnique({ where: { id: event.clubId } });
    const isCoordinator = club?.createdById === userId;

    const membership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: event.clubId, userId } }
    });
    const isLeader = membership?.role === 'LEADER' || membership?.role === 'CO_LEADER';

    if (
      event.organizerId !== userId &&
      !isCoordinator &&
      !isLeader &&
      role !== Role.ADMIN
    ) {
      throw new Error('Not authorized to view ODs for this event.');
    }

    return prisma.oDLetter.findMany({
      where: { eventId },
      include: {
        student: { select: { id: true, name: true, rollNumber: true, department: true } },
        faculty: { select: { name: true } },
      },
    });
  }

  static async getConsolidatedODPDF(eventId: string, userId: string, role: Role): Promise<Buffer> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: { select: { id: true, name: true } },
        club: { select: { name: true, createdById: true } },
        coHosts: { select: { userId: true } },
        approvals: {
          where: { approved: true },
          orderBy: { timestamp: 'desc' },
          take: 1,
          include: { coordinator: { select: { name: true } } },
        },
      },
    });

    if (!event) throw new Error('Event not found.');

    const isCoHost = event.coHosts.some((ch) => ch.userId === userId);
    const isDeptCreator = event.club.createdById === userId;
    if (
      event.organizerId !== userId &&
      !isCoHost &&
      !isDeptCreator &&
      role !== Role.HOD &&
      role !== Role.ADMIN
    ) {
      throw new Error('Not authorized to download OD letters for this event.');
    }

    if (event.status !== EventStatus.OD_GENERATED) {
      throw new Error('Consolidated OD letter is only available after HOD approval.');
    }

    // Fetch all checked in attendees
    const attendees = await prisma.attendance.findMany({
      where: { eventId },
      include: {
        registration: {
          include: {
            student: {
              select: {
                name: true,
                rollNumber: true,
                class: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: { registration: { student: { name: 'asc' } } },
    });

    const students = attendees.map((att) => ({
      name: att.registration.student.name,
      rollNumber: att.registration.student.rollNumber || 'N/A',
      class: att.registration.student.class || 'N/A',
      section: att.registration.student.section || 'N/A',
    }));

    const hodName = event.approvals[0]?.coordinator.name || 'Head of Department';
    
    // Import generateConsolidatedODPDFBuffer
    const { generateConsolidatedODPDFBuffer } = require('../../utils/pdf');

    const pdfBuffer = await generateConsolidatedODPDFBuffer({
      eventName: event.title,
      eventDate: event.date.toLocaleDateString(),
      eventDuration: event.duration.toString(),
      hostName: event.organizer.name,
      hodName,
      departmentName: event.club.name,
      students,
    });

    return pdfBuffer;
  }
}
