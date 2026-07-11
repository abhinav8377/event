import { Router } from 'express';
import * as controller from './admin.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.use(auth, permit('ADMIN'));

router.get('/dashboard', controller.dashboard);
router.get('/events', controller.listEvents);
router.get('/users', controller.listUsers);
router.get('/organizers', controller.listOrganizers);
router.patch('/verify-organizer/:id', controller.verifyOrganizer);
router.patch('/block-user/:id', controller.blockUser);
router.delete('/event/:id', controller.deleteEvent);
router.post('/notifications', controller.sendNotification);
router.get('/notifications/sent', controller.sentNotifications);
router.get('/logs', controller.listLogs);
router.get('/logs/stats', controller.logStats);

export default router;
