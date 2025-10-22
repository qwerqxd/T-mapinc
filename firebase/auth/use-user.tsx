'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import type { User } from '@/lib/types';

export const useUser = (): User | null => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider');
  }
  return context.user;
};
