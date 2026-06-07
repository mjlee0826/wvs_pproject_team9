import { View, Text, Image } from 'react-native';
import { ChatMessage } from '../services/chatApi';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const avatarUri = message.author.avatar ? `${API_BASE}${message.author.avatar}` : null;

  return (
    <View className={`mb-3 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        avatarUri ? (
          <Image source={{ uri: avatarUri }} className="w-8 h-8 rounded-full mr-2 bg-gray-200 self-end" />
        ) : (
          <View className="w-8 h-8 rounded-full mr-2 bg-blue-100 items-center justify-center self-end">
            <Text className="text-blue-700 text-xs font-bold">
              {message.author.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )
      )}

      <View className={`max-w-[78%] rounded-2xl px-3 py-2 ${isMine ? 'bg-teal-500' : 'bg-gray-100'}`}>
        {!isMine && (
          <Text className="text-[11px] text-gray-500 mb-1">{message.author.displayName}</Text>
        )}
        <Text className={`${isMine ? 'text-white' : 'text-gray-900'} text-[15px] leading-5`}>
          {message.content}
        </Text>
        <Text className={`mt-1 text-[10px] ${isMine ? 'text-teal-100' : 'text-gray-400'}`}>
          {new Date(message.createdAt).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}