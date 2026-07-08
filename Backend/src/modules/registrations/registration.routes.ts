import { Router } from 'express';
import * as controller from './registration.controller.js';
import auth from '../../common/middleware/auth.middleware.js';

const router = Router();

router.use(auth);

router.get('/my-events', controller.myEvents);
router.get('/ticket/:registrationId', controller.getTicket);
router.post('/:eventId', controller.register);
router.delete('/:eventId', controller.cancel);

export default router;
