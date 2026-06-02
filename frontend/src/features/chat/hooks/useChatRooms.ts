import { useCallback, useEffect, useState } from 'react';
import { chatApi, ChatRoom } from '../services/chatApi';

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await chatApi.getRooms();
      setRooms(data);
    } catch (err) {
      console.error('[useChatRooms] fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRooms().finally(() => setLoading(false));
  }, [fetchRooms]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  }, [fetchRooms]);

  return { rooms, loading, refreshing, refresh };
}