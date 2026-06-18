import { Router } from 'express';
import { ODController } from './od.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post(
  '/approve-event/:eventId',
  authenticate,
  authorize([Role.HOD, Role.ADMIN]),
  ODController.approve
);
router.get('/download/:verificationId', authenticate, ODController.download);
router.get('/me', authenticate, authorize([Role.STUDENT, Role.ADMIN]), ODController.getMy);
router.get(
  '/event/:eventId',
  authenticate,
  authorize([Role.FACULTY, Role.HOD, Role.ADMIN]),
  ODController.getByEvent
);
router.get(
  '/event/:eventId/consolidated',
  authenticate,
  authorize([Role.FACULTY, Role.HOD, Role.ADMIN]),
  ODController.downloadConsolidated
);

export default router;
