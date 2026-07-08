import { Router } from 'express';
import * as controller from './feedback.controller.js';
import auth from '../../common/middleware/auth.middleware.js';

const router = Router();

router.get('/:eventId', auth, controller.listForEvent);
router.post('/:eventId', auth, controller.create);
router.delete('/:feedbackId', auth, controller.remove);

export default router;
