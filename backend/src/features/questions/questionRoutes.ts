import { Router } from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '../../middleware/auth';
import * as ctrl from './questionController';

const router = Router();

// Threads
router.get('/', optionalAuth, ctrl.getThreads);
router.post('/', requireAuth, ctrl.createThread);
router.get('/:id', optionalAuth, ctrl.getThreadById);
router.patch('/:id/resolve', requireAuth, ctrl.resolveThread);

// Answers
router.get('/:id/answers', optionalAuth, ctrl.getAnswers);
router.post('/:id/answers', requireAuth, ctrl.createAnswer);

// Replies to answers
router.post('/:id/answers/:answerId/replies', requireAuth, ctrl.createReply);

// Upvotes on answers (teacher/admin only)
router.post('/:id/answers/:answerId/upvote', requireAuth, requireAdmin, ctrl.upvoteAnswer);
router.delete('/:id/answers/:answerId/upvote', requireAuth, requireAdmin, ctrl.unupvoteAnswer);

export default router;
