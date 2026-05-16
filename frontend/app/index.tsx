import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useLogto } from '@logto/rn';
import { View, Text } from 'react-native';
import LoadingScreen from '../src/components/LoadingScreen';
import CustomButton from '../src/components/CustomButton';

export default function LoginPage() {
  const { isAuthenticated, isInitialized, signIn } = useLogto();

  if (!isInitialized) return <LoadingScreen />;
  if (isAuthenticated) return <Redirect href="/(app)/(tabs)/home" />;

  return (
    <LinearGradient
      colors={['#65A1FB', '#F9FBFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo 區 */}
        <View className="items-center mb-12">
          <View
            className="w-24 h-24 rounded-3xl bg-white justify-center items-center mb-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-5xl font-bold text-blue-brand">W</Text>
          </View>
          <Text className="text-4xl font-bold text-navy" style={{ letterSpacing: 1 }}>
            WVS Pocket
          </Text>
          <Text className="text-base text-blue-mid mt-2">師生互動平台</Text>
        </View>

        {/* 登入按鈕 */}
        <CustomButton
          title="登入"
          onPress={async () => {
            try {
              await signIn(process.env.EXPO_PUBLIC_LOGTO_REDIRECT_URI!);
            } catch {
              // 使用者取消登入
            }
          }}
          style={{ width: 160, height: 64, marginTop: 20 }}
          textStyle={{ fontSize: 18 }}
        />

        <Text className="mt-6 text-xs text-blue-light text-center">
          登入即代表你同意使用條款與隱私政策
        </Text>
      </View>
    </LinearGradient>
  );
}
