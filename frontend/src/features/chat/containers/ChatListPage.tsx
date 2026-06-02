import React from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '../../../components/Loading';
import { useChatRooms } from '../hooks/useChatRooms';

export default function ChatListPage() {
  const { rooms, loading, refreshing, refresh } = useChatRooms();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (loading) {
    return <Loading text="載入聊天室..." opacity={false} />;
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">聊天室</Text>
        <Text className="text-sm text-gray-400 mt-1">即時訊息已啟用</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4FD1C5" />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => {
          const lastMessage = item.messages[0];
          return (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/(tabs)/chat/${item.id}` as never)}
              className="px-4 py-4 border-b border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
                <Text className="text-xs text-gray-400">{item._count.messages} 則</Text>
              </View>
              {lastMessage ? (
                <Text className="mt-1 text-sm text-gray-500" numberOfLines={1}>
                  {lastMessage.author.displayName}: {lastMessage.content}
                </Text>
              ) : (
                <Text className="mt-1 text-sm text-gray-400">還沒有訊息，來打第一句吧</Text>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={(
          <View className="p-6">
            <Text className="text-gray-400">目前沒有可用聊天室</Text>
          </View>
        )}
      />
    </View>
  );
}