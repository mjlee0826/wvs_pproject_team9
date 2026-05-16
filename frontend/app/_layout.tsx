import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { LogtoProvider, LogtoConfig, UserScope, useLogto } from '@logto/rn';
import { apiClient } from '../src/utils/api';

const logtoConfig: LogtoConfig = {
  appId: process.env.EXPO_PUBLIC_LOGTO_APP_ID!,
  endpoint: process.env.EXPO_PUBLIC_LOGTO_ENDPOINT!,
  resources: [process.env.EXPO_PUBLIC_LOGTO_API_RESOURCE!],
  scopes: [UserScope.Email, UserScope.Profile],
};

function InterceptorSetup() {
  const { getAccessToken, signOut } = useLogto();

  useEffect(() => {
    console.log('[Root] 掛載 Axios Interceptors（全域）');
    const reqId = apiClient.interceptors.request.use(async (config) => {
      try {
        const token = await getAccessToken(process.env.EXPO_PUBLIC_LOGTO_API_RESOURCE!);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`[Interceptor] 附加 Token: ${config.method?.toUpperCase()} ${config.url}`);
        }
      } catch {
        console.warn('[Interceptor] 無法取得 Access Token，略過');
      }
      return config;
    });

    const resId = apiClient.interceptors.response.use(
      (res) => {
        console.log(`[Interceptor] 回應成功: ${res.status} ${res.config.url}`);
        return res;
      },
      async (error) => {
        console.warn(`[Interceptor] 回應錯誤: ${error.response?.status} ${error.config?.url}`);
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          console.log('[Interceptor] 401，嘗試 Refresh 後重試');
          try {
            const token = await getAccessToken(process.env.EXPO_PUBLIC_LOGTO_API_RESOURCE!);
            error.config.headers.Authorization = `Bearer ${token}`;
            return apiClient(error.config);
          } catch {
            console.error('[Interceptor] Refresh 失敗，執行登出');
            await signOut();
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      console.log('[Root] 卸載 Axios Interceptors');
      apiClient.interceptors.request.eject(reqId);
      apiClient.interceptors.response.eject(resId);
    };
  }, [getAccessToken, signOut]);

  return null;
}

export default function RootLayout() {
  return (
    <LogtoProvider config={logtoConfig}>
      <InterceptorSetup />
      <Stack screenOptions={{ headerShown: false }} />
    </LogtoProvider>
  );
}
