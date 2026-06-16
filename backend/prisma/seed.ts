import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@campusflow.com' },
    update: {},
    create: {
      email: 'admin@campusflow.com',
      passwordHash,
      name: 'System Administrator',
      role: Role.ADMIN,
    },
  });

  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@campusflow.com' },
    update: {},
    create: {
      email: 'faculty@campusflow.com',
      passwordHash,
      name: 'Dr. Jane Coordinator',
      department: 'Computer Science',
      role: Role.FACULTY,
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@campusflow.com' },
    update: {},
    create: {
      email: 'organizer@campusflow.com',
      passwordHash,
      name: 'John ClubLead',
      role: Role.STUDENT,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@campusflow.com' },
    update: {},
    create: {
      email: 'student@campusflow.com',
      passwordHash,
      name: 'Alex Student',
      rollNumber: 'CS2026001',
      department: 'Computer Science',
      role: Role.STUDENT,
    },
  });

  const volunteer = await prisma.user.upsert({
    where: { email: 'volunteer@campusflow.com' },
    update: {},
    create: {
      email: 'volunteer@campusflow.com',
      passwordHash,
      name: 'Sarah Scanner',
      role: Role.STUDENT,
    },
  });

  console.log('Users seeded:', { admin: admin.email, faculty: faculty.email, organizer: organizer.email, student: student.email, volunteer: volunteer.email });

  const codingClub = await prisma.club.upsert({
    where: { name: 'Coding Club' },
    update: {},
    create: {
      name: 'Coding Club',
      description: 'The official programming and computer science club.',
      createdById: faculty.id,
    },
  });

  console.log('Clubs seeded:', codingClub.name);

  // Add Faculty Coordinator as COORDINATOR
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: codingClub.id, userId: faculty.id } },
    update: {},
    create: {
      clubId: codingClub.id,
      userId: faculty.id,
      role: 'COORDINATOR',
    },
  });

  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: codingClub.id, userId: organizer.id } },
    update: {},
    create: {
      clubId: codingClub.id,
      userId: organizer.id,
      role: 'LEADER',
    },
  });

  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: codingClub.id, userId: student.id } },
    update: {},
    create: {
      clubId: codingClub.id,
      userId: student.id,
      role: 'MEMBER',
    },
  });

  console.log('Club members assigned.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
