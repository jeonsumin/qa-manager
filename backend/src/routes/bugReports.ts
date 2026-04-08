import { Router } from 'express';
import { bugReportController } from '../controllers/bugReportController';

const router = Router({ mergeParams: true });

router.get('/', bugReportController.list);
router.get('/:id', bugReportController.get);
router.put('/:id', bugReportController.update);
router.post('/:id/convert', bugReportController.convertToIssue);
router.delete('/:id', bugReportController.remove);

export default router;
