import { Router } from 'express';
import * as controller from './community.controller.js';
import auth from '../../common/middleware/auth.middleware.js';
import permit from '../../common/middleware/role.middleware.js';

const router = Router();

router.use(auth);

// User-facing
router.get('/my', controller.userCommunities);
router.post('/:communityId/join', controller.requestJoin);
router.get('/:communityId/chat', controller.chatData);
router.post('/:communityId/leave', controller.leave);

// Organizer-facing
router.get('/organizer/list', controller.organizerCommunities);
router.post('/', permit('ORGANIZER', 'ADMIN'), controller.create);
router.get('/:communityId/members', permit('ORGANIZER', 'ADMIN'), controller.members);
router.patch('/:communityId/members/:userId/approve', permit('ORGANIZER', 'ADMIN'), controller.approveMember);
router.patch('/:communityId/members/:userId/deny', permit('ORGANIZER', 'ADMIN'), controller.denyMember);
router.delete('/:communityId/members/:userId', permit('ORGANIZER', 'ADMIN'), controller.removeMember);

export default router;
