import { Router } from 'express';
import {
  AttendanceController,
  AssignVolunteerSchema,
  ScanAttendanceSchema,
} from './attendance.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post(
  '/scan',
  authenticate,
  authorize([Role.STUDENT, Role.FACULTY, Role.ADMIN]),
  validate(ScanAttendanceSchema),
  AttendanceController.scan
);
router.post(
  '/events/:eventId/volunteers',
  authenticate,
  authorize([Role.STUDENT, Role.FACULTY, Role.ADMIN]),
  validate(AssignVolunteerSchema),
  AttendanceController.assign
);
router.get(
  '/event/:eventId',
  authenticate,
  authorize([Role.STUDENT, Role.FACULTY, Role.ADMIN]),
  AttendanceController.getStats
);

export default router;
