import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuestion } from '../hooks/useQuestion';
import { useUser } from '../../../hooks/useUser';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

// Data will be loaded from backend via `useQuestion`

const ThreadDetail = () => {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const threadIdNum = threadId ? Number(threadId) : undefined;
  const insets = useSafeAreaInsets();
  const { thread, answers, loading, refetch, addAnswer, addReply, toggleResolve, toggleUpvote } = useQuestion(threadIdNum);
  const { user: me } = useUser('me');
  const [resolved, setResolved] = useState<boolean>(false);
  const [newAnswerText, setNewAnswerText] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const sortedAnswers = [...(answers ?? [])].sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial));

  const canResolve =
    !!me && !!thread &&
    (me.id === thread.authorId || me.role === 'teacher' || me.role === 'admin');

  useEffect(() => {
    if (thread) setResolved(!!thread.resolved);
  }, [thread]);

  const statusColors = resolved
    ? { main: '#38B2AC', background: '#E6FFFA' }
    : { main: '#F6AD55', background: '#FFF5F5' };

  if (loading && !thread) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4FD1C5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">

      {/* HEADER */}
      <LinearGradient
        colors={['#4FD1C5', '#65A1FB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
        <Text className="text-white text-xl font-bold">
          {thread?.title ?? ''}
        </Text>

        <Text className="text-white/70 text-xs mt-1">
          Thread ID: {threadId}
        </Text>

        <View className="flex-row items-center justify-between mt-2"> 
          <Text className="text-white/80 text-xs"> {thread?.subject} · {thread?.author?.displayName} 
          </Text>

          {canResolve ? (
            <TouchableOpacity
              onPress={toggleResolve}
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: statusColors.background }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{ color: statusColors.main }}
              >
                {resolved ? '已解決' : '待解決'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: statusColors.background }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{ color: statusColors.main }}
              >
                {resolved ? '已解決' : '待解決'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
      >

        {/* Question Card */}
        <View className="mb-4 overflow-hidden rounded-2xl">
          {/* Top accent bar */}
          <View className="h-1 w-full" style={{ 
            backgroundColor: statusColors.main 
          }}/>

          {/* Main question card */}
          <View className="p-4" style={{
            backgroundColor: statusColors.background,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 2,
          }}>

          {/* Question Author */}
          <View className="flex-row items-center mb-3">
            <Image
              source={
                thread?.author?.avatar
                  ? { uri: thread.author.avatar.startsWith('http') ? thread.author.avatar : `${API_BASE}${thread.author.avatar}` }
                  : require('../../../../assets/avatar-default.jpg')
              }
              className="w-10 h-10 rounded-full mr-3"
            />

            <View>
              <Text className="text-sm font-semibold text-navy">
                    {thread?.author?.displayName}
                  </Text>

              <Text className="text-xs text-[#999]">
                發問者
              </Text>
            </View>
          </View>

          {/* Question Content */}
          <Text className="text-sm text-[#444] leading-5">
            {thread?.content}
          </Text>
          </View>
        </View>

        {/* Answers */}
        <Text className="text-xs text-[#aaa] mb-3">
          回覆 {answers?.length ?? 0}
        </Text>

        {sortedAnswers.map((ans) => (
          <View
            key={ans.id}
            className="bg-white rounded-2xl p-4 mb-3"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }}
          >

            {/* Instructor badge */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Image
                  source={
                    ans.author?.avatar
                      ? { uri: ans.author.avatar.startsWith('http') ? ans.author.avatar : `${API_BASE}${ans.author.avatar}` }
                      : require('../../../../assets/avatar-default.jpg')
                  }
                  className="w-8 h-8 rounded-full mr-2"
                />

                <Text className="text-sm font-semibold text-navy">
                  {ans.author.displayName}
                </Text>

                {ans.isOfficial && (
                  <View className="ml-2 px-2 py-0.5 rounded-full bg-green-100">
                    <Text className="text-green-600 text-[10px] font-semibold">
                      ⭐ 老師解答
                    </Text>
                  </View>
                )}
              </View>

                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() => toggleUpvote(ans.id)}
                >
                  <Ionicons
                    name={ans.hasUpvoted ? 'heart' : 'heart-outline'}
                    size={14}
                    color={ans.hasUpvoted ? '#F56565' : '#aaa'}
                  />
                  <Text className={`text-xs ${ans.hasUpvoted ? 'text-[#F56565]' : 'text-[#aaa]'}`}>
                    {ans._count?.upvotes ?? 0}
                  </Text>
                </TouchableOpacity>
            </View>

            {/* Answer text */}
            <Text className="text-sm text-[#555] leading-5 mb-3">
              {ans.content}
            </Text>
            

            {/* Comments */}
            {ans.comments && ans.comments.length > 0 && (
              <View className="border-t border-[#eee] pt-2 mt-2">
                {ans.comments.map((c) => (
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
                        <Text className="text-xs font-medium text-[#666]">
                          {c.author.displayName}
                        </Text>

                        <Text className="text-sm text-[#555]">
                          {c.content}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View className="mt-3 flex-row items-center">
              <TextInput
                placeholder="回覆這則解答..."
                value={replyTexts[ans.id] ?? ''}
                onChangeText={(text) =>
                  setReplyTexts((prev) => ({
                    ...prev,
                    [ans.id]: text,
                  }))
                }
                className="flex-1 bg-[#F5F5F5] rounded-full px-4 py-2 text-sm"
              />

              <TouchableOpacity
                className="ml-2 w-9 h-9 rounded-full bg-brand items-center justify-center"
                onPress={async () => {
                  const text = replyTexts[ans.id]?.trim();
                  if (!text) return;
                  await addReply(ans.id, text);
                  setReplyTexts((prev) => ({ ...prev, [ans.id]: '' }));
                }}
              >
                <Ionicons
                  name="send"
                  size={14}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* INPUT BAR */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#eee] px-3 py-2 flex-row items-center"
        style={{ paddingBottom: insets.bottom }}
      >
        <TextInput
          placeholder="寫下你的回覆..."
          value={newAnswerText}
          onChangeText={setNewAnswerText}
          className="flex-1 bg-[#f5f5f5] rounded-full px-4 py-2 text-sm"
        />

        <TouchableOpacity
          className="ml-2 w-10 h-10 rounded-full bg-brand items-center justify-center"
          onPress={async () => {
            const text = newAnswerText.trim();
            if (!text) return;
            await addAnswer(text);
            setNewAnswerText('');
          }}
        >
          <Ionicons name="send" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default ThreadDetail;