import { Router } from 'express';
import * as controller from './organizer.controller.js';
import * as analyticsController from '../analytics/analytics.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.use(auth, permit('ORGANIZER', 'ADMIN'));

router.get('/dashboard', controller.dashboard);
router.get('/events', controller.myEvents);
router.get('/analytics', analyticsController.dashboard);
router.get('/registrations/:eventId', controller.eventRegistrations);
router.get('/all-registrations', controller.allRegistrations);
router.get('/notifications/sent', controller.sentNotifications);
router.get('/notifications/events', controller.organizerEvents);
router.post('/notifications/send', controller.sendNotification);

export default router;
