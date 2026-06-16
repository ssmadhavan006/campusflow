import { Router } from 'express';
import {
  RegistrationsController,
  RegisterForEventSchema,
  VerifyPaymentSchema,
} from './registrations.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize([Role.STUDENT, Role.ADMIN]),
  validate(RegisterForEventSchema),
  RegistrationsController.register
);
router.get('/me', authenticate, authorize([Role.STUDENT, Role.ADMIN]), RegistrationsController.getMy);
router.get(
  '/event/:eventId',
  authenticate,
  authorize([Role.STUDENT, Role.FACULTY, Role.ADMIN]),
  RegistrationsController.getByEvent
);
router.put('/:id/cancel', authenticate, RegistrationsController.cancel);
router.post(
  '/:id/verify-payment',
  authenticate,
  validate(VerifyPaymentSchema),
  RegistrationsController.verifyPayment
);

export default router;
