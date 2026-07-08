import { Router } from 'express';
import * as controller from './notification.controller.js';
import auth from '../../common/middleware/auth.middleware.js';

const router = Router();

router.use(auth);

router.get('/', controller.list);
router.patch('/read-all', controller.markAllRead);
router.patch('/read/:id', controller.markRead);

export default router;
