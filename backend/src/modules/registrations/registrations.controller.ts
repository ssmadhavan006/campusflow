import { Request, Response, NextFunction } from 'express';
import { RegistrationsService } from './registrations.service';
import { z } from 'zod';
import { PaymentStatus } from '@prisma/client';

export const RegisterForEventSchema = z.object({
  body: z.object({
    eventId: z.string().uuid('Invalid Event ID'),
  }),
});

export const VerifyPaymentSchema = z.object({
  body: z.object({
    reference: z.string().min(5, 'Reference string must be at least 5 characters'),
    status: z.enum(['PAID', 'FAILED', 'REFUNDED']),
  }),
});

export class RegistrationsController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.body;
      const reg = await RegistrationsService.registerForEvent(eventId, req.user!.id);
      return res.status(201).json({ status: 'success', data: { registration: reg } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const reg = await RegistrationsService.cancelRegistration(req.params.id, req.user!.id, req.user!.role);
      return res.status(200).json({ status: 'success', data: { registration: reg } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async getByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await RegistrationsService.getRegistrationsByEvent(req.params.eventId, req.user!.id, req.user!.role);
      return res.status(200).json({ status: 'success', data: { registrations: list } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await RegistrationsService.getMyRegistrations(req.user!.id, page, limit);
      return res.status(200).json({ status: 'success', data: { registrations: result.registrations, total: result.total, page: result.page } });
    } catch (error: any) {
      return next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { reference, status } = req.body;
      const reg = await RegistrationsService.verifyPayment(
        req.params.id,
        reference,
        status as PaymentStatus,
        req.user!.id,
        req.user!.role
      );
      return res.status(200).json({ status: 'success', data: { registration: reg } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }
}
