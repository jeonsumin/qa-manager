import { Request, Response, NextFunction } from 'express';
import { issueModel } from '../models/issueModel';
import { success, successList, errorResponse } from '../utils/response';

export const issueController = {
  list(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.projectId);
      const { status, severity, keyword, page, limit } = req.query;
      const { data, total } = issueModel.findAll(projectId, {
        status: status as string, severity: severity as string,
        keyword: keyword as string, page: Number(page) || 1, limit: Number(limit) || 20,
      });
      const p = Number(page) || 1, l = Number(limit) || 20;
      res.json(successList(data, { page: p, limit: l, total, totalPages: Math.ceil(total / l) }));
    } catch (err) { next(err); }
  },

  get(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = issueModel.findById(Number(req.params.id));
      if (!issue) return res.status(404).json(errorResponse('NOT_FOUND', '이슈를 찾을 수 없습니다.'));
      res.json(success(issue));
    } catch (err) { next(err); }
  },

  create(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.projectId);
      if (!req.body.title) return res.status(400).json(errorResponse('VALIDATION_ERROR', '제목은 필수입니다.'));
      const issue = issueModel.create(projectId, req.body);
      res.status(201).json(success(issue));
    } catch (err) { next(err); }
  },

  update(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = issueModel.findById(Number(req.params.id));
      if (!issue) return res.status(404).json(errorResponse('NOT_FOUND', '이슈를 찾을 수 없습니다.'));
      res.json(success(issueModel.update(Number(req.params.id), req.body)));
    } catch (err) { next(err); }
  },

  remove(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = issueModel.findById(Number(req.params.id));
      if (!issue) return res.status(404).json(errorResponse('NOT_FOUND', '이슈를 찾을 수 없습니다.'));
      issueModel.delete(Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
