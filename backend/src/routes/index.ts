import { Router } from 'express';
import postRoutes from '../features/post/postRoutes';
import commentRoutes from '../features/comment/commentRoutes';
import userRoutes from './userRoutes';
import logtoRoutes from './logtoRoutes';
import questionRoutes from './questionRoutes';
import chatRoutes from '../features/chat/chatRoutes';

export const router = Router();

router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/users', userRoutes);
router.use('/logto', logtoRoutes);
router.use('/questions', questionRoutes);
router.use('/chat', chatRoutes);
