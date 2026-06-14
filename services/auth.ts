
import { User, NewEmployee } from '../types';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { setGmailAccessToken } from './gmail';

const USERS_KEY = 'pt_perdana_users';
const SESSION_KEY = 'pt_perdana_session';

// Admin Credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Perdana?2026';

const ADMINS_KEY = 'pt_perdana_admins';

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

// Seed supplementary admins if empty
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
        createdAt: new Date().toISOString()
      },
      {
        id: 'adm-002',
        username: 'admin.finance',
        password: 'Password123!',
        role: 'admin',
        permissions: ['finance', 'payroll', 'assets', 'reports'],
        name: 'Siti Rahma (Admin Accounting & Keuangan)',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'adm-003',
        username: 'admin.field',
        password: 'Password123!',
        role: 'admin',
        permissions: ['attendance', 'project', 'client'],
        name: 'Hadi Wijaya (Admin Operasional Lapangan)',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(ADMINS_KEY, JSON.stringify(initialAdmins));
  }
};

// Call seedAdmins immediately
seedAdmins();

export const getAdminUsers = (): SupplementaryAdmin[] => {
  seedAdmins();
  const adminsStr = localStorage.getItem(ADMINS_KEY);
  return adminsStr ? JSON.parse(adminsStr) : [];
};

export const saveAdminUser = (admin: SupplementaryAdmin): void => {
  const admins = getAdminUsers();
  const index = admins.findIndex(a => a.id === admin.id);
  if (index >= 0) {
    admins[index] = admin;
  } else {
    admins.push(admin);
  }
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
};

export const deleteAdminUser = (id: string): void => {
  const admins = getAdminUsers();
  const filtered = admins.filter(a => a.id !== id);
  localStorage.setItem(ADMINS_KEY, JSON.stringify(filtered));
};

export const login = (username: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 1. Check Superadmin
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        const adminUser: User = {
          id: 'admin-super',
          username: 'admin',
          role: 'admin',
          permissions: ['talent', 'client', 'project', 'employees', 'attendance', 'payroll', 'finance', 'assets', 'reports', 'rbac'] // Superadmin can access ALL modules
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
        resolve(adminUser);
        return;
      }

      // 2. Check Supplementary Admin Users
      const admins = getAdminUsers();
      const matchedAdmin = admins.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === password);
      
      if (matchedAdmin) {
        if (!matchedAdmin.isActive) {
          reject(new Error('Akun admin ini dinonaktifkan oleh superadmin.'));
          return;
        }
        const adminUser: User = {
          id: matchedAdmin.id,
          username: matchedAdmin.username,
          role: 'admin',
          permissions: matchedAdmin.permissions, // specific modules
          profile: {
            fullName: matchedAdmin.name,
            email: matchedAdmin.username
          } as any
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
        resolve(adminUser);
        return;
      }

      // 3. Check Registered Users
      const usersStr = localStorage.getItem(USERS_KEY);
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      const foundUser = users.find(u => u.username === username && u.password === password);

      if (foundUser) {
        // Don't store password in session
        const { password, ...safeUser } = foundUser;
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
        resolve(safeUser as User);
      } else {
        reject(new Error('Username atau password salah.'));
      }
    }, 500);
  });
};

export const createCredentialsForCandidateSubmit = (email: string, phone: string): { email: string; password: string; isNew: boolean } => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  const existingUser = users.find(u => u.username.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return {
      email,
      password: existingUser.password || 'Perdana?2026',
      isNew: false
    };
  }

  // Generate a friendly, readable yet secure randomized password
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  const password = `Perdana?${randomSuffix}`;
  
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    username: email.toLowerCase(),
    password: password,
    role: 'user',
    profile: {
      email: email.toLowerCase(),
      whatsappNumber: phone
    }
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return {
    email: email.toLowerCase(),
    password,
    isNew: true
  };
};

export const register = (userData: { email: string; password: string; phone: string }): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const usersStr = localStorage.getItem(USERS_KEY);
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];

      if (users.find(u => u.username === userData.email)) {
        reject(new Error('Email sudah terdaftar.'));
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: userData.email,
        password: userData.password,
        role: 'user',
        profile: {
          email: userData.email,
          whatsappNumber: userData.phone
        }
      };

      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Auto login after register
      const { password, ...safeUser } = newUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      
      resolve(safeUser as User);
    }, 500);
  });
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/'; // Simple redirect
};

export const getCurrentUser = (): User | null => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  return sessionStr ? JSON.parse(sessionStr) : null;
};

export const updateUserProfile = (profileData: Partial<NewEmployee>) => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role === 'admin') return;

  // Update in Users DB
  const usersStr = localStorage.getItem(USERS_KEY);
  let users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  users = users.map(u => {
    if (u.id === currentUser.id) {
      const updatedUser = {
        ...u,
        profile: { ...u.profile, ...profileData }
      };
      // Update session as well
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
      let foundUser = users.find(u => u.username.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        foundUser = {
          id: Math.random().toString(36).substr(2, 9),
          username: email,
          password: 'google-oauth-dummy-pass',
          role: 'user',
          profile: {
            email: email,
            whatsappNumber: phone || '08123456789'
          }
        };
        users.push(foundUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      const { password, ...safeUser } = foundUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      resolve(safeUser as User);
    }, 400);
  });
};

export const loginWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  const result = await signInWithPopup(auth, provider);
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
  let foundUser = users.find(u => u.username.toLowerCase() === email.toLowerCase());

  if (!foundUser) {
    foundUser = {
      id: result.user.uid || Math.random().toString(36).substr(2, 9),
      username: email,
      password: 'google-oauth-dummy-pass',
      role: 'user',
      profile: {
        email: email,
        whatsappNumber: result.user.phoneNumber || '08123456789'
      }
    };
    users.push(foundUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  const { password, ...safeUser } = foundUser;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  return safeUser as User;
};

