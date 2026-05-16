import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Interceptors are registered in app/(app)/_layout.tsx (AuthInterceptorSetup)
// following the pattern from temp.jsx
