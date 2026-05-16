import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ImageSourcePropType, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface ThreadPostProps {
  avatar: string | ImageSourcePropType | null;
  name: string;
  handle: string;
  time: string;
  content: string;
  images?: string[];
  commentsCount: number;
  likesCount: number;
  likedByMe: boolean;
  TeacherName?: string;
  onPressThread?: () => void;
  onPressAuthor?: () => void;
  onPressLike?: () => void;
}

const ThreadPost: React.FC<ThreadPostProps> = ({
  avatar,
  name,
  handle,
  time,
  content,
  images,
  commentsCount,
  likesCount,
  likedByMe,
  TeacherName,
  onPressThread,
  onPressAuthor,
  onPressLike,
}) => {
  const avatarSource = typeof avatar === 'string'
    ? { uri: avatar }
    : avatar ?? require('../../assets/avatar-default.jpg');

  return (
    <TouchableOpacity
      className="flex-row p-4 bg-white border-b border-[#f0f0f0]"
      onPress={onPressThread}
      activeOpacity={0.85}
    >
      {/* 左側：頭像 */}
      <TouchableOpacity className="items-center mr-3 w-12" onPress={onPressAuthor} activeOpacity={0.7}>
        <Image source={avatarSource as any} className="w-12 h-12 rounded-full bg-gray-200" />
      </TouchableOpacity>

      {/* 右側：內容 */}
      <View className="flex-1">
        {/* 老師評語（有值才顯示） */}
        {TeacherName && (
          <View className="flex-row items-center mb-1.5">
            <Image
              source={require('../../assets/icons/coin.png')}
              className="w-[18px] h-[18px] mr-1"
              resizeMode="contain"
            />
            <Text className="text-sm font-bold text-gray-700">{TeacherName}老師覺得很棒ㄛ!</Text>
          </View>
        )}

        {/* Header */}
        <View className="flex-row items-center mb-1">
          <TouchableOpacity onPress={onPressAuthor} activeOpacity={0.7}>
            <Text className="font-bold text-base text-black">{name}</Text>
          </TouchableOpacity>
          <Text className="text-[#666] text-sm ml-1.5">{handle}</Text>
          <Text className="text-[#666] mx-1">·</Text>
          <Text className="text-[#666] text-sm">{time}</Text>
          <Ionicons name="chevron-down" size={16} color="#999" style={{ marginLeft: 'auto' }} />
        </View>

        {/* 內文 */}
        <Text className="text-base leading-6 text-[#14171a] mb-2.5">{content}</Text>

        {/* 圖片 */}
        {images && images.length > 0 && (
          <View className="mb-2.5">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((imgUri, index) => (
                <Image
                  key={index}
                  source={{ uri: imgUri }}
                  className="w-[200px] h-[150px] rounded-[10px] mr-2.5 bg-[#f0f0f0]"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* 互動按鈕 */}
        <View className="flex-row items-center">
          <TouchableOpacity
            className="flex-row items-center mr-[30px] py-1"
            onPress={onPressThread}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#666" />
            <Text className="ml-[6px] text-[#666] text-sm">{commentsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center mr-[30px] py-1"
            onPress={onPressLike}
          >
            <Ionicons
              name={likedByMe ? 'heart' : 'heart-outline'}
              size={22}
              color={likedByMe ? '#e53e3e' : '#666'}
            />
            {likesCount > 0 && (
              <Text className="ml-[6px] text-[#666] text-sm">{likesCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ThreadPost;
