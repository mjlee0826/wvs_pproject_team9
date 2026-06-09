import { Image, Text, View } from 'react-native';
import { Thread } from '../services/questionApi';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

interface Props {
  thread: Thread;
  statusColors: { main: string; background: string };
}

export default function QuestionCard({ thread, statusColors }: Props) {
  return (
    <View className="mb-4 overflow-hidden rounded-2xl">
      <View className="h-1 w-full" style={{ backgroundColor: statusColors.main }} />
      <View
        className="p-4"
        style={{
          backgroundColor: statusColors.background,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center mb-3">
          <Image
            source={
              thread.author?.avatar
                ? { uri: thread.author.avatar.startsWith('http') ? thread.author.avatar : `${API_BASE}${thread.author.avatar}` }
                : require('../../../../assets/avatar-default.jpg')
            }
            className="w-10 h-10 rounded-full mr-3"
          />
          <View>
            <Text className="text-sm font-semibold text-navy">{thread.author?.displayName}</Text>
            <Text className="text-xs text-[#999]">發問者 · {thread.createdAt?.substring(0, 10)}</Text>
          </View>
        </View>
        <Text className="text-sm text-[#444] leading-5">{thread.content}</Text>
      </View>
    </View>
  );
}
