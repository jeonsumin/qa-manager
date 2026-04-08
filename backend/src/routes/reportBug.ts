import { Router } from 'express';
import { bugReportController } from '../controllers/bugReportController';

const router = Router();

router.post('/', bugReportController.receive);

export default router;
