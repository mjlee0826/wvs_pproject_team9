import { prisma } from '../../utils/prismaClient';
import { ApiError } from '../../utils/apiError';

const messageInclude = {
  author: {
    select: {
      id: true,
      displayName: true,
      avatar: true,
      role: true,
    },
  },
};

async function ensureDefaultRoom() {
  const existing = await prisma.chatRoom.findFirst({ where: { name: 'General' } });
  if (existing) return existing;
  return prisma.chatRoom.create({ data: { name: 'General' } });
}

export async function getRooms() {
  await ensureDefaultRoom();

  return prisma.chatRoom.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: messageInclude,
      },
    },
  });
}

export async function getRoomById(roomId: number) {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new ApiError('Chat room not found', 404);
  return room;
}

export async function getMessages(roomId: number, cursor?: number, limit = 30) {
  await getRoomById(roomId);

  const messages = await prisma.message.findMany({
    where: { roomId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: 'desc' },
    include: messageInclude,
  });

  const hasNextPage = messages.length > limit;
  const page = hasNextPage ? messages.slice(0, -1) : messages;

  return {
    items: page.reverse(),
    nextCursor: hasNextPage ? page[page.length - 1].id : null,
    hasNextPage,
  };
}

export async function sendMessage(roomId: number, authorId: string, content: string) {
  const normalized = content.trim();
  if (!normalized) throw new ApiError('Message content is required', 400);
  if (normalized.length > 2000) throw new ApiError('Message too long (max 2000)', 400);

  await getRoomById(roomId);

  const message = await prisma.message.create({
    data: { roomId, authorId, content: normalized },
    include: messageInclude,
  });

  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { updatedAt: new Date() },
  });

  return message;
}