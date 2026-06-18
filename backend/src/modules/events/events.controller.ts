import { Request, Response, NextFunction } from 'express';
import { EventsService } from './events.service';
import { z } from 'zod';
import { EventStatus } from '@prisma/client';

export const CreateEventSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    date: z.string().datetime('Invalid ISO Date String'),
    duration: z.number().int().positive('Duration must be positive in minutes'),
    location: z.string().min(2, 'Location details are required'),
    capacity: z.number().int().positive('Capacity must be greater than 0'),
    isPaid: z.boolean(),
    price: z.number().nonnegative('Price cannot be negative').optional(),
    clubId: z.string().uuid('Invalid Club ID'),
    poster: z.string().optional(),
  }),
});

export const UpdateEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    date: z.string().datetime().optional(),
    duration: z.number().int().positive().optional(),
    location: z.string().min(2).optional(),
    capacity: z.number().int().positive().optional(),
    isPaid: z.boolean().optional(),
    price: z.number().nonnegative().optional(),
    poster: z.string().optional(),
  }),
});

export const ApproveEventSchema = z.object({
  body: z.object({
    approved: z.boolean(),
    comments: z.string().max(250).optional(),
  }),
});

export const AddCoHostSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const ChangeStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED',
      'REGISTRATION_CLOSED',
      'ONGOING',
      'COMPLETED',
      'ATTENDANCE_VERIFIED',
      'OD_GENERATED'
    ]),
  }),
});

export class EventsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventsService.createEvent({
        ...req.body,
        date: new Date(req.body.date),
        organizerId: req.user!.id,
      });

      return res.status(201).json({ status: 'success', data: { event } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      if (data.date) data.date = new Date(data.date);

      const event = await EventsService.updateEvent(
        req.params.id,
        req.user!.id,
        req.user!.role,
        data
      );

      return res.status(200).json({ status: 'success', data: { event } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventsService.submitForApproval(req.params.id, req.user!.id);
      return res.status(200).json({ status: 'success', data: { event } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { approved, comments } = req.body;
      const event = await EventsService.reviewEvent(req.params.id, req.user!.id, approved, comments);
      return res.status(200).json({ status: 'success', data: { event } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async addCoHost(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const coHost = await EventsService.assignCoHost(
        req.params.id,
        email,
        req.user!.id,
        req.user!.role
      );
      return res.status(200).json({ status: 'success', data: { coHost } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const event = await EventsService.updateStatus(
        req.params.id,
        req.user!.id,
        req.user!.role,
        status as EventStatus
      );
      return res.status(200).json({ status: 'success', data: { event } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as EventStatus | undefined;
      const clubId = req.query.clubId as string | undefined;
      const onlyManage = req.query.onlyManage === 'true';

      const events = await EventsService.getEvents({
        status,
        clubId,
        role: req.user?.role,
        userId: req.user?.id,
        onlyManage,
      });

      return res.status(200).json({ status: 'success', data: { events } });
    } catch (error: any) {
      return next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventsService.getEventById(req.params.id, req.user!.id, req.user!.role);
      return res.status(200).json({ status: 'success', data: { event } });
    } catch (error: any) {
      return res.status(404).json({ status: 'fail', message: error.message });
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await EventsService.deleteEvent(req.params.id, req.user!.id);
      return res.status(200).json({ status: 'success', message: 'Event successfully removed.' });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }
}
