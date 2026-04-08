import { Request, Response, NextFunction } from 'express';
import { dashboardModel } from '../models/dashboardModel';
import { success, errorResponse } from '../utils/response';

export const dashboardController = {
  overall(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(dashboardModel.getOverallStats()));
    } catch (err) { next(err); }
  },

  project(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = dashboardModel.getProjectStats(Number(req.params.projectId));
      if (!stats) return res.status(404).json(errorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.'));
      res.json(success(stats));
    } catch (err) { next(err); }
  },
};
