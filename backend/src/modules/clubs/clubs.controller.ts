import { Request, Response, NextFunction } from 'express';
import { ClubsService } from './clubs.service';
import { z } from 'zod';
import { prisma } from '../../config/db';

export const CreateClubSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Club name must be at least 3 characters'),
    description: z.string().optional(),
  }),
});

export const JoinClubSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
    email: z.string().email('Invalid email').optional(),
    role: z.enum(['STUDENT', 'MEMBER', 'FACULTY', 'HOD', 'LEADER']).optional(),
  }),
});

export class ClubsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      const club = await ClubsService.createClub(name, description, req.user!.id);
      return res.status(201).json({ status: 'success', data: { club } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const clubs = await ClubsService.getClubs();
      return res.status(200).json({ status: 'success', data: { clubs } });
    } catch (error: any) {
      return next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const club = await ClubsService.getClub(req.params.id);
      return res.status(200).json({ status: 'success', data: { club } });
    } catch (error: any) {
      return res.status(404).json({ status: 'fail', message: error.message });
    }
  }

  static async join(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, email, role } = req.body;
      const clubId = req.params.id;
      const requesterId = req.user!.id;
      const requesterRole = req.user!.role;

      let targetUserId = userId;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        });
        if (!user) {
          return res.status(404).json({ status: 'fail', message: 'User not found. Ensure they have registered an account.' });
        }
        targetUserId = user.id;
      } else if (!targetUserId) {
        return res.status(400).json({ status: 'fail', message: 'Either email or userId is required.' });
      }

      // Fetch the club
      const club = await ClubsService.getClub(clubId);

      // Check if requester is coordinator or admin
      const isCoordinatorOrAdmin = club.createdById === requesterId || requesterRole === 'ADMIN';

      // Fetch requester's membership
      const requesterMembership = await prisma.clubMember.findUnique({
        where: { clubId_userId: { clubId, userId: requesterId } }
      });

      const isPrivileged = requesterMembership?.role === 'HOD' || requesterMembership?.role === 'FACULTY';

      // Requester must be coordinator, admin, or privileged member (HOD, Faculty)
      if (!isCoordinatorOrAdmin && !isPrivileged) {
        return res.status(403).json({ status: 'fail', message: 'Only the club coordinator, HOD, Faculty, or admin can add members.' });
      }

      // If assigning HOD or FACULTY, only coordinator or admin can do it
      if (role && (role === 'HOD' || role === 'FACULTY') && !isCoordinatorOrAdmin) {
        return res.status(403).json({ status: 'fail', message: 'Only the club coordinator or admin can assign HOD/Faculty roles.' });
      }

      const member = await ClubsService.joinClub(clubId, targetUserId, role);
      return res.status(201).json({ status: 'success', data: { member } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }
}
