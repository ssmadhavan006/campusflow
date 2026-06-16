import { Router } from 'express';
import { ClubsController, CreateClubSchema, JoinClubSchema } from './clubs.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', authenticate, authorize([Role.ADMIN, Role.FACULTY]), validate(CreateClubSchema), ClubsController.create);
router.get('/', authenticate, ClubsController.getAll);
router.get('/:id', authenticate, ClubsController.getOne);
router.post('/:id/join', authenticate, authorize([Role.ADMIN, Role.FACULTY, Role.STUDENT]), validate(JoinClubSchema), ClubsController.join);

export default router;
