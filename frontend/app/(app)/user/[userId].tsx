import { View, Text, Image, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useUser } from '../../../src/hooks/useUser';
import ThreadPost from '../../../src/features/post/components/ThreadPost';
import ThreadCard from '../../../src/features/questions/components/ThreadCard';
import LoadingScreen from '../../../src/components/LoadingScreen';
import { postApi } from '../../../src/features/post/services/postApi';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

const COIN_TARGET = 50;

const coinPrizes = [
  { id: 1, coins: 50, title: '和世界志工社的老師們一起去郊遊~~' },
  { id: 2, coins: 30, title: '價值非凡的大驚喜！' },
  { id: 3, coins: 15, title: '小獎品~下一季一起加油！' },
];

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user, posts, threads, loading } = useUser(userId);
  const { user: currentUser } = useUser('me');
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'posts' | 'threads' | 'coins'>('posts');

  const isAdmin = currentUser?.role === 'admin';
  const avatarUri = user?.avatar ? `${API_BASE}${user.avatar}` : null;

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
    } catch {
      Alert.alert('錯誤', '操作失敗，請稍後再試');
    }
  };

  if (loading && !user) return <LoadingScreen />;

  const coins = user?.coins ?? 0;
  const progress = Math.min(coins / COIN_TARGET, 1);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* 青色橫幅 */}
        <View className="h-[120px] bg-brand-banner" />

        {/* 個人資料區 */}
        <View className="px-5 mb-5 items-start">
          <View className="w-20 h-20 rounded-full overflow-hidden -mt-10 mb-2.5 border-4 border-white bg-white">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-full h-full" />
            ) : (
              <View className="w-full h-full bg-blue-100 justify-center items-center">
                <Text className="text-blue-700 font-bold text-[28px]">
                  {user?.displayName.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-lg font-bold text-black mb-0.5">
            {user?.displayName ?? '使用者'}
          </Text>
          <Text className="text-sm text-[#888] mb-2">@{user?.id?.slice(0, 12) ?? 'user'}</Text>

          <View
            className={`px-2.5 py-[3px] rounded-xl ${user?.role === 'admin' ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            <Text
              className={`text-xs font-semibold ${user?.role === 'admin' ? 'text-blue-700' : 'text-gray-600'}`}
            >
              {user?.role === 'admin' ? '老師' : '學生'}
            </Text>
          </View>
        </View>

        {/* 分頁列 */}
        <View className="flex-row border-b border-[#E0E0E0] bg-white">
          {(['posts', 'threads', 'coins'] as const).map((tab) => {
            const label = tab === 'posts' ? '貼文' : tab === 'threads' ? '提問' : '金幣庫';
            return (
              <TouchableOpacity
                key={tab}
                className={`flex-1 py-[15px] items-center border-b-[3px] ${activeTab === tab ? 'border-brand' : 'border-transparent'}`}
                onPress={() => setActiveTab(tab)}
              >
                <Text className={`text-base ${activeTab === tab ? 'text-black font-bold' : 'text-[#888]'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 貼文 tab */}
        {activeTab === 'posts' && (
          loading ? (
            <View className="p-10 items-center">
              <ActivityIndicator size="large" color="#4FD1C5" />
            </View>
          ) : posts.length === 0 ? (
            <View className="p-10 items-center">
              <Text className="text-[15px] text-gray-400">此用戶尚無貼文</Text>
            </View>
          ) : (
            posts.map((post) => {
              const pAvatarUri = post.author.avatar ? `${API_BASE}${post.author.avatar}` : null;
              const pImageUri = post.imageUrl ? `${API_BASE}${post.imageUrl}` : undefined;
              const likedByMe = currentUser ? (post.likes ?? []).some((l) => l.teacherId === currentUser.id) : false;
              return (
                <ThreadPost
                  key={post.id}
                  avatar={pAvatarUri}
                  name={post.author.displayName}
                  handle={`@${post.author.id.slice(0, 8)}`}
                  time={new Date(post.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                  content={`${post.title}\n\n${post.content}`}
                  images={pImageUri ? [pImageUri] : []}
                  commentsCount={post._count?.comments ?? 0}
                  likesCount={(post.likes ?? []).length}
                  likedByMe={likedByMe}
                  onPressThread={() => router.push(`/(app)/(tabs)/home/${post.id}`)}
                  onPressAuthor={() => router.push(`/(app)/user/${post.author.id}`)}
                  onPressLike={() => handleLike(post.id, likedByMe)}
                />
              );
            })
          )
        )}

        {/* 提問 tab */}
        {activeTab === 'threads' && (
          loading ? (
            <View className="p-10 items-center">
              <ActivityIndicator size="large" color="#4FD1C5" />
            </View>
          ) : threads.length === 0 ? (
            <View className="p-10 items-center">
              <Text className="text-[15px] text-gray-400">此用戶尚無提問</Text>
            </View>
          ) : (
            <View className="pt-4">
              {threads.map((thread) => <ThreadCard key={thread.id} item={thread} />)}
            </View>
          )
        )}

        {/* 金幣庫 tab */}
        {activeTab === 'coins' && (
          <View className="p-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[15px] text-black font-bold">這一季的累積獎金......！</Text>
              <Text className="text-[15px] text-black font-bold">{coins}/{COIN_TARGET}</Text>
            </View>
            <View className="mb-[30px]">
              <View className="h-6 bg-gray-200 rounded-xl overflow-hidden">
                <View
                  className="h-full bg-amber-400 rounded-xl"
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
            </View>
            <View className="gap-5">
              {coinPrizes.map((item) => (
                <View key={item.id} className="flex-row items-center gap-[15px]">
                  <View className="w-[100px] h-[60px] rounded-xl bg-brand-banner justify-center items-center">
                    <Image
                      source={require('../../../assets/icons/coin.png')}
                      style={{ width: 40, height: 40 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View className="bg-[#F5F0E6] px-3 py-2 rounded-lg min-w-[40px] items-center">
                    <Text className="text-base font-bold text-black">{item.coins}</Text>
                  </View>
                  <Text className="flex-1 text-sm text-[#333] leading-5 font-medium">{item.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
