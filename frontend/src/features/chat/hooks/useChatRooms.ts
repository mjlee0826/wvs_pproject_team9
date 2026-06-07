import { useCallback, useEffect, useRef, useState } from 'react';
import { useLogto } from '@logto/rn';
import { io, Socket } from 'socket.io-client';
import { chatApi, ChatMessage, ChatRoom } from '../services/chatApi';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '');

export function useChatRooms() {
  const { getAccessToken, getIdTokenClaims } = useLogto();
  const mySubRef = useRef<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await chatApi.getRooms();
      setRooms(data);
      // join all rooms for live list preview (socket may already be connected)
      if (socketRef.current?.connected) {
        data.forEach((r) => socketRef.current!.emit('chat:join', { roomId: r.id }));
      }
    } catch (err) {
      console.error('[useChatRooms] fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRooms().finally(() => setLoading(false));
  }, [fetchRooms]);

  // 訂閱所有房間的新訊息，更新預覽與未讀數
  useEffect(() => {
    if (!SOCKET_URL) return;
    let unmounted = false;

    async function connectSocket() {
      try {
        const [token, claims] = await Promise.all([
          getAccessToken(process.env.EXPO_PUBLIC_LOGTO_API_RESOURCE!),
          getIdTokenClaims(),
        ]);
        mySubRef.current = claims?.sub ?? null;
        if (!token || unmounted) return;

        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
        });
        socketRef.current = socket;

        // join all rooms so we receive broadcasts for the list preview
        socket.on('connect', () => {
          setRooms((current) => {
            current.forEach((r) => socket.emit('chat:join', { roomId: r.id }));
            return current;
          });
        });

        socket.on('chat:new_message', (message: ChatMessage) => {
          if (unmounted) return;
          setRooms((prev) => prev.map((room) => {
            if (room.id !== message.roomId) return room;
            return {
              ...room,
              messages: [message],
              _count: { messages: room._count.messages + 1 },
            };
          }));
          if (message.authorId !== mySubRef.current) {
            setUnread((prev) => ({
              ...prev,
              [message.roomId]: (prev[message.roomId] ?? 0) + 1,
            }));
          }
        });
      } catch (err) {
        console.error('[useChatRooms] socket failed:', err);
      }
    }

    connectSocket();
    return () => {
      unmounted = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [getAccessToken]);

  const clearUnread = useCallback((roomId: number) => {
    setUnread((prev) => ({ ...prev, [roomId]: 0 }));
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  }, [fetchRooms]);

  return { rooms, loading, refreshing, refresh, unread, clearUnread };
}