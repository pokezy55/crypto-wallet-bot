import { useEffect } from 'react';

interface TelegramAuthProps {
  onAuth?: (user: any) => void;
}

const TelegramAuth: React.FC<TelegramAuthProps> = ({ onAuth }) => {
  useEffect(() => {
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
            }
            return true; // Successfully authenticated
          } else {
            console.log('No user data in Telegram WebApp');
          }
        } else {
          console.log('Telegram WebApp not available');
        }
        
        // If we get here, either Telegram WebApp is not available or user data is missing
        console.log('Using fallback authentication');
        
        // Fallback for development or testing
        if (onAuth) {
          console.log('Calling onAuth with fallback user');
          
          // Use setTimeout to ensure this runs after the component mounts
          setTimeout(() => {
            onAuth({
              id: 12345678,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              photo_url: null
            });
          }, 100);
        }
        return false;
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
        
        // Fallback for error cases
        if (onAuth) {
          console.log('Calling onAuth with error fallback user');
          
          // Use setTimeout to ensure this runs after the component mounts
          setTimeout(() => {
            onAuth({
              id: 12345678,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              photo_url: null
            });
          }, 100);
        }
        return false;
      }
    };
    
    // Parse referral code first, then init WebApp
    parseReferralCode();
    initTelegramWebApp();
  }, [onAuth]);

  return null; // This component doesn't render anything
};

export default TelegramAuth; 