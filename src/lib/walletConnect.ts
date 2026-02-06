/**
 * Shared wallet connection helper that handles mobile deep-linking
 * when MetaMask is not installed in the browser.
 */

export const isMobileBrowser = () =>
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const hasInjectedProvider = () =>
  typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

/**
 * On mobile without an injected provider, redirect the user
 * to the MetaMask in-app browser via deep link.
 * Returns `true` if a redirect was triggered (caller should stop).
 */
export const handleMobileDeepLink = (): boolean => {
  if (isMobileBrowser() && !hasInjectedProvider()) {
    const dappUrl = `${window.location.host}${window.location.pathname}`;
    window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
    return true;
  }
  return false;
};
