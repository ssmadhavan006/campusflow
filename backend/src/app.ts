import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './modules/auth/auth.router';
import userRoutes from './modules/users/users.router';
import clubRoutes from './modules/clubs/clubs.router';
import eventRoutes from './modules/events/events.router';
import registrationRoutes from './modules/registrations/registrations.router';
import attendanceRoutes from './modules/attendance/attendance.router';
import odRoutes from './modules/od/od.router';
import adminRoutes from './modules/admin/admin.router';

import { authenticate, authenticateStatic } from './middleware/auth.middleware';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/uploads', authenticateStatic, express.static(path.resolve(env.UPLOAD_DIR)));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/od', odRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use('*', (req, res) => {
  res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

export default app;
