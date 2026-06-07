import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Comment } from '../services/postApi';

interface Props {
  comment: Comment;
  currentUserId?: string;
  onDelete: (id: number) => void;
}

export default function CommentItem({ comment, currentUserId, onDelete }: Props) {
  const avatarUri = comment.author.avatar
    ? `${process.env.EXPO_PUBLIC_API_URL?.replace('/api', '')}${comment.author.avatar}`
    : null;

  const isOwner = currentUserId === comment.authorId;

  return (
    <View className="flex-row py-3 border-b border-gray-100">
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} className="w-8 h-8 rounded-full mr-3" />
      ) : (
        <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-3">
          <Text className="text-gray-600 text-xs font-bold">
            {comment.author.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-gray-700">
            {comment.author.displayName}
          </Text>
          {isOwner && (
            <TouchableOpacity onPress={() => onDelete(comment.id)}>
              <Text className="text-xs text-red-400">刪除</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-sm text-gray-600 mt-1">{comment.content}</Text>
        <Text className="text-xs text-gray-400 mt-1">
          {new Date(comment.createdAt).toLocaleDateString('zh-TW')}
        </Text>
      </View>
    </View>
  );
}