import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { useLogto } from '@logto/rn';
import { getCachedRole, setCachedRole } from '../../src/utils/asyncStorage';
import { userApi } from '../../src/services/userApi';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function AppLayout() {
  const { isAuthenticated, isInitialized, signOut } = useLogto();
  const [role, setRole] = useState<string | null | undefined>(undefined);

  // ===== 載入角色（cache first, then API）=====
  useEffect(() => {
    if (!isAuthenticated) return;
    console.log('[AppLayout] 使用者已登入，開始載入角色');

    getCachedRole().then((cached) => {
      if (cached) {
        console.log('[AppLayout] 從快取取得角色:', cached);
        setRole(cached);
      } else {
        console.log('[AppLayout] 快取無角色資料');
      }
    });

    userApi
      .getMe()
      .then((u) => {
        console.log('[AppLayout] API 取得使用者角色:', u.role);
        setRole(u.role);
        setCachedRole(u.role);
      })
      .catch((err) => {
        console.warn('[AppLayout] getMe 失敗（使用者尚未建立）:', err?.message ?? err);
        setRole((prev) => (prev === undefined ? null : prev));
      });
  }, [isAuthenticated]);

  // ===== Auth Guard =====
  if (!isInitialized) {
    console.log('[AppLayout] Logto 尚未初始化，顯示載入畫面');
    return <LoadingScreen />;
  }
  if (!isAuthenticated) {
    console.log('[AppLayout] 使用者未登入，導向登入頁');
    return <Redirect href="/" />;
  }
  if (role === undefined) {
    console.log('[AppLayout] 角色載入中，顯示載入畫面');
    return <LoadingScreen />;
  }
  if (!role) {
    console.log('[AppLayout] 使用者無角色，導向角色選擇頁');
    return <Redirect href="/role-select" />;
  }

  console.log('[AppLayout] 驗證通過，角色:', role);
  return <Stack screenOptions={{ headerShown: false }} />;
}
