/**
 * File path: /context/ActiveClientContext.tsx
 * Author: Denise Alexander
 * Date Created: 06/10/2025
 * Purpose: to keep track of the client the user is currently viewing (active client)
 * across application.
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { getActiveClient, setActiveClient } from '@/lib/data';

// ------------------ Type Definitions ------------------
export type OrgAccess = 'approved' | 'pending' | 'revoked';

type Client = {
  id: string | null;
  name: string;
  hasClients: boolean;
  orgAccess?: OrgAccess;
};

type ActiveClientContextType = {
  client: Client;
  setClient: (c: Client) => void;
  handleClientChange: (
    id: string,
    name?: string,
    orgAccess?: OrgAccess
  ) => void;
  resetClient: () => void;
};

// ------------------ Default Values ------------------
const defaultClient: Client = { id: null, name: '', hasClients: false };

const ActiveClientContext = createContext<ActiveClientContextType>({
  client: defaultClient,
  setClient: () => {},
  handleClientChange: () => {},
  resetClient: () => {},
});

// Provides active client context across the application
export const ActiveClientProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClientState] = useState<Client>(defaultClient);

  // Fetches active client when component mounts
  useEffect(() => {
    const loadClient = async () => {
      try {
        const active = await getActiveClient();
        setClientState(active);
      } catch {
        setClientState(defaultClient);
      }
    };
    loadClient();
  }, []);

  // Updates the active client both locally and on the server
  const handleClientChange = async (
    id: string,
    name?: string,
    orgAccess?: OrgAccess
  ) => {
    const newClient = { id, name: name || '', hasClients: true, orgAccess };
    setClientState(newClient);
    await setActiveClient(id, name);
  };

  // Clears the currently active client both locally and on the server
  const resetClient = async () => {
    setClientState(defaultClient);
    await setActiveClient(null);
  };

  return (
    <ActiveClientContext.Provider
      value={{
        client,
        setClient: setClientState,
        handleClientChange,
        resetClient,
      }}
    >
      {children}
    </ActiveClientContext.Provider>
  );
};

// Custom hook to access the active client context
export const useActiveClient = () => useContext(ActiveClientContext);
