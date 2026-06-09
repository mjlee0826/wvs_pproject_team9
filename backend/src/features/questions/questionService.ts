import { prisma } from '../../utils/prismaClient';
import { ApiError } from '../../utils/apiError';

const authorSelect = {
  id: true,
  displayName: true,
  avatar: true,
  role: true,
};

export async function getThreads(subject?: string, cursor?: string, limit = 10) {
  const where = subject && subject !== '全部' ? { subject } : undefined;
  const threads = await prisma.thread.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
    orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }],
    include: { author: { select: authorSelect }, _count: { select: { answers: true } } },
  });

  const hasNextPage = threads.length > limit;
  const items = hasNextPage ? threads.slice(0, -1) : threads;
  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function getThreadById(id: string) {
  const thread = await prisma.thread.findUnique({
    where: { id: Number(id) },
    include: { author: { select: authorSelect } },
  });
  if (!thread) throw new ApiError('Thread not found', 404);
  return thread;
}

export async function createThread(data: { subject: string; title: string; content: string; authorId: string }) {
  return prisma.thread.create({ data, include: { author: { select: authorSelect } } });
}

export async function resolveThread(id: string, resolved: boolean, requesterId: string) {
  const thread = await prisma.thread.findUnique({ where: { id: Number(id) } });
  if (!thread) throw new ApiError('Thread not found', 404);

  const requester = await prisma.user.findUnique({ where: { id: requesterId }, select: { role: true } });
  const isAuthor = thread.authorId === requesterId;
  const isTeacher = requester?.role === 'teacher' || requester?.role === 'admin';
  if (!isAuthor && !isTeacher) throw new ApiError('Forbidden', 403);

  return prisma.thread.update({
    where: { id: Number(id) },
    data: { resolved },
    include: { author: { select: authorSelect } },
  });
}

export async function getAnswers(threadId: string, userId?: string) {
  const thread = await prisma.thread.findUnique({ where: { id: Number(threadId) } });
  if (!thread) throw new ApiError('Thread not found', 404);

  const answers = await prisma.answer.findMany({
    where: { threadId: Number(threadId) },
    include: {
      author: { select: authorSelect },
      comments: {
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { upvotes: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!userId) return answers.map((ans) => ({ ...ans, hasUpvoted: false }));

  const userUpvotes = await prisma.upvote.findMany({
    where: { answerId: { in: answers.map((a) => a.id) }, userId },
    select: { answerId: true },
  });
  const upvotedSet = new Set(userUpvotes.map((u) => u.answerId));

  return answers.map((ans) => ({ ...ans, hasUpvoted: upvotedSet.has(ans.id) }));
}

export async function createAnswer(threadId: string, data: { content: string; authorId: string; isOfficial?: boolean }) {
  const thread = await prisma.thread.findUnique({ where: { id: Number(threadId) } });
  if (!thread) throw new ApiError('Thread not found', 404);
  return prisma.answer.create({
    data: { threadId: Number(threadId), ...data },
    include: {
      author: { select: authorSelect },
      _count: { select: { upvotes: true } },
    },
  });
}

export async function createReply(answerId: string, data: { content: string; authorId: string }) {
  const answer = await prisma.answer.findUnique({ where: { id: Number(answerId) } });
  if (!answer) throw new ApiError('Answer not found', 404);
  return prisma.reply.create({
    data: { answerId: Number(answerId), ...data },
    include: { author: { select: authorSelect } },
  });
}

export async function upvoteAnswer(answerId: string, userId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: Number(answerId) } });
  if (!answer) throw new ApiError('Answer not found', 404);
  await prisma.upvote.create({ data: { answerId: Number(answerId), userId } });
}

export async function unupvoteAnswer(answerId: string, userId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: Number(answerId) } });
  if (!answer) throw new ApiError('Answer not found', 404);
  const upvote = await prisma.upvote.findUnique({
    where: { answerId_userId: { answerId: Number(answerId), userId } },
  });
  if (!upvote) throw new ApiError('Upvote not found', 404);
  await prisma.upvote.delete({ where: { answerId_userId: { answerId: Number(answerId), userId } } });
}
