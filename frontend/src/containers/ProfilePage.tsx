import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLogto } from '@logto/rn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThreadPost from '@/features/post/components/ThreadPost';
import Loading from '@/components/Loading';
import { useUser } from '@/hooks/useUser';
import { userApi } from '@/services/userApi';
import { postApi } from '@/features/post/services/postApi';
import { clearAllCache } from '@/utils/asyncStorage';
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

const mockCoinItems = [
  { id: 1, coins: 50, title: '和世界志工社的老師們一起去郊遊~~' },
  { id: 2, coins: 30, title: '價值非凡的大驚喜！' },
  { id: 3, coins: 15, title: '小獎品~下一季一起加油！' },
];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [tabsOffsetY, setTabsOffsetY] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const { user, posts, loading, refetch, refetchPosts } = useUser('me');
  const { signOut } = useLogto();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refetchPosts();
    }, [refetchPosts])
  );

  const isAdmin = user?.role === 'admin';

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
      await refetch();
    } catch {
      Alert.alert('錯誤', '操作失敗，請稍後再試');
    }
  };

  const avatarUri = user?.avatar ? `${API_BASE}${user.avatar}` : null;

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (result.canceled) return;
    try {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() ?? 'avatar.jpg';
      const type = `image/${filename.split('.').pop()}`;
      const formData = new FormData();
      formData.append('avatar', { uri: asset.uri, name: filename, type } as unknown as Blob);
      await userApi.updateMe(formData);
      refetch();
    } catch {
      Alert.alert('錯誤', '頭像更新失敗');
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('displayName', newName.trim());
      await userApi.updateMe(formData);
      setEditModalVisible(false);
      refetch();
    } catch {
      Alert.alert('錯誤', '名稱更新失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await clearAllCache();
    await signOut(process.env.EXPO_PUBLIC_LOGTO_REDIRECT_URI!);
    router.replace('/');
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsTabsSticky(scrollY >= tabsOffsetY);
  };

  if (loading && !user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4FD1C5" />
      </View>
    );
  }

  const Tabs = () => (
    <View className="flex-row border-b border-[#E0E0E0] bg-white">
      <TouchableOpacity
        className={`flex-1 py-[15px] items-center border-b-[3px] ${activeTab === 'posts' ? 'border-brand' : 'border-transparent'}`}
        onPress={() => setActiveTab('posts')}
      >
        <Text className={`text-base ${activeTab === 'posts' ? 'text-black font-bold' : 'text-[#888]'}`}>
          貼文
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 py-[15px] items-center border-b-[3px] ${activeTab === 'coins' ? 'border-brand' : 'border-transparent'}`}
        onPress={() => setActiveTab('coins')}
      >
        <Text className={`text-base ${activeTab === 'coins' ? 'text-black font-bold' : 'text-[#888]'}`}>
          金幣庫
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#4FD1C5" />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* 頂部青色橫幅 */}
          <LinearGradient
            colors={['#4FD1C5', '#65A1FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: 120,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
              paddingTop: 52,
              paddingRight: 16,
            }}
          >
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                backgroundColor: 'rgb(255, 103, 103)', // bubble color
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,         // pill shape
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,             // subtle shadow for Android
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                登出
              </Text>
            </TouchableOpacity>
          </LinearGradient>
                    
          {/* 個人資料區 */}
          <View className="px-5 mb-5">
            {/* 頭像 */}
            <TouchableOpacity
              onPress={handlePickAvatar}
              className="w-20 h-20 rounded-full overflow-hidden -mt-10 mb-2.5 border-4 border-white bg-white"
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} className="w-full h-full" />
              ) : (
                <Image source={require('../../assets/avatar-default.jpg')} className="w-full h-full" />
              )}
              <View className="absolute bottom-0 right-0 bg-brand w-5 h-5 rounded-full justify-center items-center">
                <Ionicons name="camera-outline" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* 名稱 + 編輯按鈕 */}
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="text-lg font-bold text-black mb-0.5">
                  {user?.displayName ?? '使用者'}
                </Text>
                <Text className="text-sm text-[#888]">@{user?.id?.slice(0, 12) ?? 'user'}</Text>
              </View>
              <TouchableOpacity
                className="border border-[#D3D3D3] rounded-full px-4 py-1.5"
                onPress={() => { setNewName(user?.displayName ?? ''); setEditModalVisible(true); }}
              >
                <Text className="text-sm text-black font-semibold">編輯資料</Text>
              </TouchableOpacity>
            </View>

            {/* 角色標籤 */}
            <View className="mt-1">
              <View
                className={`px-2.5 py-[3px] rounded-xl self-start ${user?.role === 'admin' ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                <Text
                  className={`text-xs font-semibold ${user?.role === 'admin' ? 'text-blue-700' : 'text-gray-600'}`}
                >
                  {user?.role === 'admin' ? '老師' : '學生'}
                </Text>
              </View>
            </View>
          </View>

          {/* 分頁佔位（sticky 時補高） */}
          {isTabsSticky && <View className="h-[50px]" />}

          {/* 分頁列 */}
          <View onLayout={(e) => setTabsOffsetY(e.nativeEvent.layout.y)}>
            <Tabs />
          </View>

          {/* 內容區 */}
          {activeTab === 'posts' ? (
            <View>
              {posts.length === 0 ? (
                <View className="p-10 items-center">
                  <Text className="text-base text-[#999]">尚無貼文</Text>
                </View>
              ) : (
                posts.map((post) => {
                  const pAvatarUri = post.author.avatar ? `${API_BASE}${post.author.avatar}` : null;
                  const pImageUri = post.imageUrl ? `${API_BASE}${post.imageUrl}` : undefined;
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
                      likedByMe={user ? (post.likes ?? []).some((l) => l.teacherId === user.id) : false}
                      onPressThread={() => router.push(`/(app)/(tabs)/home/${post.id}`)}
                      onPressAuthor={() => router.push(`/(app)/user/${post.author.id}`)}
                      onPressLike={() => handleLike(post.id, user ? (post.likes ?? []).some((l) => l.teacherId === user.id) : false)}
                    />
                  );
                })
              )}
            </View>
          ) : (
            <View className="p-5">
              {(() => {
                const coins = user?.coins ?? 0;
                const target = 50;
                const progress = Math.min(coins / target, 1);
                return (
                  <>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-[15px] text-black font-bold">這一季的累積獎金......！</Text>
                      <Text className="text-[15px] text-black font-bold">{coins}/{target}</Text>
                    </View>
                    <View className="mb-[30px]">
                      <View className="h-6 bg-gray-200 rounded-xl overflow-hidden">
                        <View
                          className="h-full bg-amber-400 rounded-xl"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </View>
                    </View>
                  </>
                );
              })()}
              <View className="gap-5">
                {mockCoinItems.map((item) => (
                  <View key={item.id} className="flex-row items-center gap-[15px]">
                    <View className="w-[100px] h-[60px] rounded-xl bg-brand-banner justify-center items-center">
                      <Image
                        source={require('../../assets/icons/coin.png')}
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

        {/* Sticky 分頁列 */}
        {isTabsSticky && (
          <View className="absolute top-0 left-0 right-0 flex-row border-b border-[#E0E0E0] bg-white z-10">
            <Tabs />
          </View>
        )}
      </View>

      {/* 編輯名稱 Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-8">
          <View className="bg-white rounded-[20px] p-6 w-full">
            <Text className="text-base font-semibold text-[#111] mb-4">編輯顯示名稱</Text>
            <TextInput
              className="border border-brand rounded-xl px-4 py-3 text-base mb-4 bg-[#FDF6E3]"
              value={newName}
              onChangeText={setNewName}
              maxLength={50}
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-[#D9E2FF] rounded-xl py-3 items-center bg-[#D9E2FF]"
                onPress={() => setEditModalVisible(false)}
              >
                <Text className="text-gray-700 font-medium">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#2B6CB0] rounded-xl py-3 items-center"
                onPress={handleSaveName}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">儲存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ProfilePage;
