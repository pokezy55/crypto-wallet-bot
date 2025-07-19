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
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const webApp = window.Telegram.WebApp;
          webApp.ready();
          webApp.expand();
          
          // Get user data
          if (webApp.initDataUnsafe?.user) {
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
          }
        }
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
      }
    };
    
    // Parse referral code first, then init WebApp
    parseReferralCode();
    initTelegramWebApp();
  }, [onAuth]);

  return null; // This component doesn't render anything
};

export default TelegramAuth; 