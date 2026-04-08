import { Router } from 'express';
import { testCaseController } from '../controllers/testCaseController';

const router = Router({ mergeParams: true });

router.get('/', testCaseController.list);
router.post('/', testCaseController.create);
router.get('/categories', testCaseController.categories);
router.get('/:id', testCaseController.get);
router.put('/:id', testCaseController.update);
router.delete('/:id', testCaseController.remove);

export default router;
