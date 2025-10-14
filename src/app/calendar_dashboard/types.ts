// src/app/dashboard/types.ts
export type Task = {
  id: string;
  title: string;
  frequency: string;
  lastDone: string;
  nextDue: string;
  status: 'Due' | 'Pending' | 'Completed';
  comments: string[];
  files: string[];
};
