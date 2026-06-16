import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export class UsersService {
  static async updateProfile(
    userId: string,
    data: Partial<{ name: string; rollNumber: string; department: string }>
  ) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        rollNumber: true,
        department: true,
        role: true,
        clubMembers: {
          select: {
            clubId: true,
            role: true
          }
        }
      },
    });

    await logAudit(userId, 'USER_UPDATE_PROFILE', 'User', userId, data);

    return updated;
  }

  static async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async markNotificationAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new Error('Notification not found.');
    if (notification.userId !== userId) throw new Error('Not authorized.');

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }
}
