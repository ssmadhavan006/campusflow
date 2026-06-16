import { PrismaClient, Role, RegistrationStatus, EventStatus } from '@prisma/client';
import { RegistrationsService } from '../modules/registrations/registrations.service';

const prisma = new PrismaClient();

async function runConcurrencyTest() {
  console.log('[TEST] Starting Registration Concurrency Test...');

  const organizer = await prisma.user.create({
    data: {
      email: `test-org-${Date.now()}@campusflow.com`,
      passwordHash: 'dummy',
      name: 'Test Organizer',
      role: Role.FACULTY,
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

  console.log('[TEST] Generating 50 mock student accounts...');
  const students = await Promise.all(
    Array.from({ length: 50 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `test-student-${i}-${Date.now()}@campusflow.com`,
          passwordHash: 'dummy',
          name: `Student ${i}`,
          role: Role.STUDENT,
        },
      })
    )
  );

  console.log('[TEST] Firing 50 simultaneous registration requests...');
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

  console.log('\n--- CONCURRENCY TEST SUMMARY ---');
  console.log(`Simultaneous Requests: 50`);
  console.log(`Successful Registrations: ${fulfilled.length}`);
  console.log(`Rejected Requests: ${rejected.length}`);
  console.log(`Active registrations in DB (Expected 5): ${activeRegs.length}`);
  console.log(`Waitlisted registrations in DB (Expected 45): ${waitlistRegs.length}`);

  const updatedEvent = await prisma.event.findUnique({ where: { id: event.id } });
  console.log(`Final remainingSeats in Event DB (Expected 0): ${updatedEvent?.remainingSeats}`);
  console.log('--------------------------------\n');

  const success =
    activeRegs.length === 5 &&
    waitlistRegs.length === 45 &&
    updatedEvent?.remainingSeats === 0;

  if (success) {
    console.log('[TEST SUCCESS] Database transaction row lock successfully prevented overselling!');
  } else {
    console.error('[TEST FAILURE] Capacity check failed! Concurrency issue detected.');
  }

  console.log('[TEST] Cleaning up test database records...');
  await prisma.registration.deleteMany({ where: { eventId: event.id } });
  await prisma.event.delete({ where: { id: event.id } });
  await prisma.club.delete({ where: { id: club.id } });
  await prisma.user.deleteMany({
    where: {
      id: { in: [organizer.id, ...students.map((s) => s.id)] },
    },
  });

  console.log('[TEST] Cleanup completed.');
  process.exit(success ? 0 : 1);
}

runConcurrencyTest().catch((err) => {
  console.error('[TEST FATAL] Concurrency test crashed:', err);
  process.exit(1);
});
