import { Request, Response, NextFunction } from 'express';
import { testRunModel } from '../models/testRunModel';
import { success, successList, errorResponse } from '../utils/response';

export const testRunController = {
  list(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.projectId);
      const { status, page, limit } = req.query;
      const { data, total } = testRunModel.findAll(projectId, {
        status: status as string, page: Number(page) || 1, limit: Number(limit) || 20,
      });
      const p = Number(page) || 1, l = Number(limit) || 20;
      res.json(successList(data, { page: p, limit: l, total, totalPages: Math.ceil(total / l) }));
    } catch (err) { next(err); }
  },

  get(req: Request, res: Response, next: NextFunction) {
    try {
      const run = testRunModel.findById(Number(req.params.id));
      if (!run) return res.status(404).json(errorResponse('NOT_FOUND', '테스트런을 찾을 수 없습니다.'));
      res.json(success(run));
    } catch (err) { next(err); }
  },

  create(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.projectId);
      const { name, testCaseIds } = req.body;
      if (!name) return res.status(400).json(errorResponse('VALIDATION_ERROR', '테스트런 이름은 필수입니다.'));
      if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0)
        return res.status(400).json(errorResponse('VALIDATION_ERROR', '테스트 케이스를 1개 이상 선택해야 합니다.'));
      const run = testRunModel.create(projectId, req.body);
      res.status(201).json(success(run));
    } catch (err) { next(err); }
  },

  update(req: Request, res: Response, next: NextFunction) {
    try {
      const run = testRunModel.findById(Number(req.params.id));
      if (!run) return res.status(404).json(errorResponse('NOT_FOUND', '테스트런을 찾을 수 없습니다.'));
      res.json(success(testRunModel.update(Number(req.params.id), req.body)));
    } catch (err) { next(err); }
  },

  remove(req: Request, res: Response, next: NextFunction) {
    try {
      const run = testRunModel.findById(Number(req.params.id));
      if (!run) return res.status(404).json(errorResponse('NOT_FOUND', '테스트런을 찾을 수 없습니다.'));
      testRunModel.delete(Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  },

  updateResult(req: Request, res: Response, next: NextFunction) {
    try {
      const resultId = Number(req.params.resultId);
      const { status, comment } = req.body;
      const validStatuses = ['pass', 'fail', 'blocked', 'not-run'];
      if (!status || !validStatuses.includes(status))
        return res.status(400).json(errorResponse('VALIDATION_ERROR', `status는 ${validStatuses.join('|')} 중 하나여야 합니다.`));
      const existing = testRunModel.findResultById(resultId);
      if (!existing) return res.status(404).json(errorResponse('NOT_FOUND', '결과를 찾을 수 없습니다.'));
      const result = testRunModel.updateResult(resultId, { status, comment });
      res.json(success(result));
    } catch (err) { next(err); }
  },
};
