import { Router } from 'express';
import * as controller from './registration.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.use(auth);

router.get('/my-events', controller.myEvents);
router.get('/ticket/:registrationId', controller.getTicket);
router.post('/:eventId', controller.register);
router.post('/:eventId/payment-success', controller.handlePaymentSuccess);
router.delete('/:eventId', controller.cancel);

router.patch('/:registrationId/allow', permit('ORGANIZER', 'ADMIN'), controller.allow);
router.patch('/:registrationId/deny', permit('ORGANIZER', 'ADMIN'), controller.deny);

export default router;
