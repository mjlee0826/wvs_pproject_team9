import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuestion } from '../hooks/useQuestion';
import { useUser } from '../../../hooks/useUser';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnswerItem from '../components/AnswerItem';
import QuestionCard from '../components/QuestionCard';

const ThreadDetail = () => {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const threadIdNum = threadId ? Number(threadId) : undefined;
  const insets = useSafeAreaInsets();
  const { thread, answers, loading, addAnswer, addReply, toggleResolve, toggleUpvote } = useQuestion(threadIdNum);
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
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-white text-xl font-bold">{thread?.title ?? ''}</Text>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-white/80 text-xs">{thread?.subject} · {thread?.author?.displayName}</Text>

          {canResolve ? (
            <TouchableOpacity
              onPress={toggleResolve}
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: statusColors.background }}
            >
              <Text className="text-[10px] font-semibold" style={{ color: statusColors.main }}>
                {resolved ? '已解決' : '待解決'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="px-2 py-1 rounded-full" style={{ backgroundColor: statusColors.background }}>
              <Text className="text-[10px] font-semibold" style={{ color: statusColors.main }}>
                {resolved ? '已解決' : '待解決'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
      >
        {thread && <QuestionCard thread={thread} statusColors={statusColors} />}

        <Text className="text-xs text-[#aaa] mb-3">回覆 {answers?.length ?? 0}</Text>

        {sortedAnswers.map((ans) => (
          <AnswerItem
            key={ans.id}
            answer={ans}
            replyText={replyTexts[ans.id] ?? ''}
            onChangeReplyText={(text) => setReplyTexts((prev) => ({ ...prev, [ans.id]: text }))}
            onSubmitReply={async () => {
              const text = replyTexts[ans.id]?.trim();
              if (!text) return;
              await addReply(ans.id, text);
              setReplyTexts((prev) => ({ ...prev, [ans.id]: '' }));
            }}
            onToggleUpvote={() => toggleUpvote(ans.id)}
          />
        ))}
      </ScrollView>

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
};

export default ThreadDetail;
