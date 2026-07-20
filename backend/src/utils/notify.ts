import { prisma } from '../config/db';
import { sendEmail } from './email';
import { emitToUser } from '../realtime/socket';

interface NotifyOptions {
  /** Send an email in addition to the in-app notification (subject to user preference). Default false. */
  email?: boolean;
}

/** Escapes HTML special characters to prevent markup/link injection in emails. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Creates a persistent notification, pushes it in real-time over the socket
 * connection, and optionally emails the user (if they have email
 * notifications enabled).
 */
export async function notifyUser(userId: string, title: string, message: string, options: NotifyOptions = {}) {
  const notification = await prisma.notification.create({
    data: { userId, title, message },
  });

  emitToUser(userId, 'notification:new', notification);

  if (options.email) {
    // Fire-and-forget: never let slow/unavailable SMTP delivery block the
    // calling request (registration, payment, attendance, etc.).
    (async () => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, emailNotificationsEnabled: true },
        });

        if (user?.emailNotificationsEnabled) {
          await sendEmail(user.email, title, message, `<p>Hi ${escapeHtml(user.name)},</p><p>${escapeHtml(message)}</p>`);
        }
      } catch (err) {
        console.error(`[NOTIFY_EMAIL_ERROR] Failed to email user ${userId}:`, err);
      }
    })().catch(err => {
      console.error('[NOTIFY_FATAL] Unexpected error in notification email dispatch:', err);
    });
  }

  return notification;
}
