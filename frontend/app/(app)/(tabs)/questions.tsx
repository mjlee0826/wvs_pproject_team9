import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUBJECTS = ['全部', '數學', '英文', '自然', '國文', '社會'];

const MOCK_TUTORS = [
  {
    id: '1',
    name: '小明老師',
    subjects: ['數學', '自然'],
    rating: 4.9,
    sessions: 128,
    intro: '台大數學系，擅長從基礎概念建立解題思路。',
    available: true,
  },
  {
    id: '2',
    name: '雅婷老師',
    subjects: ['英文'],
    rating: 4.8,
    sessions: 96,
    intro: '師大英語系，口說寫作都能輕鬆教！',
    available: true,
  },
  {
    id: '3',
    name: '志豪老師',
    subjects: ['國文', '社會'],
    rating: 4.7,
    sessions: 64,
    intro: '政大中文系，作文寫作必勝攻略。',
    available: false,
  },
  {
    id: '4',
    name: '佳蓉老師',
    subjects: ['數學', '英文'],
    rating: 5.0,
    sessions: 212,
    intro: '清大跨域雙主修，理科英文一次搞定。',
    available: true,
  },
];

const AVATAR_COLORS = ['#4FD1C5', '#65A1FB', '#F6AD55', '#FC8181', '#68D391'];

export default function QuestionsScreen() {
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const insets = useSafeAreaInsets();

  const filtered = selectedSubject === '全部'
    ? MOCK_TUTORS
    : MOCK_TUTORS.filter(t => t.subjects.includes(selectedSubject));

  return (
    <View className="flex-1 bg-white">
      {/* 頂部漸層橫幅 */}
      <LinearGradient
        colors={['#4FD1C5', '#65A1FB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 28, paddingHorizontal: 20 }}
      >
        <Text className="text-white text-2xl font-bold mb-1">找家教</Text>
        <Text className="text-white/80 text-sm">選擇科目，預約專屬老師</Text>
      </LinearGradient>

      {/* 科目篩選列 */}
      <View style={{ marginTop: -14 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        >
          {SUBJECTS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSelectedSubject(s)}
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedSubject === s
                  ? 'bg-brand'
                  : 'bg-white border border-brand-light'
              }`}
              style={
                selectedSubject === s
                  ? { shadowColor: '#4FD1C5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 }
                  : {}
              }
            >
              <Text className={`text-sm font-semibold ${selectedSubject === s ? 'text-white' : 'text-[#666]'}`}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 老師卡片列表 */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-xs text-[#aaa] mb-3">共 {filtered.length} 位老師</Text>
        {filtered.map((tutor, idx) => (
          <TouchableOpacity
            key={tutor.id}
            activeOpacity={0.85}
            className="bg-white rounded-2xl mb-4 overflow-hidden"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
          >
            {/* 卡片頂部彩色條 */}
            <View style={{ height: 4, backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }} />

            <View className="p-4">
              <View className="flex-row items-center mb-3">
                {/* 頭像 */}
                <View
                  className="w-14 h-14 rounded-full justify-center items-center mr-3"
                  style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] + '22' }}
                >
                  <Text style={{ fontSize: 26 }}>🐻</Text>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-0.5">
                    <Text className="text-base font-bold text-navy">{tutor.name}</Text>
                    {tutor.available ? (
                      <View className="bg-brand-banner px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] text-brand font-semibold">可預約</Text>
                      </View>
                    ) : (
                      <View className="bg-[#F5F5F5] px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] text-[#aaa] font-semibold">已額滿</Text>
                      </View>
                    )}
                  </View>

                  {/* 科目標籤 */}
                  <View className="flex-row flex-wrap gap-1">
                    {tutor.subjects.map((sub) => (
                      <View key={sub} className="bg-brand-light px-2 py-0.5 rounded-full">
                        <Text className="text-[11px] text-brand font-medium">{sub}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 評分 */}
                <View className="items-center">
                  <Text className="text-lg font-bold text-navy">{tutor.rating}</Text>
                  <Text className="text-yellow-400 text-xs">★★★★★</Text>
                </View>
              </View>

              {/* 介紹 */}
              <Text className="text-sm text-[#555] leading-5 mb-3">{tutor.intro}</Text>

              {/* 底部資訊 + 按鈕 */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={14} color="#aaa" />
                  <Text className="text-xs text-[#aaa]">已上課 {tutor.sessions} 堂</Text>
                </View>
                <TouchableOpacity
                  disabled={!tutor.available}
                  className={`px-5 py-2 rounded-full ${tutor.available ? 'bg-brand' : 'bg-[#eee]'}`}
                >
                  <Text className={`text-sm font-bold ${tutor.available ? 'text-white' : 'text-[#ccc]'}`}>
                    {tutor.available ? '預約上課' : '已額滿'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}