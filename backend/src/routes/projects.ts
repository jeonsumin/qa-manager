import { Router } from 'express';
import { projectController } from '../controllers/projectController';

const router = Router();

router.get('/', projectController.list);
router.post('/', projectController.create);
router.get('/:id', projectController.get);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);

export default router;
