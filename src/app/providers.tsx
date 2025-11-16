'use client';
import React from 'react';
import { ReactQueryProvider } from '@/src/providers/query-client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        {children}
        <Toaster />
      </ReactQueryProvider>
    </SessionProvider>
  );
}
