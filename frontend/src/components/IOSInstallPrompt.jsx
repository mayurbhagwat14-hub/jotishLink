import { useState, useEffect } from 'react';
import { FiX, FiShare } from 'react-icons/fi';
import { useSelector } from 'react-redux';

/**
 * Detects iOS Safari (not already running in standalone/installed mode)
 * and shows a prompt to "Add to Home Screen" for push notifications to work.
 */
const IOSInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };

  useEffect(() => {
    // Only show on iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // Check if already running as installed PWA (standalone mode)
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    // Check if user has previously dismissed this prompt
    const dismissed = localStorage.getItem('jl_ios_install_dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      // Small delay so it doesn't flash before the page renders
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('jl_ios_install_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '0 12px 12px',
        animation: 'slideUpFade 0.35s ease-out',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '20px',
          padding: '20px',
          color: '#fff',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.3)',
          position: 'relative',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          <FiX size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316, #fb923c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
            }}
          >
            🔔
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              Enable Notifications
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              Stay updated with chat & call alerts
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '14px 16px',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.85)' }}>
            On iPhone, notifications only work when the app is installed to your Home Screen:
          </p>
          <ol style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.9)' }}>
            <li style={{ marginBottom: '6px' }}>
              Tap the{' '}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '13px',
                }}
              >
                <FiShare size={14} /> Share
              </span>{' '}
              button in Safari
            </li>
            <li style={{ marginBottom: '6px' }}>
              Select <strong>"Add to Home Screen"</strong>
            </li>
            <li>Open {appName} from your Home Screen</li>
          </ol>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          style={{
            width: '100%',
            marginTop: '14px',
            padding: '12px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none',
            borderRadius: '14px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>

      {/* Inline keyframe animation */}
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default IOSInstallPrompt;
