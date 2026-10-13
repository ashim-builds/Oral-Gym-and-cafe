import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAdminService, { getAdminToken } from '../services/admin.service';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  loginAdmin: (email: string, passwordPlain: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const ADMIN_USER_STORAGE = 'oral_gym_admin_user_data';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    bootstrapAdmin();
  }, []);

  const bootstrapAdmin = async () => {
    try {
      const token = await getAdminToken();
      const userJson = await AsyncStorage.getItem(ADMIN_USER_STORAGE);
      if (token && userJson) {
        setAdminToken(token);
        setAdminUser(JSON.parse(userJson));
      }
    } catch {
      // Ignore
    }
  };

  const loginAdmin = async (email: string, passwordPlain: string) => {
    const result = await mobileAdminService.login(email, passwordPlain);
    setAdminToken(result.token);
    setAdminUser(result.admin);
    await AsyncStorage.setItem(ADMIN_USER_STORAGE, JSON.stringify(result.admin));
  };

  const logoutAdmin = async () => {
    await mobileAdminService.logout();
    setAdminToken(null);
    setAdminUser(null);
    await AsyncStorage.removeItem(ADMIN_USER_STORAGE);
  };

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        adminToken,
        isAdminAuthenticated: !!adminToken,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return ctx;
};
