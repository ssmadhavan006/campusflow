import { Router } from 'express';
import {
  EventsController,
  CreateEventSchema,
  UpdateEventSchema,
  ApproveEventSchema,
  ChangeStatusSchema,
  AddCoHostSchema,
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
  authorize([Role.FACULTY, Role.HOD, Role.ADMIN]),
  validate(CreateEventSchema),
  EventsController.create
);
router.put(
  '/:id',
  authenticate,
  authorize([Role.FACULTY, Role.HOD, Role.ADMIN]),
  validate(UpdateEventSchema),
  EventsController.update
);
router.post(
  '/:id/submit',
  authenticate,
  authorize([Role.FACULTY, Role.HOD, Role.ADMIN]),
  EventsController.submit
);
router.post(
  '/:id/approve',
  authenticate,
  authorize([Role.HOD, Role.ADMIN]),
  validate(ApproveEventSchema),
  EventsController.approve
);
router.post(
  '/:id/co-hosts',
  authenticate,
  authorize([Role.FACULTY, Role.HOD, Role.ADMIN]),
  validate(AddCoHostSchema),
  EventsController.addCoHost
);
router.put(
  '/:id/status',
  authenticate,
  authorize([Role.FACULTY, Role.HOD, Role.ADMIN]),
  validate(ChangeStatusSchema),
  EventsController.changeStatus
);

router.delete(
  '/:id',
  authenticate,
  authorize([Role.ADMIN]),
  EventsController.delete
);

export default router;
