'use client';
import React from 'react';
import { ReactQueryProvider } from '@/providers/query-client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      {children}
    </ReactQueryProvider>
  );
}
