import { useEffect } from 'react';

interface TelegramAuthProps {
  onAuth?: (user: any) => void;
}

const TelegramAuth: React.FC<TelegramAuthProps> = ({ onAuth }) => {
  useEffect(() => {
    // Check if auth has already happened in this session
    // Hapus penggunaan hasAuthenticated, biarkan autentikasi terjadi setiap kali komponen dimuat
    
    // Always call onAuth with fallback user after a short delay if not called by Telegram WebApp
    const fallbackTimeout = setTimeout(() => {
      console.log('Fallback authentication triggered');
      if (onAuth) {
        onAuth({
          id: 12345678,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          photo_url: null
        });
      }
    }, 2000); // 2 seconds timeout
    
    // Parse referral code from URL
    const parseReferralCode = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const startParam = params.get('start');
        const refCode = startParam?.startsWith('two') ? startParam.replace('two', '') : null;
        
        if (refCode) {
          // Store referral code in localStorage temporarily
          localStorage.setItem('referralCode', refCode);
          console.log('Referral code stored:', refCode);
        }
      } catch (error) {
        console.error('Error parsing referral code:', error);
      }
    };

    // Initialize Telegram WebApp
    const initTelegramWebApp = () => {
      try {
        console.log('Initializing Telegram WebApp');
        
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          console.log('Telegram WebApp is available');
          
          const webApp = window.Telegram.WebApp;
          webApp.ready();
          webApp.expand();
          
          // Get user data
          if (webApp.initDataUnsafe?.user) {
            console.log('Telegram user data found:', webApp.initDataUnsafe.user);
            
            const telegramUser = webApp.initDataUnsafe.user;
            
            // Call onAuth callback with user data
            if (onAuth) {
              onAuth({
                id: telegramUser.id,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                username: telegramUser.username,
                photo_url: telegramUser.photo_url
              });
              
              // Clear fallback timeout since we've authenticated via Telegram
              clearTimeout(fallbackTimeout);
            }
            return true; // Successfully authenticated
          } else {
            console.log('No user data in Telegram WebApp');
          }
        } else {
          console.log('Telegram WebApp not available');
        }
        
        // If we get here, either Telegram WebApp is not available or user data is missing
        // The fallback timeout will handle authentication
        return false;
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
        // Fallback will be handled by timeout
        return false;
      }
    };
    
    // Parse referral code first, then init WebApp
    parseReferralCode();
    initTelegramWebApp();
    
    // Clean up timeout on unmount
    return () => clearTimeout(fallbackTimeout);
  }, [onAuth]);

  return null; // This component doesn't render anything
};

export default TelegramAuth; 