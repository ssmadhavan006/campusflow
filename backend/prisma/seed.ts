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

  const hod = await prisma.user.upsert({
    where: { email: 'hod@campusflow.com' },
    update: {},
    create: {
      email: 'hod@campusflow.com',
      passwordHash,
      name: 'Dr. Alan Turing',
      department: 'Computer Science',
      role: Role.HOD,
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
      class: 'III CSE',
      section: 'A',
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
      class: 'III CSE',
      section: 'B',
    },
  });

  console.log('Users seeded:', { admin: admin.email, hod: hod.email, faculty: faculty.email, student: student.email, volunteer: volunteer.email });

  const cseDept = await prisma.club.upsert({
    where: { name: 'Department of CSE' },
    update: {},
    create: {
      name: 'Department of CSE',
      description: 'Official Department of Computer Science and Engineering.',
      createdById: hod.id,
    },
  });

  console.log('Departments seeded:', cseDept.name);

  // Add Faculty as COORDINATOR
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: cseDept.id, userId: faculty.id } },
    update: {},
    create: {
      clubId: cseDept.id,
      userId: faculty.id,
      role: 'COORDINATOR',
    },
  });

  // Add Volunteer as MEMBER so they can scan CSE Department events
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: cseDept.id, userId: volunteer.id } },
    update: {},
    create: {
      clubId: cseDept.id,
      userId: volunteer.id,
      role: 'MEMBER',
    },
  });

  // Add Student as MEMBER so they belong to the CSE Department
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: cseDept.id, userId: student.id } },
    update: {},
    create: {
      clubId: cseDept.id,
      userId: student.id,
      role: 'MEMBER',
    },
  });

  console.log('Department members assigned.');
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
