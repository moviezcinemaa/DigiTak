import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gofact_consent');
    if (!consent) {
      setShowBanner(true);
    } else if (consent === 'granted' && typeof window.gtag === 'function') {
      // If already granted in a previous session, we need to update gtag on load
      // because the default in index.html is 'denied' on every hard refresh.
      window.gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
      });
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gofact_consent', 'granted');
    setShowBanner(false);
    
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem('gofact_consent', 'denied');
    setShowBanner(false);
    // Already defaults to denied, but we can explicitly update it just in case
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-content">
        <h4>We Value Your Privacy</h4>
        <p>
          We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
          By clicking "Accept All", you consent to our use of cookies.
        </p>
      </div>
      <div className="cookie-actions">
        <button className="cookie-btn cookie-decline" onClick={handleDecline}>Decline</button>
        <button className="cookie-btn cookie-accept" onClick={handleAccept}>Accept All</button>
      </div>
    </div>
  );
}
