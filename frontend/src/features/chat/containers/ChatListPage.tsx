import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '../../../components/Loading';
import { useChatRooms } from '../hooks/useChatRooms';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未讀' },
  { key: 'read', label: '已讀' },
] as const;

type Filter = (typeof FILTERS)[number]['key'];

export default function ChatListPage() {
  const { rooms, loading, refreshing, refresh, unread, clearUnread } = useChatRooms();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const filteredRooms = rooms.filter((room) => {
    const unreadCount = unread[room.id] ?? 0;
    if (filter === 'unread') return unreadCount > 0;
    if (filter === 'read') return unreadCount === 0;
    return true;
  });

  if (loading) {
    return <Loading text="載入聊天室..." opacity={false} />;
  }

  const ListHeader = (
    <View>
      <LinearGradient
        colors={['#4FD1C5', '#65A1FB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 28, paddingHorizontal: 20 }}
      >
        <Text className="text-white text-2xl font-bold mb-1">聊天室</Text>
        <Text className="text-white/80 text-sm">即時訊息已啟用</Text>
      </LinearGradient>

      <View style={{ marginTop: -14 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`mr-2 px-4 py-2 rounded-full ${
                filter === f.key ? 'bg-brand' : 'bg-white border border-brand-light'
              }`}
              style={
                filter === f.key
                  ? { shadowColor: '#4FD1C5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 }
                  : {}
              }
            >
              <Text className={`text-sm font-semibold ${filter === f.key ? 'text-white' : 'text-[#666]'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="px-7 pt-2">
        <Text className="text-xs text-[#aaa] mb-3">共 {filteredRooms.length} 個聊天室</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4FD1C5" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        renderItem={({ item }) => {
          const lastMessage = item.messages[0];
          const unreadCount = unread[item.id] ?? 0;
          const hasUnread = unreadCount > 0;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                clearUnread(item.id);
                router.push(`/(app)/(tabs)/chat/${item.id}` as never);
              }}
              className="flex-row bg-white rounded-2xl mb-4 overflow-hidden"
              style={{
                marginHorizontal: 16,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              {/* LEFT ACCENT BAR */}
              <View className="w-1.5" style={{ backgroundColor: hasUnread ? '#F6AD55' : '#4FD1C5' }} />

              <View className="flex-1 p-4">
                {/* NAME + COUNT ROW */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-bold text-navy">{item.name}</Text>

                  <View className="flex-row items-center gap-2">
                    {hasUnread && (
                      <View
                        className="w-5 h-5 rounded-full justify-center items-center"
                        style={{ backgroundColor: '#F6AD55' }}
                      >
                        <Text className="text-white text-[10px] font-bold">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                    <Text className="text-xs text-[#aaa]">{item._count.messages} 則</Text>
                  </View>
                </View>

                {lastMessage ? (
                  <Text
                    className={`text-sm ${hasUnread ? 'text-[#333] font-medium' : 'text-[#555]'}`}
                    numberOfLines={2}
                  >
                    {lastMessage.author.displayName}: {lastMessage.content}
                  </Text>
                ) : (
                  <Text className="text-sm text-[#aaa]">還沒有訊息，來打第一句吧</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="px-7 py-4">
            <Text className="text-xs text-[#aaa]">目前沒有可用聊天室</Text>
          </View>
        }
      />
    </View>
  );
}