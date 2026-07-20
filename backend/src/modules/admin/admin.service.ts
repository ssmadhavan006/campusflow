import { prisma } from '../../config/db';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit';

export class AdminService {
  static async getUsers(page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          rollNumber: true,
          department: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page };
  }

  static async updateUserRole(userId: string, newRole: Role, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, email: true, name: true, role: true },
    });

    await logAudit(adminId, 'ADMIN_UPDATE_USER_ROLE', 'User', userId, { oldRole: user.role, newRole });

    return updated;
  }

  static async getAuditLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);
    return { auditLogs: logs, total, page };
  }
}
