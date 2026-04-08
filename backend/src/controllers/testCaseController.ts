import { Request, Response, NextFunction } from 'express';
import { testCaseModel } from '../models/testCaseModel';
import { success, successList, errorResponse } from '../utils/response';

export const testCaseController = {
  list(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.projectId);
      const { category, priority, keyword, page, limit } = req.query;
      const { data, total } = testCaseModel.findAll(projectId, {
        category: category as string, priority: priority as string,
        keyword: keyword as string, page: Number(page) || 1, limit: Number(limit) || 20,
      });
      const p = Number(page) || 1, l = Number(limit) || 20;
      res.json(successList(data, { page: p, limit: l, total, totalPages: Math.ceil(total / l) }));
    } catch (err) { next(err); }
  },

  get(req: Request, res: Response, next: NextFunction) {
    try {
      const tc = testCaseModel.findById(Number(req.params.id));
      if (!tc) return res.status(404).json(errorResponse('NOT_FOUND', '테스트 케이스를 찾을 수 없습니다.'));
      res.json(success(tc));
    } catch (err) { next(err); }
  },

  create(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.projectId);
      if (!req.body.title) return res.status(400).json(errorResponse('VALIDATION_ERROR', '제목은 필수입니다.'));
      const tc = testCaseModel.create(projectId, req.body);
      res.status(201).json(success(tc));
    } catch (err) { next(err); }
  },

  update(req: Request, res: Response, next: NextFunction) {
    try {
      const tc = testCaseModel.findById(Number(req.params.id));
      if (!tc) return res.status(404).json(errorResponse('NOT_FOUND', '테스트 케이스를 찾을 수 없습니다.'));
      res.json(success(testCaseModel.update(Number(req.params.id), req.body)));
    } catch (err) { next(err); }
  },

  remove(req: Request, res: Response, next: NextFunction) {
    try {
      const tc = testCaseModel.findById(Number(req.params.id));
      if (!tc) return res.status(404).json(errorResponse('NOT_FOUND', '테스트 케이스를 찾을 수 없습니다.'));
      testCaseModel.delete(Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  },

  categories(req: Request, res: Response, next: NextFunction) {
    try {
      const cats = testCaseModel.getCategories(Number(req.params.projectId));
      res.json(success(cats));
    } catch (err) { next(err); }
  },
};
