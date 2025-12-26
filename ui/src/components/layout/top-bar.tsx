// Top bar with status indicators

'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Server, Database, Activity, Radio, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import type { HealthStatus } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const fetcher = async (url: string) => {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function TopBar() {
  const { data: health } = useSWR<HealthStatus>(
    '/api/health',
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: false }
  );

  const { isConnected: wsConnected } = usePumpWebSocket();

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-6">
        {/* Quick Status */}
        <div className="flex items-center gap-4">
          <StatusIndicator
            icon={<Server className="h-4 w-4" />}
            label="OPC-UA"
            status={health?.opcua_server ? 'online' : 'offline'}
          />
          <StatusIndicator
            icon={<Database className="h-4 w-4" />}
            label="Database"
            status={health?.database ? 'online' : 'offline'}
          />
          <StatusIndicator
            icon={<Activity className="h-4 w-4" />}
            label="Simulation"
            status={health?.simulation_running ? 'online' : 'offline'}
          />
          <StatusIndicator
            icon={<Radio className="h-4 w-4" />}
            label="WebSocket"
            status={wsConnected ? 'online' : 'offline'}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {health && (
          <>
            <Badge variant="outline" className="font-mono">
              {health.pump_count} Pumps
            </Badge>
            <Badge variant="outline" className="font-mono">
              {health.chamber_count} Chambers
            </Badge>
          </>
        )}
        <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
          {wsConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-zinc-400" />
          )}
          <span className="text-xs font-medium">
            {wsConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
}

interface StatusIndicatorProps {
  icon: React.ReactNode;
  label: string;
  status: 'online' | 'offline' | 'warning';
}

function StatusIndicator({ icon, label, status }: StatusIndicatorProps) {
  const statusColors = {
    online: 'text-green-500',
    offline: 'text-zinc-400',
    warning: 'text-yellow-500',
  };

  const dotColors = {
    online: 'bg-green-500',
    offline: 'bg-zinc-400',
    warning: 'bg-yellow-500',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={statusColors[status]}>{icon}</span>
      <span className="text-xs text-zinc-500">{label}</span>
      <div className={`h-1.5 w-1.5 rounded-full ${dotColors[status]}`} />
    </div>
  );
}
