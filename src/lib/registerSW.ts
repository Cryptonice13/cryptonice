/**
 * Guarded service worker registration.
 * Registers only in production, outside Lovable preview/iframe contexts.
 * Supports ?sw=off kill switch.
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;

  const isBlockedHost =
    host.startsWith('id-preview--') ||
    host.startsWith('preview--') ||
    host === 'lovableproject.com' ||
    host.endsWith('.lovableproject.com') ||
    host === 'lovableproject-dev.com' ||
    host.endsWith('.lovableproject-dev.com') ||
    host === 'beta.lovable.dev' ||
    host.endsWith('.beta.lovable.dev');

  const killSwitch = url.searchParams.get('sw') === 'off';
  const shouldRegister = import.meta.env.PROD && !inIframe && !isBlockedHost && !killSwitch;

  if (!shouldRegister) {
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((r) => {
        if (r.active?.scriptURL.endsWith('/sw.js')) r.unregister();
      });
    });
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW register failed', e));
  });
}
