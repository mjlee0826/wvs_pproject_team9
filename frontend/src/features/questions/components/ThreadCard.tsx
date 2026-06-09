import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Thread } from '../services/questionApi';

interface Props {
  item: Thread;
}

export default function ThreadCard({ item }: Props) {
  const { resolved } = item;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/questions/${item.id}`)}
      className="bg-white rounded-2xl mb-4 overflow-hidden"
      style={{
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ height: 4, backgroundColor: resolved ? '#68D391' : '#F6AD55' }} />

      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className={`px-2 py-0.5 rounded-full ${resolved ? 'bg-green-100' : 'bg-orange-100'}`}>
            <Text className={`text-[10px] font-semibold ${resolved ? 'text-green-600' : 'text-orange-600'}`}>
              {resolved ? '已解決' : '待解決'}
            </Text>
          </View>
          <Text className="text-xs text-[#aaa]">{item.subject}</Text>
        </View>

        <Text className="text-base font-bold text-navy mb-1">{item.title}</Text>

        <Text className="text-sm text-[#555] mb-3" numberOfLines={2}>
          {item.content}
        </Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full items-center justify-center bg-[#65A1FB22]">
              <Text style={{ fontSize: 12 }}>{item.isAnonymous ? '🕵️' : '🎓'}</Text>
            </View>
            <Text className="text-xs text-[#888]">
              {item.isAnonymous ? '匿名' : item.author?.displayName} · {item.createdAt?.substring(0, 10)}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Ionicons name="chatbubble-outline" size={14} color="#aaa" />
            <Text className="text-xs text-[#aaa]">{item._count?.answers ?? 0} 則回覆</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
