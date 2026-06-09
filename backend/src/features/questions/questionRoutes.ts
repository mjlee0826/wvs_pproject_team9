import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import * as ctrl from './questionController';

const router = Router();

// Threads
router.get('/', ctrl.getThreads);
router.post('/', requireAuth, ctrl.createThread);
router.get('/:id', ctrl.getThreadById);
router.patch('/:id/resolve', requireAuth, ctrl.resolveThread);

// Answers
router.get('/:id/answers', optionalAuth, ctrl.getAnswers);
router.post('/:id/answers', requireAuth, ctrl.createAnswer);

// Replies to answers
router.post('/:id/answers/:answerId/replies', requireAuth, ctrl.createReply);

// Upvotes on answers
router.post('/:id/answers/:answerId/upvote', requireAuth, ctrl.upvoteAnswer);
router.delete('/:id/answers/:answerId/upvote', requireAuth, ctrl.unupvoteAnswer);

export default router;
