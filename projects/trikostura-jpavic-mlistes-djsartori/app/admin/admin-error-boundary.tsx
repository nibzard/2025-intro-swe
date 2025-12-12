'use client';

import { ErrorBoundary } from '@/components/error-boundary-client';
import { ReactNode } from 'react';

export function AdminErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In production, send to error tracking service
        if (process.env.NODE_ENV === 'production') {
          // TODO: Send to Sentry, LogRocket, etc.
          console.error('Admin panel error:', error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
