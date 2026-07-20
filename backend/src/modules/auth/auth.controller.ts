import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';
import { verifyGoogleIdToken } from '../../utils/googleAuth';

export const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    rollNumber: z.string().optional(),
    department: z.string().optional(),
    class: z.string().optional(),
    section: z.string().optional(),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const GoogleLoginSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Google ID token is required'),
  }),
});

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth'
  });
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, rollNumber, department, class: classVal, section } = req.body;
      const user = await AuthService.register({
        email,
        passwordHash: password,
        name,
        rollNumber,
        department,
        class: classVal,
        section,
      });

      return res.status(201).json({
        status: 'success',
        data: { user },
      });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login(email, password);

      setRefreshTokenCookie(res, refreshToken);

      return res.status(200).json({
        status: 'success',
        data: {
          user,
          accessToken,
        },
      });
    } catch (error: any) {
      return res.status(401).json({ status: 'fail', message: error.message });
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const verified = await verifyGoogleIdToken(token);

      const { user, accessToken, refreshToken, isNewUser } = await AuthService.googleLogin(
        verified.email,
        verified.name
      );

      setRefreshTokenCookie(res, refreshToken);

      return res.status(200).json({
        status: 'success',
        data: {
          user,
          accessToken,
          isNewUser,
        },
      });
    } catch (error: any) {
      return res.status(401).json({ status: 'fail', message: error.message });
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth'
      });

      return res.status(200).json({
        status: 'success',
        message: 'Successfully logged out.',
      });
    } catch (error: any) {
      return next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const oldRefreshToken = req.cookies?.refreshToken;

      if (!oldRefreshToken) {
        return res.status(401).json({
          status: 'fail',
          message: 'Refresh token is missing.',
        });
      }

      const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(oldRefreshToken);

      setRefreshTokenCookie(res, newRefreshToken);

      return res.status(200).json({
        status: 'success',
        data: {
          accessToken,
        },
      });
    } catch (error: any) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth'
      });
      return res.status(401).json({
        status: 'fail',
        message: error.message,
      });
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({
        status: 'success',
        data: { user: req.user },
      });
    } catch (error: any) {
      return next(error);
    }
  }
}
