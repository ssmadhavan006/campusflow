import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';
import { z } from 'zod';
import { prisma } from '../../config/db';

export const AssignVolunteerSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid User ID').optional(),
    email: z.string().email('Invalid email').optional(),
  }),
});

export const ScanAttendanceSchema = z.object({
  body: z.object({
    qrToken: z.string().min(10, 'QR Token is too short'),
    deviceId: z.string().optional(),
  }),
});

export class AttendanceController {
  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, email } = req.body;
      let targetUserId = userId;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        });
        if (!user) {
          return res.status(404).json({ status: 'fail', message: 'User not found. Ensure they have registered an account.' });
        }
        targetUserId = user.id;
      } else if (!targetUserId) {
        return res.status(400).json({ status: 'fail', message: 'Either email or userId is required.' });
      }
      const volunteer = await AttendanceService.assignVolunteer(req.params.eventId, targetUserId, req.user!.id);
      return res.status(201).json({ status: 'success', data: { volunteer } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async scan(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrToken, deviceId } = req.body;
      const attendance = await AttendanceService.scanAttendance(qrToken, req.user!.id, deviceId);
      return res.status(201).json({ status: 'success', data: { attendance } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await AttendanceService.getAttendanceStats(req.params.eventId, req.user!.id, req.user!.role);
      return res.status(200).json({ status: 'success', data: { attendance: logs } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }
}
