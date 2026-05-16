import { prisma } from '../utils/prismaClient';
import { ApiError } from '../utils/apiError';

export async function createComment(data: {
  content: string;
  authorId: string;
  postId: number;
}) {
  return prisma.comment.create({
    data,
    include: {
      author: { select: { id: true, displayName: true, avatar: true } },
    },
  });
}

export async function updateComment(
  id: number,
  authorId: string,
  content: string,
) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError('Comment not found', 404);
  if (comment.authorId !== authorId) throw new ApiError('Forbidden', 403);
  return prisma.comment.update({
    where: { id },
    data: { content },
    include: {
      author: { select: { id: true, displayName: true, avatar: true } },
    },
  });
}

export async function deleteComment(id: number, authorId: string) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError('Comment not found', 404);
  if (comment.authorId !== authorId) throw new ApiError('Forbidden', 403);
  await prisma.comment.delete({ where: { id } });
}
