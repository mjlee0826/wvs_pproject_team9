import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BlueButton from '@/components/BlueButton';
import CreatePostModal from '@/components/CreatePostModal';
import Loading from '@/components/Loading';
import ThreadPost from '@/components/ThreadPost';
import { usePosts } from '@/hooks/usePosts';
import { useUser } from '@/hooks/useUser';
import { postApi } from '@/services/postApi';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

const MainPage = () => {
  const { posts, loading, refreshing, hasNextPage, loadMore, refresh, silentRefresh } = usePosts();
  const { user: currentUser } = useUser('me');
  const [isModalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isAdmin = currentUser?.role === 'admin';

  const handleLike = async (postId: number, alreadyLiked: boolean) => {
    if (!isAdmin) {
      Alert.alert('無法按讚', '只有老師可以幫學生的貼文按讚喔！');
      return;
    }
    try {
      if (alreadyLiked) {
        await postApi.unlikePost(postId);
      } else {
        await postApi.likePost(postId);
      }
      await silentRefresh();
    } catch {
      Alert.alert('錯誤', '操作失敗，請稍後再試');
    }
  };

  const handleModalSubmit = async (data: { category: string; content: string; imageUri: string | null }) => {
    setSubmitting(true);
    setModalVisible(false);
    try {
      const formData = new FormData();
      formData.append('title', data.category);
      formData.append('content', data.content);
      if (data.imageUri) {
        const filename = data.imageUri.split('/').pop() ?? 'photo.jpg';
        const type = `image/${filename.split('.').pop()}`;
        formData.append('image', { uri: data.imageUri, name: filename, type } as unknown as Blob);
      }
      await postApi.createPost(formData);
      await refresh();
    } catch {
      Alert.alert('錯誤', '發布失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {submitting && <Loading text="發布貼文中..." />}
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const avatarUri = item.author.avatar ? `${API_BASE}${item.author.avatar}` : null;
            const imageUri = item.imageUrl ? `${API_BASE}${item.imageUrl}` : undefined;
            const likedByMe = currentUser
              ? (item.likes ?? []).some((l) => l.teacherId === currentUser.id)
              : false;
            return (
              <ThreadPost
                avatar={avatarUri}
                name={item.author.displayName}
                handle={`@${item.author.id.slice(0, 8)}`}
                time={new Date(item.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                content={`${item.title}\n\n${item.content}`}
                images={imageUri ? [imageUri] : []}
                commentsCount={item._count?.comments ?? 0}
                likesCount={(item.likes ?? []).length}
                likedByMe={likedByMe}
                onPressThread={() => router.push(`/(app)/(tabs)/home/${item.id}`)}
                onPressAuthor={() => router.push(`/(app)/user/${item.author.id}`)}
                onPressLike={() => handleLike(item.id, likedByMe)}
              />
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4FD1C5" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        />

        <BlueButton
          onPress={() => setModalVisible(true)}
          bottom={insets.bottom}
        />

        <CreatePostModal
          visible={isModalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleModalSubmit}
        />
      </View>
    </>
  );
};

export default MainPage;
