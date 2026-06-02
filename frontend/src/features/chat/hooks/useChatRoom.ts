import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLogto } from '@logto/rn';
import { io, Socket } from 'socket.io-client';
import { chatApi, ChatMessage } from '../services/chatApi';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '');

type SendAck = { ok: boolean; message?: ChatMessage; error?: string };

function upsertMessage(list: ChatMessage[], next: ChatMessage) {
  const exists = list.some((msg) => msg.id === next.id);
  if (exists) return list;
  return [...list, next];
}

export function useChatRoom(roomId: number) {
  const { getAccessToken } = useLogto();
  const socketRef = useRef<Socket | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);

  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    try {
      const result = await chatApi.getMessages(roomId);
      setMessages(result.items);
      setNextCursor(result.nextCursor);
      setHasNextPage(result.hasNextPage);
    } catch (err) {
      console.error('[useChatRoom] fetchLatest failed:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || nextCursor === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await chatApi.getMessages(roomId, nextCursor);
      setMessages((prev) => [...result.items, ...prev]);
      setNextCursor(result.nextCursor);
      setHasNextPage(result.hasNextPage);
    } catch (err) {
      console.error('[useChatRoom] loadMore failed:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, nextCursor, roomId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  useEffect(() => {
    let unmounted = false;

    async function connectSocket() {
      try {
        const token = await getAccessToken(process.env.EXPO_PUBLIC_LOGTO_API_RESOURCE!);
        if (!token || unmounted || !SOCKET_URL) return;

        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 800,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('chat:join', { roomId });
        });

        socket.on('disconnect', () => {
          setConnected(false);
        });

        socket.on('chat:new_message', (message: ChatMessage) => {
          if (message.roomId !== roomId) return;
          setMessages((prev) => upsertMessage(prev, message));
        });
      } catch (err) {
        console.error('[useChatRoom] socket connect failed:', err);
      }
    }

    connectSocket();

    return () => {
      unmounted = true;
      if (socketRef.current) {
        socketRef.current.emit('chat:leave', { roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [getAccessToken, roomId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const normalized = content.trim();
      if (!normalized || sending) return;
      setSending(true);

      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        try {
          const created = await chatApi.sendMessage(roomId, normalized);
          setMessages((prev) => upsertMessage(prev, created));
        } finally {
          setSending(false);
        }
        return;
      }

      await new Promise<void>((resolve) => {
        socket.emit('chat:send', { roomId, content: normalized }, async (ack: SendAck) => {
          if (ack?.ok && ack.message) {
            setMessages((prev) => upsertMessage(prev, ack.message));
            setSending(false);
            resolve();
            return;
          }

          try {
            const created = await chatApi.sendMessage(roomId, normalized);
            setMessages((prev) => upsertMessage(prev, created));
          } catch (err) {
            console.error('[useChatRoom] send failed:', ack?.error ?? err);
          } finally {
            setSending(false);
            resolve();
          }
        });
      });
    },
    [roomId, sending],
  );

  const statusText = useMemo(() => (connected ? '連線中' : '重新連線中...'), [connected]);

  return {
    messages,
    loading,
    sending,
    connected,
    statusText,
    hasNextPage,
    loadingMore,
    loadMore,
    sendMessage,
    refresh: fetchLatest,
  };
}