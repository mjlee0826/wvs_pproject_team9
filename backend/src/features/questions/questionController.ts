import { Request, Response, NextFunction } from 'express';
import * as questionService from './questionService';

export const getThreads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subject = (req.query.subject as string) || undefined;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const authorId = (req.query.authorId as string) || undefined;
    console.log(`[Question] getThreads subject=${subject} cursor=${cursor} limit=${limit} authorId=${authorId}`);
    const result = await questionService.getThreads(subject, cursor, limit, authorId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getThreadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    console.log(`[Question] getThreadById id=${id}`);
    const thread = await questionService.getThreadById(id);
    res.json(thread);
  } catch (err) {
    next(err);
  }
};

export const createThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, title, content } = req.body as { subject: string; title: string; content: string };
    console.log(`[Question] createThread sub=${req.user!.sub} title=${title}`);
    const thread = await questionService.createThread({ subject, title, content, authorId: req.user!.sub });
    res.status(201).json(thread);
  } catch (err) {
    next(err);
  }
};

export const resolveThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { resolved } = req.body as { resolved: boolean };
    console.log(`[Question] resolveThread id=${id} resolved=${resolved} sub=${req.user!.sub}`);
    const thread = await questionService.resolveThread(id, resolved, req.user!.sub);
    res.json(thread);
  } catch (err) {
    next(err);
  }
};

export const getAnswers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.sub;
    console.log(`[Question] getAnswers threadId=${id} userId=${userId}`);
    const answers = await questionService.getAnswers(id, userId);
    res.json(answers);
  } catch (err) {
    next(err);
  }
};

export const createAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { content } = req.body as { content: string };
    console.log(`[Question] createAnswer threadId=${id} sub=${req.user!.sub}`);
    const answer = await questionService.createAnswer(id, { content, authorId: req.user!.sub });
    res.status(201).json(answer);
  } catch (err) {
    next(err);
  }
};

export const createReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const answerId = String(req.params.answerId);
    const { content } = req.body as { content: string };
    console.log(`[Question] createReply answerId=${answerId} sub=${req.user!.sub}`);
    const reply = await questionService.createReply(answerId, { content, authorId: req.user!.sub });
    res.status(201).json(reply);
  } catch (err) {
    next(err);
  }
};

export const upvoteAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const answerId = String(req.params.answerId);
    console.log(`[Question] upvoteAnswer answerId=${answerId} sub=${req.user!.sub}`);
    await questionService.upvoteAnswer(answerId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const unupvoteAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const answerId = String(req.params.answerId);
    console.log(`[Question] unupvoteAnswer answerId=${answerId} sub=${req.user!.sub}`);
    await questionService.unupvoteAnswer(answerId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
