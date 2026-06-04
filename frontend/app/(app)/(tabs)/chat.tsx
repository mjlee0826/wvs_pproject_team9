import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Image, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ROOMS = [
  {
    id: '1',
    name: '數學咖啡廳',
    emoji: '➕',
    color: '#4FD1C5',
    bg: '#E0F7FA',
    desc: '算術、代數、幾何都歡迎！',
    online: 12,
    lastMsg: '有人會這題嗎？',
    lastTime: '剛剛',
    unread: 3,
  },
  {
    id: '2',
    name: '英文咖啡廳',
    emoji: '🔤',
    color: '#65A1FB',
    bg: '#EBF4FF',
    desc: '文法、口說、閱讀，一起練習！',
    online: 8,
    lastMsg: 'Let\'s practice together~',
    lastTime: '2分鐘',
    unread: 0,
  },
  {
    id: '3',
    name: '自然科學廳',
    emoji: '🔬',
    color: '#68D391',
    bg: '#F0FFF4',
    desc: '物理化學生物，一起討論實驗！',
    online: 5,
    lastMsg: '這個實驗好有趣！',
    lastTime: '10分鐘',
    unread: 1,
  },
  {
    id: '4',
    name: '社會人文廳',
    emoji: '🌏',
    color: '#F6AD55',
    bg: '#FFFAF0',
    desc: '歷史地理公民，輕鬆聊時事！',
    online: 3,
    lastMsg: '今天考試考了這個',
    lastTime: '30分鐘',
    unread: 0,
  },
  {
    id: '5',
    name: '休息放鬆廳',
    emoji: '☕',
    color: '#FC8181',
    bg: '#FFF5F5',
    desc: '不聊功課！純聊天放鬆的地方。',
    online: 20,
    lastMsg: '今天天氣真好～',
    lastTime: '1分鐘',
    unread: 7,
  },
];

const ONLINE_AVATARS = ['🐻', '🐨', '🐼', '🐸', '🦊'];

export default function ChatScreen() {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      {/* 頂部漸層橫幅 */}
      <LinearGradient
        colors={['#65A1FB', '#4FD1C5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
      >
        <Text className="text-white text-2xl font-bold mb-1">咖啡廳</Text>
        <Text className="text-white/80 text-sm">選一個主題聊天室，和大家一起討論！</Text>

        {/* 在線人數小卡 */}
        <View
          className="flex-row items-center mt-4 bg-white/20 rounded-2xl px-4 py-2.5 self-start"
        >
          <View className="flex-row mr-2">
            {ONLINE_AVATARS.map((a, i) => (
              <View
                key={i}
                className="w-7 h-7 rounded-full bg-white/40 justify-center items-center"
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                <Text style={{ fontSize: 14 }}>{a}</Text>
              </View>
            ))}
          </View>
          <Text className="text-white text-xs font-semibold">現在共 48 人在線</Text>
        </View>
      </LinearGradient>

      {/* 聊天室列表 */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: -16 }}
      >
        {ROOMS.map((room) => (
          <TouchableOpacity
            key={room.id}
            activeOpacity={0.85}
            onPress={() => setActiveRoom(room.id === activeRoom ? null : room.id)}
            className="mb-3 rounded-2xl overflow-hidden bg-white"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 }}
          >
            <View className="flex-row items-center p-4">
              {/* 主題圖示 */}
              <View
                className="w-14 h-14 rounded-2xl justify-center items-center mr-3"
                style={{ backgroundColor: room.bg }}
              >
                <Text style={{ fontSize: 26 }}>{room.emoji}</Text>
              </View>

              {/* 內容 */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text className="text-base font-bold text-navy">{room.name}</Text>
                  <Text className="text-xs text-[#aaa]">{room.lastTime}</Text>
                </View>

                <Text className="text-xs text-[#aaa] mb-1">{room.desc}</Text>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-[#666]" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
                    {room.lastMsg}
                  </Text>
                  {room.unread > 0 ? (
                    <View
                      className="w-5 h-5 rounded-full justify-center items-center"
                      style={{ backgroundColor: room.color }}
                    >
                      <Text className="text-white text-[10px] font-bold">{room.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* 在線人數條 */}
            <View
              className="flex-row items-center px-4 py-2"
              style={{ backgroundColor: room.bg }}
            >
              <View
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: room.color }}
              />
              <Text className="text-xs font-medium" style={{ color: room.color }}>
                {room.online} 人正在聊天
              </Text>
              <View className="flex-1" />
              <Text className="text-xs" style={{ color: room.color }}>
                進入聊天室 →
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* 底部提示 */}
        <View className="items-center mt-4 mb-2">
          <View className="flex-row items-center gap-2 bg-brand-banner px-4 py-2.5 rounded-full">
            <Text style={{ fontSize: 16 }}>🐻</Text>
            <Text className="text-xs text-brand font-medium">所有聊天都受到老師監督，請友善發言！</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}