/**
 * File path: /lib/data.ts
 * Author: Denise Alexander
 * Date Created: 04/10/2025
 * Last Updated by Denise Alexander - 7/10/2025: enables either mock mode or real back-end API.
 *
 * TO DO:
 * - fetching and saving tasks on the back-end side.
 */

import * as mockApi from './mock/mockApi';
import { getSession } from 'next-auth/react';
import { mockSignOut } from './mock/mockSignout';
import { signOut as nextAuthSignOut } from 'next-auth/react';

// Flag to determine whether to use mock API or real back-end
const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

// Signs out the currently logged-in user
export const signOutUser = async () => {
  if (isMock) {
    mockSignOut();
    return;
  }
  await nextAuthSignOut({ redirect: false });
};

// Gets the role of the currently authenticated user
export const getViewerRole = async (): Promise<
  'carer' | 'family' | 'management'
> => {
  if (isMock) {
    return mockApi.getViewerRoleFE();
  }

  const session = await getSession();
  if (!session?.user?.role) {
    return 'carer'; // fallback
  }
  return session.user.role as 'carer' | 'family' | 'management';
};

// Fetches all clients visible to the current user
export const getClients = async (): Promise<mockApi.Client[]> => {
  if (isMock) {
    return mockApi.getClientsFE();
  }

  const session = await getSession();
  if (!session?.user?.id || !session?.user?.role) {
    return [];
  }

  const role = session.user.role;
  const url =
    role === 'management' ? '/api/v1/management/clients' : '/api/v1/clients';

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch clients (${res.status})`);
  }

  return (await res.json()) as mockApi.Client[];
};

// Fetches a specific client by ID
export const getClientById = async (id: string) => {
  if (isMock) {
    return mockApi.getClientByIdFE(id);
  }
  const res = await fetch(`/api/v1/clients/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as mockApi.Client;
};

// Fetches all tasks visible to the current user
export const getTasks = async () => {
  if (isMock) {
    return mockApi.getTasksFE();
  }
  /* TO DO:
  const res = await fetch('api/v1/tasks', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks (${res.status})`);
  }
  return (await res.json()) as mockApi.Task[]; 
  */
};

// Saves the provided list of tasks
export const saveTasks = async (tasks: mockApi.Task[]) => {
  if (isMock) {
    return mockApi.saveTasksFE(tasks);
  }
  /* TO DO:
  const res = await fetch('/api/v1/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tasks),
  });
  if (!res.ok) {
    throw new Error(`Failed to save tasks ${res.status}`);
  }
  */
};

// Gets the client the logged-in user is currently viewing
export const getActiveClient = async (): Promise<{
  id: string | null;
  name: string;
  hasClients: boolean;
}> => {
  const clients = await getClients();
  // No clients yet
  if (!clients.length) {
    return { id: null, name: '', hasClients: false };
  }

  // Mock mode: check local storage first
  if (isMock) {
    const active = mockApi.readActiveClientFromStorage();
    if (active.id) {
      return { ...active, hasClients: true };
    }
    return { id: clients[0]._id, name: clients[0].name, hasClients: true };
  }

  // Real API: query backend for active client ID
  const res = await fetch('/api/v1/user/active_client', { cache: 'no-store' });
  let activeId: string | null = null;
  if (res.ok) {
    const data = await res.json();
    activeId = data?.activeClientId || null;
  }

  // No active client assigned but clients exist
  if (!activeId) {
    return { id: null, name: '', hasClients: true };
  }

  // Fetch full client details for display
  const clientRes = await fetch(`/api/v1/clients/${activeId}`, {
    cache: 'no-store',
  });
  if (!clientRes.ok) {
    return { id: activeId, name: '', hasClients: true };
  }

  const client = await clientRes.json();
  return { id: client._id, name: client.name, hasClients: true };
};

// Updates the user's active client
export const setActiveClient = async (id: string | null, name: string = '') => {
  if (isMock) {
    if (id === null) {
      return mockApi.writeActiveClientToStorage('', '');
    }
    return mockApi.writeActiveClientToStorage(id, name);
  }

  // Clears active client
  if (!id) {
    await fetch('/api/v1/user/active_client', { method: 'DELETE' });
  } else {
    // Sets active client
    await fetch('/api/v1/user/active_client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id }),
    });
  }
};

// Export Client type for convenience
export type Client = mockApi.Client;
