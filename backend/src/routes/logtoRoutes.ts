import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/logtoController';

const router = Router();

router.post('/users/role', requireAuth, ctrl.assignRole);

export default router;
