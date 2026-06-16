import { prisma } from '../../config/db';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit';

export class AdminService {
  static async getUsers() {
    return prisma.user.findMany({
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
    });
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

  static async getAuditLogs() {
    return prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
