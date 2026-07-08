import { Router } from 'express';
import * as controller from './analytics.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.use(auth, permit('ORGANIZER', 'ADMIN'));

router.get('/dashboard', controller.dashboard);
router.get('/event/:eventId', controller.eventAnalytics);

export default router;
