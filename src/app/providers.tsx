'use client';
import React from 'react';
import { ReactQueryProvider } from '@/src/providers/query-client';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        {children}
      </ReactQueryProvider>
    </SessionProvider>
  );
}
