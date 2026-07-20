import { describe, it, expect } from '@jest/globals';
import { PrismaClient, Role, RegistrationStatus, EventStatus } from '@prisma/client';
import { RegistrationsService } from '../modules/registrations/registrations.service';

const prisma = new PrismaClient();

describe('Registration Concurrency Lock Test', () => {
  it('should prevent overselling by waitlisting concurrent overflow requests', async () => {
    const organizer = await prisma.user.create({
      data: {
        email: `test-org-${Date.now()}@campusflow.com`,
        passwordHash: 'dummy',
        name: 'Test Organizer',
        role: Role.FACULTY,
        isVerified: true,
      },
    });

    const club = await prisma.club.create({
      data: {
        name: `Test Club ${Date.now()}`,
        createdById: organizer.id,
      },
    });

    const event = await prisma.event.create({
      data: {
        title: 'Concurrency Test Event',
        description: 'Capacity is restricted to 5 seats.',
        date: new Date(),
        duration: 60,
        location: 'Main Aud',
        capacity: 5,
        remainingSeats: 5,
        status: EventStatus.APPROVED,
        organizerId: organizer.id,
        clubId: club.id,
      },
    });

    const students = await Promise.all(
      Array.from({ length: 50 }).map((_, i) =>
        prisma.user.create({
          data: {
            email: `test-student-${i}-${Date.now()}@campusflow.com`,
            passwordHash: 'dummy',
            name: `Student ${i}`,
            role: Role.STUDENT,
            isVerified: true,
          },
        })
      )
    );

    const results = await Promise.allSettled(
      students.map((student) =>
        RegistrationsService.registerForEvent(event.id, student.id)
      )
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    const dbRegistrations = await prisma.registration.findMany({
      where: { eventId: event.id },
    });

    const activeRegs = dbRegistrations.filter((r) => r.status === RegistrationStatus.ACTIVE);
    const waitlistRegs = dbRegistrations.filter((r) => r.status === RegistrationStatus.WAITLISTED);

    const updatedEvent = await prisma.event.findUnique({ where: { id: event.id } });

    // Clean up
    await prisma.registration.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
    await prisma.club.delete({ where: { id: club.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [organizer.id, ...students.map((s) => s.id)] },
      },
    });

    // Assertions
    expect(fulfilled.length).toBe(50);
    expect(rejected.length).toBe(0);
    expect(activeRegs.length).toBe(5);
    expect(waitlistRegs.length).toBe(45);
    expect(updatedEvent?.remainingSeats).toBe(0);
  });

});
