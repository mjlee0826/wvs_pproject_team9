import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuestions } from '../hooks/useQuestions';
import { Thread } from '../services/questionApi';
import {
  ScrollView,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUBJECTS = ['全部', '數學', '英文', '自然', '國文', '社會', '其他'];
// Initially threads are loaded from backend via hook

const FORM_SUBJECTS = SUBJECTS.filter((s) => s !== '全部');

export default function QAPage() {
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const { threads, loading, refreshing, hasNextPage, loadMore, refresh, subject, setSubject, createThread } = useQuestions('全部');
  const insets = useSafeAreaInsets();
  const filtered = threads;

  const [showModal, setShowModal] = useState(false);
  const [formSubject, setFormSubject] = useState(FORM_SUBJECTS[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setSubmitting(true);
    try {
      await createThread({ subject: formSubject, title: formTitle.trim(), content: formContent.trim() });
      setShowModal(false);
      setFormTitle('');
      setFormContent('');
      setFormSubject(FORM_SUBJECTS[0]);
    } catch (err) {
      console.error('[QAPage] 新增討論失敗:', err);
    } finally {
      setSubmitting(false);
    }
  };
      
  const renderPost = ({ item }: { item: Thread }) => {
    const resolved = item.resolved;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/questions/${item.id}`)}
        className="bg-white rounded-2xl mb-4 overflow-hidden"
        style={{
          marginHorizontal: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        {/* TOP BAR */}
        <View
          style={{
            height: 4,
            backgroundColor: resolved ? '#68D391' : '#F6AD55',
          }}
        />

        <View className="p-4">

          {/* STATUS + SUBJECT */}
          <View className="flex-row items-center justify-between mb-2">
            <View
              className={`px-2 py-0.5 rounded-full ${
                resolved ? 'bg-green-100' : 'bg-orange-100'
              }`}
            >
              <Text
                className={`text-[10px] font-semibold ${
                  resolved ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {resolved ? '已解決' : '待解決'}
              </Text>
            </View>

            <Text className="text-xs text-[#aaa]">
              {item.subject}
            </Text>
          </View>

          <Text className="text-base font-bold text-navy mb-1">
            {item.title}
          </Text>

          <Text
            className="text-sm text-[#555] mb-3"
            numberOfLines={2}
          >
            {item.content}
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-7 h-7 rounded-full items-center justify-center bg-[#65A1FB22]">
                <Text style={{ fontSize: 12 }}>🎓</Text>
              </View>

              <Text className="text-xs text-[#888]">
                {item.author?.displayName} · {item.createdAt}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color="#aaa"
              />
              <Text className="text-xs text-[#aaa]">
                {item._count?.answers ?? 0} 則回覆
              </Text>
            </View>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      {/* HEADER */}
      <LinearGradient
        colors={['#4FD1C5', '#65A1FB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <Text className="text-white text-2xl font-bold mb-1">
          課程問答
        </Text>

        <Text className="text-white/80 text-sm">
          提出問題，與老師一起解決
        </Text>
      </LinearGradient>

      {/* FILTERS */}
      <View style={{ marginTop: -14 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          {SUBJECTS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                setSelectedSubject(s);
                setSubject(s === '全部' ? undefined : s);
              }}
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedSubject === s
                  ? 'bg-brand'
                  : 'bg-white border border-brand-light'
              }`}
              style={
                selectedSubject === s
                  ? {
                      shadowColor: '#4FD1C5',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.35,
                      shadowRadius: 6,
                      elevation: 4,
                    }
                  : {}
              }
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedSubject === s
                    ? 'text-white'
                    : 'text-[#666]'
                }`}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="px-4 pt-2">
        <Text className="text-xs text-[#aaa] mb-3">
          共 {filtered.length} 則討論
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPost}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
        }}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => {
          if (hasNextPage) loadMore();
        }}
        onEndReachedThreshold={0.5}
      />

      {/* FLOATING BUTTON */}
      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-brand items-center justify-center"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* NEW THREAD MODAL */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <View
            className="bg-white rounded-t-3xl"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            {/* Sheet header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-[#eee]">
              <Text className="text-base font-bold text-navy">新增討論</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#888" />
              </TouchableOpacity>
            </View>

            <View className="px-5 pt-4 gap-4">
              {/* Subject picker */}
              <View>
                <Text className="text-xs font-semibold text-[#666] mb-2">科目</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {FORM_SUBJECTS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setFormSubject(s)}
                      className={`mr-2 px-4 py-2 rounded-full ${
                        formSubject === s ? 'bg-brand' : 'bg-[#f0f0f0]'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          formSubject === s ? 'text-white' : 'text-[#666]'
                        }`}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Title */}
              <View>
                <Text className="text-xs font-semibold text-[#666] mb-2">標題</Text>
                <TextInput
                  placeholder="簡短描述你的問題"
                  value={formTitle}
                  onChangeText={setFormTitle}
                  maxLength={100}
                  className="bg-[#f5f5f5] rounded-xl px-4 py-3 text-sm text-[#333]"
                />
              </View>

              {/* Content */}
              <View>
                <Text className="text-xs font-semibold text-[#666] mb-2">內容</Text>
                <TextInput
                  placeholder="詳細說明你的問題..."
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-[#f5f5f5] rounded-xl px-4 py-3 text-sm text-[#333]"
                  style={{ minHeight: 100 }}
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !formTitle.trim() || !formContent.trim()}
                className="rounded-xl py-3 items-center justify-center bg-brand mt-1"
                style={{ opacity: submitting || !formTitle.trim() || !formContent.trim() ? 0.5 : 1 }}
              >
                {submitting
                  ? <ActivityIndicator color="white" />
                  : <Text className="text-white font-semibold">發佈問題</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}