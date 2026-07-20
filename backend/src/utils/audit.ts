import { prisma } from '../config/db';

export const logAudit = async (
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, any>
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error(`[AUDIT_ERROR] Failed to write audit log for action="${action}" entityType="${entityType}" entityId="${entityId}":`, error);
  }
};
