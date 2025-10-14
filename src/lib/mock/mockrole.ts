/**
 * File path: /app/lib/role.ts
 * Author: Qingyue Zhao
 * Date Created: 25/09/2025
 * usage: Simple front-end role store for mocks (without api)
 */

export type Role = 'family' | 'carer' | 'management';
const KEY = 'mockRole';

/** save mock role */
export function setMockRole(role: Role) {
  try {
    sessionStorage.setItem(KEY, role);
  } catch (err) {
    console.warn('setMockRole failed', err);
  }
}

/** load mock role */
export function getMockRole(): Role | null {
  try {
    const r = sessionStorage.getItem(KEY);
    if (r === 'family' || r === 'carer' || r === 'management') {
      return r;
    }
  } catch (err) {
    console.warn('getMockRole failed', err);
  }
  return null;
}

/** remove mock role */
export function clearMockRole() {
  try {
    sessionStorage.removeItem(KEY);
  } catch (err) {
    console.warn('clearMockRole failed', err);
  }
}

/** use .env.local to control mode */
export function isMockEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';
}
