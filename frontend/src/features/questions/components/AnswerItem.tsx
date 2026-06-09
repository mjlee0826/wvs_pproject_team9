import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Answer } from '../services/questionApi';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

interface Props {
  answer: Answer;
  replyText: string;
  onChangeReplyText: (text: string) => void;
  onSubmitReply: () => void;
  onToggleUpvote: () => void;
  isTeacher?: boolean;
}

export default function AnswerItem({ answer, replyText, onChangeReplyText, onSubmitReply, onToggleUpvote, isTeacher }: Props) {
  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Image
            source={
              answer.author?.avatar
                ? { uri: answer.author.avatar.startsWith('http') ? answer.author.avatar : `${API_BASE}${answer.author.avatar}` }
                : require('../../../../assets/avatar-default.jpg')
            }
            className="w-8 h-8 rounded-full mr-2"
          />
          <Text className="text-sm font-semibold text-navy">{answer.author.displayName}</Text>
          {answer.isOfficial && (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-green-100">
              <Text className="text-green-600 text-[10px] font-semibold">⭐ 老師解答</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {isTeacher ? (
            <TouchableOpacity className="flex-row items-center gap-1" onPress={onToggleUpvote}>
              <Ionicons
                name={answer.hasUpvoted ? 'heart' : 'heart-outline'}
                size={14}
                color={answer.hasUpvoted ? '#F56565' : '#aaa'}
              />
              <Text className={`text-xs ${answer.hasUpvoted ? 'text-[#F56565]' : 'text-[#aaa]'}`}>
                {answer._count?.upvotes ?? 0}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <Ionicons name="heart" size={14} color="#aaa" />
              <Text className="text-xs text-[#aaa]">{answer._count?.upvotes ?? 0}</Text>
            </>
          )}
        </View>
      </View>

      <Text className="text-sm text-[#555] leading-5 mb-3">{answer.content}</Text>

      {answer.comments && answer.comments.length > 0 && (
        <View className="border-t border-[#eee] pt-2 mt-2">
          {answer.comments.map((c) => (
            <View key={c.id} className="mb-2">
              <View className="flex-row items-start">
                <Image
                  source={
                    c.author?.avatar
                      ? { uri: c.author.avatar.startsWith('http') ? c.author.avatar : `${API_BASE}${c.author.avatar}` }
                      : require('../../../../assets/avatar-default.jpg')
                  }
                  className="w-6 h-6 rounded-full mr-2"
                />
                <View className="flex-1">
                  <Text className="text-xs font-medium text-[#666]">{c.author.displayName}</Text>
                  <Text className="text-sm text-[#555]">{c.content}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className="mt-3 flex-row items-center">
        <TextInput
          placeholder="回覆這則解答..."
          value={replyText}
          onChangeText={onChangeReplyText}
          className="flex-1 bg-[#F5F5F5] rounded-full px-4 py-2 text-sm"
        />
        <TouchableOpacity
          className="ml-2 w-9 h-9 rounded-full bg-brand items-center justify-center"
          onPress={onSubmitReply}
        >
          <Ionicons name="send" size={14} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
