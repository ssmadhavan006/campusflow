import { Router } from 'express';
import { AdminController, UpdateRoleSchema } from './admin.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Secure all admin routes
router.use(authenticate);
router.use(authorize([Role.ADMIN]));

router.get('/users', AdminController.getUsers);
router.put('/users/:userId/role', validate(UpdateRoleSchema), AdminController.updateRole);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
