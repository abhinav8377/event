import { Router } from 'express';
import * as controller from './event.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.get('/', controller.list);
router.get('/search', controller.search);
router.get('/upcoming', controller.upcoming);
router.get('/popular', controller.popular);
router.get('/:id', controller.getById);

router.post('/', auth, permit('ORGANIZER', 'ADMIN'), controller.create);
router.patch('/:id', auth, permit('ORGANIZER', 'ADMIN'), controller.update);
router.delete('/:id', auth, permit('ORGANIZER', 'ADMIN'), controller.remove);
router.patch('/:id/publish', auth, permit('ORGANIZER', 'ADMIN'), controller.publish);
router.patch('/:id/cancel', auth, permit('ORGANIZER', 'ADMIN'), controller.cancel);

export default router;
