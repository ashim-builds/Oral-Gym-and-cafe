import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer, AuthState } from '../types';
import mobileAuthService from '../services/auth.service';
import { getAuthToken } from '../services/api';

interface AuthContextType {
  authState: AuthState;
  customer: Customer | null;
  pendingPhone: string;
  setPendingPhone: (phone: string) => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; cooldownSeconds: number; devOtp?: string }>;
  verifyOtp: (otp: string) => Promise<{ isNewCustomer: boolean }>;
  completeProfile: (data: { name: string; email?: string; address?: string }) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; address?: string }) => Promise<void>;
  enterGuestMode: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const GUEST_KEY = 'oral_gym_is_guest';
const FIRST_TIME_KEY = 'oral_gym_has_launched';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>('LOADING');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string>('');

  useEffect(() => {
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        // Attempt to fetch profile
        try {
          const profile = await mobileAuthService.getProfile();
          setCustomer(profile);
          setAuthState('AUTHENTICATED');
          return;
        } catch {
          // If token expired/invalid, clear
          await mobileAuthService.logout();
        }
      }

      // Check if user previously chose guest mode
      const isGuest = await AsyncStorage.getItem(GUEST_KEY);
      if (isGuest === 'true') {
        setAuthState('GUEST');
        return;
      }

      // First time launch
      const hasLaunched = await AsyncStorage.getItem(FIRST_TIME_KEY);
      if (hasLaunched) {
        setAuthState('GUEST');
      } else {
        setAuthState('FIRST_TIME');
      }
    } catch {
      setAuthState('FIRST_TIME');
    }
  };

  const sendOtp = async (phone: string) => {
    setPendingPhone(phone);
    return await mobileAuthService.sendOtp(phone);
  };

  const verifyOtp = async (otp: string) => {
    if (!pendingPhone) {
      throw new Error('No pending phone number found. Please enter phone number again.');
    }
    const result = await mobileAuthService.verifyOtp(pendingPhone, otp);
    setCustomer(result.customer);
    await AsyncStorage.setItem(FIRST_TIME_KEY, 'true');
    await AsyncStorage.removeItem(GUEST_KEY);
    setAuthState('AUTHENTICATED');
    return { isNewCustomer: result.isNewCustomer };
  };

  const completeProfile = async (data: { name: string; email?: string; address?: string }) => {
    const updated = await mobileAuthService.updateProfile(data);
    setCustomer(updated);
  };

  const updateProfile = async (data: { name?: string; email?: string; address?: string }) => {
    const updated = await mobileAuthService.updateProfile(data);
    setCustomer(updated);
  };

  const enterGuestMode = async () => {
    await AsyncStorage.setItem(FIRST_TIME_KEY, 'true');
    await AsyncStorage.setItem(GUEST_KEY, 'true');
    setAuthState('GUEST');
  };

  const logout = async () => {
    await mobileAuthService.logout();
    setCustomer(null);
    setPendingPhone('');
    await AsyncStorage.setItem(GUEST_KEY, 'true');
    setAuthState('GUEST');
  };

  const refreshProfile = async () => {
    try {
      const profile = await mobileAuthService.getProfile();
      setCustomer(profile);
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        customer,
        pendingPhone,
        setPendingPhone,
        sendOtp,
        verifyOtp,
        completeProfile,
        updateProfile,
        enterGuestMode,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
