import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let io: SocketIOServer | null = null;

const ipConnectionCount = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 10;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required.'));
      }
      const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as { userId: string };
      socket.userId = decoded.userId;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const ip = socket.handshake.address;
    const currentCount = ipConnectionCount.get(ip) || 0;
    if (currentCount >= MAX_CONNECTIONS_PER_IP) {
      socket.disconnect(true);
      return;
    }
    ipConnectionCount.set(ip, currentCount + 1);

    socket.on('disconnect', () => {
      const count = ipConnectionCount.get(ip) || 1;
      if (count <= 1) {
        ipConnectionCount.delete(ip);
      } else {
        ipConnectionCount.set(ip, count - 1);
      }
    });

    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('event:join', (eventId: string) => {
      if (typeof eventId === 'string' && uuidRegex.test(eventId)) {
        socket.join(`event:${eventId}`);
      }
    });

    socket.on('event:leave', (eventId: string) => {
      if (typeof eventId === 'string' && uuidRegex.test(eventId)) {
        socket.leave(`event:${eventId}`);
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToEvent(eventId: string, event: string, payload: unknown) {
  io?.to(`event:${eventId}`).emit(event, payload);
}
