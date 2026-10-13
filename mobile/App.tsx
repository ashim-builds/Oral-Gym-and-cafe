import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { AdminProvider } from './src/context/AdminContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notification.service';
import { PermissionsModal } from './src/components/PermissionsModal';

export default function App() {
  useEffect(() => {
    notificationService.registerForPushNotifications().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <AppNavigator />
            <PermissionsModal />
          </CartProvider>
        </AdminProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}


