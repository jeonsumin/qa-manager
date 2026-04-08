import { Router } from 'express';
import { issueController } from '../controllers/issueController';

const router = Router({ mergeParams: true });

router.get('/', issueController.list);
router.post('/', issueController.create);
router.get('/:id', issueController.get);
router.put('/:id', issueController.update);
router.delete('/:id', issueController.remove);

export default router;
