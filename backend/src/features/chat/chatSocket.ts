import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../../middleware/auth';
import * as chatService from './chatService';

type SocketUser = { sub: string; scope?: string };

const roomChannel = (roomId: number) => `room:${roomId}`;
let ioRef: Server | null = null;

export function broadcastChatMessage(roomId: number, message: unknown) {
  ioRef?.to(roomChannel(roomId)).emit('chat:new_message', message);
}

export function initChatSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const authToken =
        typeof socket.handshake.auth?.token === 'string'
          ? socket.handshake.auth.token
          : undefined;
      const headerToken =
        typeof socket.handshake.headers.authorization === 'string'
          ? socket.handshake.headers.authorization
          : undefined;

      const payload = await verifyAccessToken(authToken, headerToken);
      socket.data.user = { sub: payload.sub as string, scope: payload.scope as string | undefined };
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`[WS] connected user=${user.sub} socket=${socket.id}`);

    socket.on('chat:join', async (payload: { roomId: number }, ack?: (res: unknown) => void) => {
      try {
        const roomId = Number(payload?.roomId);
        await chatService.getRoomById(roomId);
        await socket.join(roomChannel(roomId));
        ack?.({ ok: true, roomId });
      } catch (err) {
        ack?.({ ok: false, error: err instanceof Error ? err.message : 'Join failed' });
      }
    });

    socket.on('chat:leave', async (payload: { roomId: number }, ack?: (res: unknown) => void) => {
      const roomId = Number(payload?.roomId);
      await socket.leave(roomChannel(roomId));
      ack?.({ ok: true, roomId });
    });

    socket.on(
      'chat:send',
      async (
        payload: { roomId: number; content: string },
        ack?: (res: { ok: boolean; message?: unknown; error?: string }) => void,
      ) => {
        try {
          const roomId = Number(payload?.roomId);
          const message = await chatService.sendMessage(roomId, user.sub, payload?.content ?? '');
          broadcastChatMessage(roomId, message);
          ack?.({ ok: true, message });
        } catch (err) {
          ack?.({ ok: false, error: err instanceof Error ? err.message : 'Send failed' });
        }
      },
    );

    socket.on('disconnect', (reason) => {
      console.log(`[WS] disconnected user=${user.sub} socket=${socket.id} reason=${reason}`);
    });
  });

  ioRef = io;
  return io;
}