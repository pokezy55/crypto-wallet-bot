'use client';

import { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  // State untuk pengaturan pengguna
  const [settings, setSettings] = useState({
    pinEnabled: false,
    lockOnLoad: false,
    notificationsEnabled: true,
    theme: 'dark',
    highPerformanceMode: false,
  });
  
  const [isPinSet, setIsPinSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prevSettings => ({
            ...prevSettings,
            ...parsedSettings
          }));
          
          // Periksa apakah PIN telah diatur
          setIsPinSet(!!parsedSettings.pinEnabled);
        }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Simpan pengaturan ke localStorage setiap kali berubah
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  // Fungsi untuk memperbarui pengaturan
  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  // Fungsi untuk mengatur PIN
  const setPin = async (userId, pin) => {
    try {
      const response = await fetch('/api/security/update-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newPin: pin
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        updateSettings({ pinEnabled: true });
        setIsPinSet(true);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error setting PIN:', error);
      return { success: false, error: 'Failed to set PIN' };
    }
  };

  // Fungsi untuk memverifikasi PIN
  const verifyPin = async (userId, pin) => {
    try {
      const response = await fetch('/api/security/update-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentPin: pin
        }),
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return { success: false, error: 'Failed to verify PIN' };
    }
  };

  // Fungsi untuk mengubah PIN
  const changePin = async (userId, currentPin, newPin) => {
    try {
      const response = await fetch('/api/security/update-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentPin,
          newPin
        }),
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      console.error('Error changing PIN:', error);
      return { success: false, error: 'Failed to change PIN' };
    }
  };

  // Fungsi untuk mendapatkan seed phrase
  const getSeedPhrase = async (userId, pin) => {
    try {
      const response = await fetch('/api/security/view-secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          pin,
          type: 'seed_phrase'
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting seed phrase:', error);
      return { success: false, error: 'Failed to get seed phrase' };
    }
  };

  // Fungsi untuk mendapatkan private key
  const getPrivateKey = async (userId, pin) => {
    try {
      const response = await fetch('/api/security/view-secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          pin,
          type: 'private_key'
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting private key:', error);
      return { success: false, error: 'Failed to get private key' };
    }
  };

  // Fungsi untuk memperbarui preferensi
  const updatePreferences = async (userId, preferences) => {
    try {
      // Update local state first for immediate UI feedback
      updateSettings(preferences);
      
      // Then update on the server
      const response = await fetch('/api/preferences/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...preferences
        }),
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  };

  // Nilai yang akan disediakan oleh context
  const value = {
    settings,
    updateSettings,
    isPinSet,
    isLoading,
    setPin,
    verifyPin,
    changePin,
    getSeedPhrase,
    getPrivateKey,
    updatePreferences
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook untuk menggunakan context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 