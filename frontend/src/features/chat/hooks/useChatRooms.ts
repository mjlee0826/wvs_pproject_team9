import { useCallback, useEffect, useRef, useState } from 'react';
import { useLogto } from '@logto/rn';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatApi, ChatMessage, ChatRoom } from '../services/chatApi';

const SEEN_KEY = 'chat:seen_counts';

async function loadSeenCounts(): Promise<Record<number, number>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveSeenCount(roomId: number, count: number) {
  try {
    const seen = await loadSeenCounts();
    seen[roomId] = count;
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {}
}

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
      const [data, seenCounts] = await Promise.all([chatApi.getRooms(), loadSeenCounts()]);
      setRooms(data);
      const initialUnread: Record<number, number> = {};
      data.forEach((room) => {
        const seen = seenCounts[room.id] ?? 0;
        initialUnread[room.id] = Math.max(0, room._count.messages - seen);
      });
      setUnread(initialUnread);
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
    setRooms((prev) => {
      const room = prev.find((r) => r.id === roomId);
      if (room) saveSeenCount(roomId, room._count.messages);
      return prev;
    });
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  }, [fetchRooms]);

  return { rooms, loading, refreshing, refresh, unread, clearUnread };
}