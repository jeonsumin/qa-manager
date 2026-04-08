import { Router } from 'express';
import { testRunController } from '../controllers/testRunController';

const router = Router({ mergeParams: true });

router.get('/', testRunController.list);
router.post('/', testRunController.create);
router.get('/:id', testRunController.get);
router.put('/:id', testRunController.update);
router.delete('/:id', testRunController.remove);
router.put('/:runId/results/:resultId', testRunController.updateResult);

export default router;
