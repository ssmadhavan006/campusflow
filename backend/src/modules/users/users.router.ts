import { Router } from 'express';
import { UsersController, UpdateProfileSchema } from './users.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.put('/profile', validate(UpdateProfileSchema), UsersController.update);
router.get('/notifications', UsersController.getNotifications);
router.put('/notifications/:id/read', UsersController.readNotification);

export default router;
