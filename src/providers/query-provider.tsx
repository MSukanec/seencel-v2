'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface QueryProviderProps {
    children: React.ReactNode;
}

/**
 * 🚀 QueryProvider - React Query client wrapper
 * 
 * Configuration:
 * - staleTime: 30s - Data considered fresh for 30 seconds
 * - refetchOnWindowFocus: false - Don't spam server on tab focus
 * - retry: 1 - Only retry failed requests once
 */
export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000, // 30 seconds cache
                refetchOnWindowFocus: false,
                retry: 1,
            },
            mutations: {
                retry: 0, // Don't retry mutations
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
