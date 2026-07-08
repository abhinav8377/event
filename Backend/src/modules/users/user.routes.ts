import { Router } from 'express';
import * as controller from './user.controller.js';
import auth from '../../common/middleware/auth.middleware.js';

const router = Router();

router.use(auth);

router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);
router.patch('/change-password', controller.changePassword);
router.delete('/account', controller.deleteAccount);

export default router;
