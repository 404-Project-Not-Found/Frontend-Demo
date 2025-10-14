'use client';

export function mockSignOut() {
  const mockRole = sessionStorage.getItem('mockRole');

  if (mockRole) {
    // Frontend mock mode → clear everything
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.warn('Storage clear failed:', err);
    }

    // Go back to login page
    window.location.href = '/';
  } else {
    // Not in mock mode → no-op for now
    console.info('Sign out ignored (not in mock mode)');
  }
}
