import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './modules/auth/auth.router';
import userRoutes from './modules/users/users.router';
import clubRoutes from './modules/clubs/clubs.router';
import eventRoutes from './modules/events/events.router';
import registrationRoutes from './modules/registrations/registrations.router';
import attendanceRoutes from './modules/attendance/attendance.router';
import odRoutes from './modules/od/od.router';
import adminRoutes from './modules/admin/admin.router';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

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

app.use(errorHandler);

export default app;
