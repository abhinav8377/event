import { Router } from 'express';
import * as controller from './payment.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.use(auth);

router.get('/integration', permit('ORGANIZER', 'ADMIN'), controller.getIntegration);
router.post('/integration', permit('ORGANIZER', 'ADMIN'), controller.saveIntegration);
router.delete('/integration', permit('ORGANIZER', 'ADMIN'), controller.deleteIntegration);

router.post('/create-order/:eventId', controller.createOrder);
router.post('/verify', controller.verifyPayment);

export default router;
