import { Router } from 'express';
import { AuthController, RegisterSchema, LoginSchema, GoogleLoginSchema } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authRateLimiter, validate(RegisterSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(LoginSchema), AuthController.login);
router.post('/google-login', authRateLimiter, validate(GoogleLoginSchema), AuthController.googleLogin);
router.post('/logout', authRateLimiter, AuthController.logout);
router.post('/refresh', authRateLimiter, AuthController.refresh);
router.get('/me', authenticate, AuthController.getMe);

export default router;
