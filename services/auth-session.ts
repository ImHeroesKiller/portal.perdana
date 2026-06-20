import { User, NewEmployee } from '../types';

export const USERS_KEY = 'pt_perdana_users';
export const SESSION_KEY = 'pt_perdana_session';
export const ADMINS_KEY = 'pt_perdana_admins';

export const ADMIN_USER = 'admin';
export const ADMIN_PASS = 'Perdana?2026';

export interface SupplementaryAdmin {
  id: string;
  username: string;
  password?: string;
  role: 'admin';
  permissions: string[];
  name: string;
  isActive: boolean;
  createdAt: string;
}

const seedAdmins = () => {
  if (!localStorage.getItem(ADMINS_KEY)) {
    const initialAdmins: SupplementaryAdmin[] = [
      {
        id: 'adm-001',
        username: 'admin.hr',
        password: 'Password123!',
        role: 'admin',
        permissions: ['talent', 'employees', 'reports'],
        name: 'Andi Pratama (Admin HRD & Rekrutmen)',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'adm-002',
        username: 'admin.finance',
        password: 'Password123!',
        role: 'admin',
        permissions: ['finance', 'payroll', 'assets', 'reports'],
        name: 'Siti Rahma (Admin Accounting & Keuangan)',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'adm-003',
        username: 'admin.field',
        password: 'Password123!',
        role: 'admin',
        permissions: ['attendance', 'project', 'client'],
        name: 'Hadi Wijaya (Admin Operasional Lapangan)',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(ADMINS_KEY, JSON.stringify(initialAdmins));
  }
};

seedAdmins();

export const getAdminUsers = (): SupplementaryAdmin[] => {
  seedAdmins();
  const adminsStr = localStorage.getItem(ADMINS_KEY);
  return adminsStr ? JSON.parse(adminsStr) : [];
};

export const saveAdminUser = (admin: SupplementaryAdmin): void => {
  const admins = getAdminUsers();
  const index = admins.findIndex((a) => a.id === admin.id);
  if (index >= 0) admins[index] = admin;
  else admins.push(admin);
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
};

export const deleteAdminUser = (id: string): void => {
  const admins = getAdminUsers();
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins.filter((a) => a.id !== id)));
};

export type LoginMatch = {
  user: User;
  firebaseEmail: string;
  firebasePassword: string;
};

export function resolveLoginMatch(username: string, password: string): LoginMatch | null {
  let matchedUser: User | null = null;
  let firebaseEmail = '';
  let firebasePassword = password;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    matchedUser = {
      id: 'admin-super',
      username: 'admin',
      role: 'admin',
      permissions: [
        'talent',
        'client',
        'project',
        'employees',
        'attendance',
        'payroll',
        'finance',
        'assets',
        'reports',
        'rbac',
      ],
    };
    firebaseEmail = 'admin@perada.net';
    firebasePassword = password;
  }

  if (!matchedUser) {
    const matchedAdmin = getAdminUsers().find(
      (a) => a.username.toLowerCase() === username.toLowerCase() && a.password === password
    );
    if (matchedAdmin) {
      if (!matchedAdmin.isActive) {
        throw new Error('Akun admin ini dinonaktifkan oleh superadmin.');
      }
      matchedUser = {
        id: matchedAdmin.id,
        username: matchedAdmin.username,
        role: 'admin',
        permissions: matchedAdmin.permissions,
        profile: {
          fullName: matchedAdmin.name,
          email: matchedAdmin.username,
        } as User['profile'],
      };
      const emailDomainSuffix = matchedAdmin.username.includes('@') ? '' : '@perada.net';
      firebaseEmail = matchedAdmin.username + emailDomainSuffix;
      firebasePassword = password;
    }
  }

  if (!matchedUser) {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (foundUser) {
      matchedUser = foundUser;
      firebaseEmail = foundUser.username;
      firebasePassword = password;
    }
  }

  if (!matchedUser) return null;
  return { user: matchedUser, firebaseEmail, firebasePassword };
}

export function persistSession(user: User): User {
  const { password: _, ...safeUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  return safeUser as User;
}

export const createCredentialsForCandidateSubmit = (
  email: string,
  phone: string
): { email: string; password: string; isNew: boolean } => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];

  const existingUser = users.find((u) => u.username.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return {
      email,
      password: existingUser.password || 'Perdana?2026',
      isNew: false,
    };
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const password = `Perdana?${randomSuffix}`;

  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    username: email.toLowerCase(),
    password,
    role: 'user',
    profile: {
      email: email.toLowerCase(),
      whatsappNumber: phone,
    },
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { email: email.toLowerCase(), password, isNew: true };
};

export const getCurrentUser = (): User | null => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  return sessionStr ? JSON.parse(sessionStr) : null;
};

export const updateUserProfile = (profileData: Partial<NewEmployee>) => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role === 'admin') return;

  const usersStr = localStorage.getItem(USERS_KEY);
  let users: User[] = usersStr ? JSON.parse(usersStr) : [];

  users = users.map((u) => {
    if (u.id === currentUser.id) {
      const updatedUser = { ...u, profile: { ...u.profile, ...profileData } };
      const { password, ...safeUser } = updatedUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return updatedUser;
    }
    return u;
  });

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const loginWithGoogleMock = (email: string, phone?: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const usersStr = localStorage.getItem(USERS_KEY);
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      let foundUser = users.find((u) => u.username.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        foundUser = {
          id: Math.random().toString(36).substr(2, 9),
          username: email,
          password: 'google-oauth-dummy-pass',
          role: 'user',
          profile: {
            email,
            whatsappNumber: phone || '08123456789',
          },
        };
        users.push(foundUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      resolve(persistSession(foundUser));
    }, 400);
  });
};

export async function logout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
  try {
    const { signOutFirebase } = await import('./auth-firebase');
    await signOutFirebase();
  } catch (err) {
    console.warn('Firebase signout warning:', err);
  }
  window.location.href = '/';
}