import { Request, Response, NextFunction } from 'express';
import { ODService } from './od.service';
import fs from 'fs';

export class ODController {
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ODService.approveEventAndGenerateODs(req.params.eventId, req.user!.id);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async download(req: Request, res: Response, next: NextFunction) {
    try {
      const filePath = await ODService.getODLetterFilePath(
        req.params.verificationId,
        req.user!.id,
        req.user!.role
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ status: 'fail', message: 'PDF file not found on disk.' });
      }

      return res.download(filePath, `OD_${req.params.verificationId}.pdf`);
    } catch (error: any) {
      return res.status(403).json({ status: 'fail', message: error.message });
    }
  }

  static async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      const ods = await ODService.getMyODs(req.user!.id);
      return res.status(200).json({ status: 'success', data: { odLetters: ods } });
    } catch (error: any) {
      return next(error);
    }
  }

  static async getByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const ods = await ODService.getEventODs(req.params.eventId, req.user!.id, req.user!.role);
      return res.status(200).json({ status: 'success', data: { odLetters: ods } });
    } catch (error: any) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
  }

  static async downloadConsolidated(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await ODService.getConsolidatedODPDF(
        req.params.eventId,
        req.user!.id,
        req.user!.role
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=consolidated_od_${req.params.eventId}.pdf`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      return res.status(403).json({ status: 'fail', message: error.message });
    }
  }
}
