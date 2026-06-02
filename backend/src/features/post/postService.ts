import { prisma } from '../../utils/prismaClient';
import { ApiError } from '../../utils/apiError';

const authorSelect = {
  id: true,
  displayName: true,
  avatar: true,
  role: true,
};

const likesInclude = {
  likes: { select: { teacherId: true } },
};

export async function getPosts(cursor?: number, limit = 10) {
  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true } },
      ...likesInclude,
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

export async function getPostById(id: number) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: authorSelect },
      comments: {
        include: { author: { select: { id: true, displayName: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
      ...likesInclude,
    },
  });
  if (!post) throw new ApiError('Post not found', 404);
  return post;
}

export async function createPost(data: {
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
}) {
  return prisma.post.create({
    data,
    include: { author: { select: authorSelect }, ...likesInclude },
  });
}

export async function likePost(postId: number, teacherId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError('Post not found', 404);

  await prisma.$transaction([
    prisma.like.create({ data: { postId, teacherId } }),
    prisma.user.update({ where: { id: post.authorId }, data: { coins: { increment: 1 } } }),
  ]);
}

export async function unlikePost(postId: number, teacherId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError('Post not found', 404);

  const like = await prisma.like.findUnique({ where: { postId_teacherId: { postId, teacherId } } });
  if (!like) throw new ApiError('Like not found', 404);

  await prisma.$transaction([
    prisma.like.delete({ where: { postId_teacherId: { postId, teacherId } } }),
    prisma.user.update({ where: { id: post.authorId }, data: { coins: { decrement: 1 } } }),
  ]);
}

export async function updatePost(
  id: number,
  authorId: string,
  data: { title?: string; content?: string; imageUrl?: string },
) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new ApiError('Post not found', 404);
  if (post.authorId !== authorId) throw new ApiError('Forbidden', 403);
  return prisma.post.update({
    where: { id },
    data,
    include: { author: { select: authorSelect } },
  });
}

export async function deletePost(id: number, authorId: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new ApiError('Post not found', 404);
  if (post.authorId !== authorId) throw new ApiError('Forbidden', 403);
  await prisma.post.delete({ where: { id } });
}

export async function getPostsByUser(userId: string, cursor?: number, limit = 10) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true } },
      ...likesInclude,
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