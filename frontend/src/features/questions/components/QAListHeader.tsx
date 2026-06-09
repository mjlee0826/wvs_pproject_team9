import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUBJECTS = ['全部', '數學', '英文', '自然', '國文', '社會', '其他'];

interface Props {
  threadCount: number;
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
}

export default function QAListHeader({ threadCount, selectedSubject, onSelectSubject }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View>
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
        <Text className="text-white text-2xl font-bold mb-1">課程問答</Text>
        <Text className="text-white/80 text-sm">提出問題，與老師一起解決</Text>
      </LinearGradient>

      <View style={{ marginTop: -14 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        >
          {SUBJECTS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => onSelectSubject(s)}
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedSubject === s ? 'bg-brand' : 'bg-white border border-brand-light'
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

      <View className="px-7 pt-2">
        <Text className="text-xs text-[#aaa] mb-3">共 {threadCount} 則討論</Text>
      </View>
    </View>
  );
}
