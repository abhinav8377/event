import { Router } from 'express';
import * as controller from './auth.controller.js';
import auth from '../../common/middleware/auth.middleware.js';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', auth, controller.logout);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.get('/me', auth, controller.me);

export default router;
