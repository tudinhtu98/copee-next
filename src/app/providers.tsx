'use client';
import React, { useEffect } from 'react';
import { ReactQueryProvider } from '@/src/providers/query-client';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() as any;

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      // Session hết hạn và không thể refresh → tự động logout
      signOut({ callbackUrl: '/login' });
    }
  }, [session?.error]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <ReactQueryProvider>
        <SessionGuard>
          {children}
          <Toaster />
        </SessionGuard>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
