import { Request, Response, NextFunction } from 'express';
import { projectModel } from '../models/projectModel';
import { success, successList, errorResponse } from '../utils/response';

class ProjectController {
  private static instance: ProjectController;

  private constructor() {}

  static getInstance(): ProjectController {
    if (!ProjectController.instance) {
      ProjectController.instance = new ProjectController();
    }
    return ProjectController.instance;
  }

  list = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, page, limit } = req.query;
      const p = Number(page) || 1;
      const l = Number(limit) || 20;
      const { data, total } = projectModel.findAll({
        status: status as string,
        page: p,
        limit: l,
      });
      res.json(successList(data, { page: p, limit: l, total, totalPages: Math.ceil(total / l) }));
    } catch (err) { next(err); }
  };

  get = (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = projectModel.findById(Number(req.params.id));
      if (!project) return res.status(404).json(errorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.'));
      res.json(success(project));
    } catch (err) { next(err); }
  };

  create = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json(errorResponse('VALIDATION_ERROR', '프로젝트명은 필수입니다.'));
      const project = projectModel.create(req.body);
      res.status(201).json(success(project));
    } catch (err) { next(err); }
  };

  update = (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = projectModel.findById(Number(req.params.id));
      if (!existing) return res.status(404).json(errorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.'));
      const project = projectModel.update(Number(req.params.id), req.body);
      res.json(success(project));
    } catch (err) { next(err); }
  };

  remove = (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = projectModel.findById(Number(req.params.id));
      if (!existing) return res.status(404).json(errorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.'));
      projectModel.delete(Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  };
}

export const projectController = ProjectController.getInstance();
