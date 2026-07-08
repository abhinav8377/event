import { Router } from 'express';
import * as controller from './attendance.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.use(auth, permit('ORGANIZER', 'ADMIN'));

router.post('/verify', controller.verify);
router.post('/manual-checkin', controller.manualCheckin);
router.get('/event/:eventId', controller.eventAttendance);

export default router;
