import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getClientAuth } from './firebase';
import { setGmailAccessToken } from './gmail';
import { User } from '../types';
import { getCurrentUser, persistSession, USERS_KEY } from './auth-session';

export async function syncEmailPasswordLogin(email: string, password: string): Promise<void> {
  if (!email) return;
  try {
    await signInWithEmailAndPassword(getClientAuth(), email, password);
    console.log(`Synced active Firebase Auth session for caller: ${email}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      try {
        await createUserWithEmailAndPassword(getClientAuth(), email, password);
        console.log(`Dynamically registered Firebase Auth account: ${email}`);
      } catch (regErr) {
        console.warn('Fallback dynamic registration in Firebase Auth failed:', regErr);
      }
    } else {
      console.warn('Firebase login credentials sync warning:', err);
    }
  }
}

export async function syncEmailPasswordRegister(email: string, password: string): Promise<void> {
  try {
    await createUserWithEmailAndPassword(getClientAuth(), email, password);
    console.log(`Successfully synced Firebase Auth account on signup: ${email}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/email-already-in-use') {
      try {
        await signInWithEmailAndPassword(getClientAuth(), email, password);
      } catch (signInErr) {
        console.warn('Firebase Auth auto login after register exception:', signInErr);
      }
    } else {
      console.warn('Firebase Auth auto sign up after register sync warning:', err);
    }
  }
}

export async function signOutFirebase(): Promise<void> {
  await signOut(getClientAuth());
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(getClientAuth(), provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    setGmailAccessToken(credential.accessToken);
  }

  const email = result.user.email;
  if (!email) {
    throw new Error('Alamat email dari akun Google Anda tidak dapat ditemukan.');
  }

  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  let foundUser = users.find((u) => u.username.toLowerCase() === email.toLowerCase());

  if (!foundUser) {
    foundUser = {
      id: result.user.uid || Math.random().toString(36).substr(2, 9),
      username: email,
      password: 'google-oauth-dummy-pass',
      role: 'user',
      profile: {
        email,
        whatsappNumber: result.user.phoneNumber || '08123456789',
      },
    };
    users.push(foundUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  return persistSession(foundUser);
}

export async function initializeAuthSync(): Promise<void> {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin' || user.username !== 'admin') return;
  try {
    await signInWithEmailAndPassword(getClientAuth(), 'admin@perada.net', 'Perdana?2026');
    console.log('Successfully autosynced superadmin Firebase Auth session at startup.');
  } catch (err) {
    console.warn('Autosync on startup warning:', err);
  }
}