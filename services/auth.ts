/**
 * Auth facade — session helpers are sync/localStorage only.
 * Firebase sync is dynamically imported to keep vendor-firebase off the home route.
 */
import { User } from '../types';
import {
  resolveLoginMatch,
  persistSession,
  USERS_KEY,
  type SupplementaryAdmin,
} from './auth-session';

export type { SupplementaryAdmin } from './auth-session';
export {
  getAdminUsers,
  saveAdminUser,
  deleteAdminUser,
  createCredentialsForCandidateSubmit,
  getCurrentUser,
  updateUserProfile,
  loginWithGoogleMock,
  logout,
} from './auth-session';

export const login = async (username: string, password: string): Promise<User> => {
  const match = resolveLoginMatch(username, password);
  if (!match) {
    throw new Error('Username atau password salah.');
  }

  if (match.firebaseEmail) {
    const { syncEmailPasswordLogin } = await import('./auth-firebase');
    await syncEmailPasswordLogin(match.firebaseEmail, match.firebasePassword);
  }

  return persistSession(match.user);
};

export const register = async (userData: {
  email: string;
  password: string;
  phone: string;
}): Promise<User> => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];

  if (users.find((u) => u.username.toLowerCase() === userData.email.toLowerCase())) {
    throw new Error('Email sudah terdaftar.');
  }

  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    username: userData.email,
    password: userData.password,
    role: 'user',
    profile: {
      email: userData.email,
      whatsappNumber: userData.phone,
    },
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const { syncEmailPasswordRegister } = await import('./auth-firebase');
  await syncEmailPasswordRegister(userData.email, userData.password);

  return persistSession(newUser);
};

export async function loginWithGoogle(): Promise<User> {
  const { loginWithGoogle: googleLogin } = await import('./auth-firebase');
  return googleLogin();
}