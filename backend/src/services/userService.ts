import { prisma } from '../utils/prismaClient';
import { ApiError } from '../utils/apiError';

const publicSelect = {
  id: true,
  displayName: true,
  avatar: true,
  role: true,
  coins: true,
};

export async function upsertMe(data: {
  id: string;
  displayName: string;
  email: string;
}) {
  return prisma.user.upsert({
    where: { id: data.id },
    update: { displayName: data.displayName },
    create: data,
  });
}

export async function getMe(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });
  if (!user) throw new ApiError('User not found', 404);
  return user;
}

export async function updateMe(
  id: string,
  data: { displayName?: string; avatar?: string },
) {
  return prisma.user.update({ where: { id }, data });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicSelect,
  });
  if (!user) throw new ApiError('User not found', 404);
  return user;
}

export async function getUserPosts(userId: string, cursor?: number, limit = 10) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: publicSelect },
      _count: { select: { comments: true } },
      likes: { select: { teacherId: true } },
    },
  });
  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, -1) : posts;
  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}
