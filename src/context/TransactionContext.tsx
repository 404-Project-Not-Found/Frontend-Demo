'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Transaction type
export interface Transaction {
  id: string; // ✅ unique ID for each transaction
  type: string;
  date: string;
  madeBy: string;
  receipt: string;
  items: string[];
}

// Context interface
interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void; // ✅ omit id
}

// Create context
const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

// Provider component
export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'Purchase',
      date: '23/09/2025',
      madeBy: 'Jess Brown (Carer)',
      receipt: '[Link to receipt]',
      items: ['Toothbrush replacement', 'Socks', 'Shirts'],
    },
    {
      id: '2',
      type: 'Refund',
      date: '18/10/2025',
      madeBy: 'Jess Brown (Carer)',
      receipt: '[Link to receipt]',
      items: ['Socks'],
    },
  ]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(), // ✅ generate unique ID
      ...t,
    };
    setTransactions((prev) => [...prev, newTransaction]);
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
}

// Custom hook to use context
export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error(
      'useTransactions must be used within a TransactionProvider'
    );
  }
  return context;
}
