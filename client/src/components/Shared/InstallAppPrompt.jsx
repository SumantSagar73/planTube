import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

const InstallAppPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode());
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('plantube_install_prompt_dismissed') === '1');
  const [isIos, setIsIos] = useState(isIosDevice());

  useEffect(() => {
    // Only register service worker in production to avoid development caching
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  useEffect(() => {
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setCanInstall(true);
      setDismissed(false);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsStandalone(true);
      localStorage.removeItem('plantube_install_prompt_dismissed');
    };

    const onDisplayModeChange = () => setIsStandalone(isStandaloneMode());

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    displayModeQuery.addEventListener?.('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      displayModeQuery.removeEventListener?.('change', onDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    setIsIos(isIosDevice());
  }, []);

  if (isStandalone || dismissed || (!canInstall && !isIos)) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('plantube_install_prompt_dismissed', '1');
  };

  const message = isIos
    ? 'On iPhone or iPad, tap Share and choose Add to Home Screen.'
    : 'Install PlanTube for faster access, offline shell loading, and a native app feel.';

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '1rem',
        transform: 'translateX(-50%)',
        width: 'min(92vw, 520px)',
        zIndex: 14000,
        padding: '0.9rem 1rem',
        borderRadius: '18px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
        display: 'flex',
        gap: '0.9rem',
        alignItems: 'center'
      }}
    >
      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(96,165,250,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isIos ? <Smartphone size={22} color="#93c5fd" /> : <Download size={22} color="#93c5fd" />}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.2rem' }}>Install PlanTube</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{message}</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
        {canInstall && !isIos && (
          <button className="btn-primary" onClick={handleInstall} style={{ padding: '0.62rem 0.85rem', whiteSpace: 'nowrap' }}>
            Install
          </button>
        )}
        <button onClick={handleDismiss} aria-label="Dismiss install prompt" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default InstallAppPrompt;