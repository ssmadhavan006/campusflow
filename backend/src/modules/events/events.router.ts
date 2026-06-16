import { Router } from 'express';
import {
  EventsController,
  CreateEventSchema,
  UpdateEventSchema,
  ApproveEventSchema,
  ChangeStatusSchema,
} from './events.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, EventsController.getAll);
router.get('/:id', authenticate, EventsController.getOne);
router.post(
  '/',
  authenticate,
  authorize([Role.STUDENT, Role.FACULTY, Role.ADMIN]),
  validate(CreateEventSchema),
  EventsController.create
);
router.put(
  '/:id',
  authenticate,
  authorize([Role.STUDENT, Role.FACULTY, Role.ADMIN]),
  validate(UpdateEventSchema),
  EventsController.update
);
router.post(
  '/:id/submit',
  authenticate,
  authorize([Role.STUDENT, Role.FACULTY, Role.ADMIN]),
  EventsController.submit
);
router.post(
  '/:id/approve',
  authenticate,
  authorize([Role.FACULTY, Role.ADMIN]),
  validate(ApproveEventSchema),
  EventsController.approve
);
router.put(
  '/:id/status',
  authenticate,
  authorize([Role.STUDENT, Role.FACULTY, Role.ADMIN]),
  validate(ChangeStatusSchema),
  EventsController.changeStatus
);

export default router;
