import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export class ClubsService {
  static async createClub(name: string, description: string | undefined, createdById: string) {
    const existing = await prisma.club.findUnique({ where: { name } });
    if (existing) {
      throw new Error('Club name already exists.');
    }

    const club = await prisma.club.create({
      data: {
        name,
        description,
        createdById,
      },
    });

    await prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: createdById,
        role: 'LEADER',
      },
    });

    await logAudit(createdById, 'CLUB_CREATE', 'Club', club.id);

    return club;
  }

  static async getClubs() {
    return prisma.club.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, events: true } },
      },
    });
  }

  static async getClub(id: string) {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        events: true,
      },
    });

    if (!club) {
      throw new Error('Club not found.');
    }

    return club;
  }

  static async joinClub(clubId: string, userId: string, role: string = 'MEMBER') {
    const existing = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId } },
    });

    if (existing) {
      throw new Error('User is already a member of this club.');
    }

    const member = await prisma.clubMember.create({
      data: {
        clubId,
        userId,
        role,
      },
    });

    await logAudit(userId, 'CLUB_JOIN', 'ClubMember', member.id, { clubId });

    return member;
  }
}
