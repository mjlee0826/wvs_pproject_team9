import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLogto } from '@logto/rn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '../../../components/Loading';
import MessageBubble from '../components/MessageBubble';
import { useChatRoom } from '../hooks/useChatRoom';

export default function ChatRoomPage() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const parsedRoomId = Number(roomId);
  const insets = useSafeAreaInsets();
  const { getIdTokenClaims } = useLogto();

  const {
    messages,
    loading,
    sending,
    statusText,
    hasNextPage,
    loadingMore,
    loadMore,
    sendMessage,
  } = useChatRoom(parsedRoomId);

  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getIdTokenClaims().then((claims) => setCurrentUserId(claims?.sub)).catch(() => {});
  }, [getIdTokenClaims]);

  const messagesForList = useMemo(() => [...messages].reverse(), [messages]);

  const handleSend = async () => {
    const value = input.trim();
    if (!value) return;
    setInput('');
    await sendMessage(value);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  if (!Number.isFinite(parsedRoomId)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">聊天室不存在</Text>
      </View>
    );
  }

  if (loading) {
    return <Loading text="載入訊息..." opacity={false} />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <View className="px-4 py-3 border-b border-gray-100" style={{ paddingTop: insets.top + 8 }}>
        <Text className="text-lg font-bold text-gray-900">聊天室 #{parsedRoomId}</Text>
        <Text className="text-xs text-gray-400 mt-1">{statusText}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messagesForList}
        inverted
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
        renderItem={({ item }) => (
          <MessageBubble message={item} isMine={item.authorId === currentUserId} />
        )}
        ListFooterComponent={
          hasNextPage ? (
            <TouchableOpacity
              className="py-2 items-center"
              onPress={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color="#4FD1C5" />
              ) : (
                <Text className="text-xs text-gray-400">載入更早訊息</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View className="py-2 items-center">
              <Text className="text-xs text-gray-300">已經是最早訊息</Text>
            </View>
          )
        }
      />

      <View
        className="flex-row items-center px-4 pt-3 border-t border-[#f0f0f0] bg-white"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[15px] mr-2"
          placeholder="輸入訊息..."
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!sending}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !input.trim()}
          className={`w-[38px] h-[38px] rounded-full justify-center items-center ${(!input.trim() || sending) ? 'bg-gray-400' : 'bg-teal-500'}`}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}