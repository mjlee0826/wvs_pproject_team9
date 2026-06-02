import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLogto } from '@logto/rn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePost } from '../hooks/usePost';
import CommentItem from '../components/CommentItem';
import Loading from '../../../components/Loading';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

const PostDetail = () => {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { getIdTokenClaims } = useLogto();
  const { post, loading, addComment, deleteComment } = usePost(Number(postId));
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getIdTokenClaims().then((claims) => setCurrentUserId(claims?.sub)).catch(() => {});
  }, [getIdTokenClaims]);

  const imageUri = post?.imageUrl ? `${API_BASE}${post.imageUrl}` : null;
  const avatarUri = post?.author.avatar ? `${API_BASE}${post.author.avatar}` : null;

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(commentText.trim());
      setCommentText('');
    } catch {
      Alert.alert('錯誤', '留言失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (id: number) => {
    Alert.alert('確認刪除', '確定要刪除這則留言嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => deleteComment(id) },
    ]);
  };

  if (loading) return <Loading text="載入中..." />;
  if (!post) return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-gray-400 text-base">找不到此貼文</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView className="flex-1" style={{ paddingTop: insets.top }}>
        <View className="p-4">
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => router.push(`/(app)/user/${post.author.id}`)}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-11 h-11 rounded-full mr-3 bg-gray-200" />
            ) : (
              <View className="w-11 h-11 rounded-full bg-blue-100 justify-center items-center mr-3">
                <Text className="text-blue-700 font-bold text-lg">
                  {post.author.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text className="text-[15px] font-semibold text-[#111]">{post.author.displayName}</Text>
              <Text className="text-[13px] text-gray-400 mt-0.5">
                {new Date(post.createdAt).toLocaleDateString('zh-TW')}
              </Text>
            </View>
          </TouchableOpacity>

          <Text className="text-xl font-bold text-[#111] mb-2.5">{post.title}</Text>
          <Text className="text-base text-gray-700 leading-[26px]">{post.content}</Text>

          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              className="w-full h-[220px] rounded-xl mt-4"
              resizeMode="cover"
            />
          )}

          <View className="mt-6 mb-3">
            <Text className="text-[15px] font-semibold text-gray-700">
              留言 ({post.comments.length})
            </Text>
          </View>
          {post.comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              onDelete={handleDeleteComment}
            />
          ))}
        </View>
      </ScrollView>

      <View
        className="flex-row items-center px-4 pt-3 border-t border-[#f0f0f0] bg-white"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[15px] mr-2"
          placeholder="留言..."
          value={commentText}
          onChangeText={setCommentText}
          returnKeyType="send"
          onSubmitEditing={handleAddComment}
        />
        <TouchableOpacity
          onPress={handleAddComment}
          disabled={submitting || !commentText.trim()}
          className={`w-[38px] h-[38px] rounded-full justify-center items-center ${(!commentText.trim() || submitting) ? 'bg-gray-400' : 'bg-brand'}`}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PostDetail;