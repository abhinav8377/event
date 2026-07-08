import { Router } from 'express';
import * as controller from './certificate.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.use(auth);

router.get('/my-certificates', controller.myCertificates);
router.get('/download/:id', controller.download);
router.post('/generate/:eventId', permit('ORGANIZER', 'ADMIN'), controller.generate);

export default router;
