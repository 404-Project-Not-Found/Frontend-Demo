/**
 * File path: /src/lib/mock/mockSignIn.ts
 * Author: Qingyue Zhao
 * Date Created: 2025-10-07
 *
 * Purpose:
 *   Provides a lightweight mock login function for frontend testing.
 *   Works directly with mockApi’s role management (setViewerRoleFE).
 *   Used when NEXT_PUBLIC_ENABLE_MOCK = '1' to bypass NextAuth.
 */

import { setViewerRoleFE, type ViewerRole } from '@/lib/mock/mockApi';


export async function mockSignIn(role: ViewerRole) { 
  try {
    setViewerRoleFE(role);

    sessionStorage.setItem(
      'mockSession',
      JSON.stringify({
        name: `Demo ${role[0].toUpperCase() + role.slice(1)}`,
        role,
        email: `demo_${role}@mock.local`,
        loggedInAt: new Date().toISOString(),
      })
    );

    console.log(`[MockSignIn] Logged in as ${role}`);
  } catch (err) {
    console.warn('mockSignIn failed', err);
  }
}