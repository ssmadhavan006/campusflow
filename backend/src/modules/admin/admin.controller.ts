import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { z } from 'zod';
import { Role } from '@prisma/client';

export const UpdateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  }),
});

export class AdminController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await AdminService.getUsers();
      return res.status(200).json({ status: 'success', data: { users } });
    } catch (error: any) {
      return next(error);
    }
  }

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const user = await AdminService.updateUserRole(req.params.userId, role as Role, req.user!.id);
      return res.status(200).json({ status: 'success', data: { user } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await AdminService.getAuditLogs();
      return res.status(200).json({ status: 'success', data: { auditLogs: logs } });
    } catch (error: any) {
      return next(error);
    }
  }
}
