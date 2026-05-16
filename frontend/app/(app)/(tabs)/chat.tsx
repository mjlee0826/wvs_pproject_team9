import { View, Text } from 'react-native';

// TODO: Implement chat room feature
export default function ChatScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl mb-4">💬</Text>
      <Text className="text-lg font-semibold text-gray-700">聊天室</Text>
      <Text className="text-sm text-gray-400 mt-2">即將推出</Text>
    </View>
  );
}
