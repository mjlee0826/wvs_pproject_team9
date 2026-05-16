import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  POSTS: 'cache:posts',
  USER_ME: 'cache:user:me',
  ROLE: 'cache:role',
} as const;

export async function getCachedPosts() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.POSTS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedPosts(data: unknown) {
  try {
    await AsyncStorage.setItem(KEYS.POSTS, JSON.stringify(data));
  } catch {}
}

export async function getCachedUser() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER_ME);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedUser(data: unknown) {
  try {
    await AsyncStorage.setItem(KEYS.USER_ME, JSON.stringify(data));
  } catch {}
}

export async function getCachedRole(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.ROLE);
  } catch {
    return null;
  }
}

export async function setCachedRole(role: string) {
  try {
    await AsyncStorage.setItem(KEYS.ROLE, role);
  } catch {}
}

export async function clearAllCache() {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {}
}
