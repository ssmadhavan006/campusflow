import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { z } from 'zod';
import { Role } from '@prisma/client';

export const UpdateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['STUDENT', 'FACULTY', 'HOD', 'ADMIN']),
  }),
});

export class AdminController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const search = req.query.search as string | undefined;
      const result = await AdminService.getUsers(page, limit, search);
      return res.status(200).json({ status: 'success', data: { users: result.users, total: result.total, page: result.page } });
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
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await AdminService.getAuditLogs(page, limit);
      return res.status(200).json({ status: 'success', data: { auditLogs: result.auditLogs, total: result.total, page: result.page } });
    } catch (error: any) {
      return next(error);
    }
  }
}
