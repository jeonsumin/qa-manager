import { Request, Response, NextFunction } from 'express';
import { bugReportModel } from '../models/bugReportModel';
import { issueModel } from '../models/issueModel';
import { success, successList, errorResponse } from '../utils/response';

export const bugReportController = {
  list(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.projectId);
      const { status, page, limit } = req.query;
      const p = Number(page) || 1;
      const l = Number(limit) || 20;
      const { data, total } = bugReportModel.findAll(projectId, {
        status: status as string,
        page: p,
        limit: l,
      });
      res.json(successList(data, { page: p, limit: l, total, totalPages: Math.ceil(total / l) }));
    } catch (err) {
      next(err);
    }
  },

  get(req: Request, res: Response, next: NextFunction) {
    try {
      const report = bugReportModel.findById(Number(req.params.id));
      if (!report) {
        return res.status(404).json(errorResponse('NOT_FOUND', '버그 리포트를 찾을 수 없습니다.'));
      }
      res.json(success(report));
    } catch (err) {
      next(err);
    }
  },

  receive(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, sessionId, title, description, lastError, breadcrumbs, recentNetworks, env, screenshot } =
        req.body;

      if (!projectId) {
        return res.status(400).json(errorResponse('VALIDATION_ERROR', 'projectId는 필수입니다.'));
      }

      const report = bugReportModel.create(Number(projectId), {
        sessionId,
        title,
        description,
        lastError,
        breadcrumbs,
        recentNetworks,
        env,
        screenshot,
      });
      res.status(201).json(success(report));
    } catch (err) {
      next(err);
    }
  },

  update(req: Request, res: Response, next: NextFunction) {
    try {
      const report = bugReportModel.findById(Number(req.params.id));
      if (!report) {
        return res.status(404).json(errorResponse('NOT_FOUND', '버그 리포트를 찾을 수 없습니다.'));
      }
      const { status, description } = req.body;
      const updated = bugReportModel.update(Number(req.params.id), { status, description });
      res.json(success(updated));
    } catch (err) {
      next(err);
    }
  },

  convertToIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.projectId);
      const reportId = Number(req.params.id);

      const report = bugReportModel.findById(reportId);
      if (!report) {
        return res.status(404).json(errorResponse('NOT_FOUND', '버그 리포트를 찾을 수 없습니다.'));
      }

      if (report.status === 'converted') {
        return res.status(409).json(errorResponse('ALREADY_CONVERTED', '이미 이슈로 변환된 버그 리포트입니다.'));
      }

      // breadcrumbs를 stepsToReproduce 문자열로 변환
      let stepsToReproduce: string | undefined;
      if (report.breadcrumbs) {
        const crumbs = report.breadcrumbs as Array<Record<string, unknown>>;
        if (Array.isArray(crumbs)) {
          stepsToReproduce = crumbs
            .map((c, i) => `${i + 1}. ${JSON.stringify(c)}`)
            .join('\n');
        }
      }

      // lastError.message를 actualResult로 사용
      let actualResult: string | undefined;
      if (report.lastError) {
        const err = report.lastError as Record<string, unknown>;
        if (err.message && typeof err.message === 'string') {
          actualResult = err.message;
        }
      }

      const issue = issueModel.create(projectId, {
        title: report.title || '(제목 없음)',
        severity: 'major',
        status: 'open',
        description: report.description ?? undefined,
        stepsToReproduce,
        actualResult,
      });

      bugReportModel.update(reportId, { status: 'converted', issueId: issue.id });

      res.status(201).json(success(issue));
    } catch (err) {
      next(err);
    }
  },

  remove(req: Request, res: Response, next: NextFunction) {
    try {
      const report = bugReportModel.findById(Number(req.params.id));
      if (!report) {
        return res.status(404).json(errorResponse('NOT_FOUND', '버그 리포트를 찾을 수 없습니다.'));
      }
      bugReportModel.delete(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
