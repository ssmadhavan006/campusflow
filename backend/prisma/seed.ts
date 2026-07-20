import { PrismaClient, Role } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  console.log('Clearing old seeds and users...');
  
  // Clean up all tables to prevent foreign key constraint violations
  await prisma.attendance.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.clubMember.deleteMany({});
  await prisma.club.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  
  // Delete the old email/password test users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'admin@campusflow.com',
          'faculty@campusflow.com',
          'hod@campusflow.com',
          'student@campusflow.com',
          'volunteer@campusflow.com'
        ]
      }
    }
  });

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  // Bootstrap admin accounts configured via ADMIN_EMAILS.
  if (env.ADMIN_EMAILS.length === 0) {
    console.warn('[SEED WARNING] ADMIN_EMAILS is not set. No admin user seeded.');
  }
  for (const adminEmail of env.ADMIN_EMAILS) {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: Role.ADMIN,
        isVerified: true
      },
      create: {
        email: adminEmail,
        passwordHash,
        name: 'Admin',
        role: Role.ADMIN,
        isVerified: true,
        department: 'Computer Science',
      },
    });

    console.log('Admin user seeded:', admin.email);
  }

  const cseDept = await prisma.club.upsert({
    where: { name: 'Department of CSE' },
    update: {},
    create: {
      name: 'Department of CSE',
      description: 'Official Department of Computer Science and Engineering.',
      createdById: admin.id,
    },
  });

  console.log('Departments seeded:', cseDept.name);

  // Add Admin as COORDINATOR of Department of CSE
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: cseDept.id, userId: admin.id } },
    update: {},
    create: {
      clubId: cseDept.id,
      userId: admin.id,
      role: 'COORDINATOR',
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
