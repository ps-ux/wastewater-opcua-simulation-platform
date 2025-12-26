// Custom hook for polling data at intervals

import { useEffect, useRef } from 'react';
import useSWR from 'swr';

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function usePolling<T>({
  fetcher,
  interval = 1000,
  enabled = true,
  onSuccess,
  onError,
}: UsePollingOptions<T>) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? 'polling-key' : null,
    fetcher,
    {
      refreshInterval: interval,
      revalidateOnFocus: false,
      dedupingInterval: interval / 2,
      onSuccess,
      onError,
    }
  );

  return { data, error, isLoading, refresh: mutate };
}

// Hook for server health polling
export function useHealthPolling(interval = 5000) {
  const { data, error, isLoading } = useSWR(
    '/api/health',
    async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/health`
      );
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    },
    {
      refreshInterval: interval,
      revalidateOnFocus: false,
    }
  );

  return { health: data, error, isLoading };
}

// Hook for server status polling
export function useServerStatusPolling(interval = 2000) {
  const { data, error, isLoading } = useSWR(
    '/api/server/status',
    async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/server/status`
      );
      if (!response.ok) throw new Error('Status check failed');
      return response.json();
    },
    {
      refreshInterval: interval,
      revalidateOnFocus: false,
    }
  );

  return { status: data, error, isLoading };
}
