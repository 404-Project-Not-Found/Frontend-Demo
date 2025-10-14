'use client';
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Task = {
  id: string;
  title: string;
  comments: string[];
  files: string[];
  completed: boolean;
  status: 'Not Started' | 'In Progress' | 'Completed';
};

type TaskContextType = {
  tasks: Task[];
  addComment: (taskId: string, comment: string) => void;
  addFile: (taskId: string, file: string) => void;
  toggleCompletion: (taskId: string) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Task 1',
      comments: [],
      files: [],
      completed: false,
      status: 'Not Started',
    },
    {
      id: '2',
      title: 'Task 2',
      comments: [],
      files: [],
      completed: false,
      status: 'Not Started',
    },
  ]);

  const addComment = (taskId: string, comment: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t
      )
    );
  };

  const addFile = (taskId: string, file: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, files: [...t.files, file] } : t
      )
    );
  };

  const toggleCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              status: !t.completed ? 'Completed' : 'In Progress',
            }
          : t
      )
    );
  };

  return (
    <TaskContext.Provider
      value={{ tasks, addComment, addFile, toggleCompletion }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
