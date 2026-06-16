import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    rollNumber: z.string().optional(),
    department: z.string().optional(),
  }),
});

export class UsersController {
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.updateProfile(req.user!.id, req.body);
      return res.status(200).json({ status: 'success', data: { user } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await UsersService.getNotifications(req.user!.id);
      return res.status(200).json({ status: 'success', data: { notifications: list } });
    } catch (error: any) {
      return next(error);
    }
  }

  static async readNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await UsersService.markNotificationAsRead(req.params.id, req.user!.id);
      return res.status(200).json({ status: 'success', data: { notification } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }
}
