import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogto } from '@logto/rn';
import { userApi } from '../src/services/userApi';
import { clearAllCache, setCachedRole } from '../src/utils/asyncStorage';
import TeacherIconButton from '../src/components/TeacherIconButton';
import StudentIconButton from '../src/components/StudentIconButton';
import CustomButton from '../src/components/CustomButton';

export default function RoleSelectPage() {
  const { getIdTokenClaims, fetchUserInfo, signOut } = useLogto();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<'student' | 'admin' | null>(null);

  const handleConfirm = async () => {
    if (!selected) {
      Alert.alert('提示', '請先選擇身份');
      return;
    }
    setLoading(true);
    try {
      const claims = await getIdTokenClaims();
      if (!claims?.sub) throw new Error('無法取得使用者身份（sub），請重新登入');

      const userInfo = await fetchUserInfo();
      if (!userInfo?.email) throw new Error('無法取得 email，請登出後重新登入以重新授權');

      await userApi.upsertMe({
        displayName: claims.name ?? userInfo.name ?? userInfo.email.split('@')[0],
        email: userInfo.email,
      });
      await userApi.assignRole(selected);
      await setCachedRole(selected);
      router.replace('/(app)/(tabs)/home');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '發生錯誤';
      Alert.alert('錯誤', message.includes('not authorized')
        ? '你的 email 不在老師白名單中，請聯繫管理員。'
        : message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await clearAllCache();
    await signOut(process.env.EXPO_PUBLIC_LOGTO_REDIRECT_URI!);
    router.replace('/');
  };

  return (
    <LinearGradient
      colors={['#65A1FB', '#F9FBFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1, padding: 16 }}
    >
      <View className="flex-1 flex-col justify-center items-center">
        <Text className="text-[22px] font-bold text-navy text-center mb-4">
          請問你的身份是⋯⋯？
        </Text>

        <View className="flex-row justify-center items-center gap-[15px] mt-4">
          {/* 老師 */}
          <View className="w-[157px] items-center">
            <TeacherIconButton
              isActive={selected === 'admin'}
              onPress={() => setSelected('admin')}
            />
            <Text className="text-navy text-xl font-bold text-center mt-2">老師</Text>
            <Text className="text-center w-[157px] text-[11px] font-medium text-blue-mid mt-1.5">
              想在這裡和很多小朋友交流，解答、教學大家的課業問題。
            </Text>
          </View>

          {/* 學生 */}
          <View className="w-[157px] items-center">
            <StudentIconButton
              isActive={selected === 'student'}
              onPress={() => setSelected('student')}
            />
            <Text className="text-navy text-xl font-bold text-center mt-2">學生</Text>
            <Text className="text-center w-[157px] text-[11px] font-medium text-blue-mid mt-1.5">
              想在這裡和大家學習、進步，和營隊的老師聊天、問問題。
            </Text>
          </View>
        </View>

        <CustomButton
          title="確定身份"
          onPress={handleConfirm}
          state={loading ? 'loading' : selected ? 'default' : 'disabled'}
          style={{ width: 160, height: 60, marginTop: 24 }}
        />

        <Text className="mt-5 text-[13px] text-blue-light underline" onPress={handleSignOut}>
          使用不同帳號登入（登出）
        </Text>
      </View>
    </LinearGradient>
  );
}
