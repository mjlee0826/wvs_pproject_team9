import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuestions } from '../hooks/useQuestions';
import { Thread } from '../services/questionApi';
import NewThreadModal from '../components/NewThreadModal';
import QAListHeader from '../components/QAListHeader';
import ThreadCard from '../components/ThreadCard';

export default function QAPage() {
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const { threads, loading, refreshing, hasNextPage, loadMore, refresh, setSubject, createThread } = useQuestions('全部');
  const insets = useSafeAreaInsets();

  const [showModal, setShowModal] = useState(false);

  const handleSelectSubject = (s: string) => {
    setSelectedSubject(s);
    setSubject(s === '全部' ? undefined : s);
  };

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={threads}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }: { item: Thread }) => <ThreadCard item={item} />}
        ListHeaderComponent={
          <QAListHeader
            threadCount={threads.length}
            selectedSubject={selectedSubject}
            onSelectSubject={handleSelectSubject}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => { if (hasNextPage) loadMore(); }}
        onEndReachedThreshold={0.5}
      />

      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-brand items-center justify-center"
        style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <NewThreadModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={createThread}
      />
    </View>
  );
}
