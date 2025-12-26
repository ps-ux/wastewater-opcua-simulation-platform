// Header component with server status

'use client';

import * as React from 'react';
import { Server, Activity, Database, AlertCircle, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { HealthStatus, ServerStatus } from '@/lib/types';

interface HeaderProps {
  health: HealthStatus | null;
  serverStatus: ServerStatus;
  wsConnected?: boolean;
}

export function Header({ health, serverStatus, wsConnected }: HeaderProps) {
  const getStatusColor = () => {
    if (!health) return 'bg-zinc-500';
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-zinc-500';
    }
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
            <Server className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Pump Simulation</h1>
            <p className="text-xs text-zinc-500">OPC-UA Server</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Server Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium">
              {serverStatus === 'running' ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Health Indicators */}
          {health && (
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Server className={`h-4 w-4 ${health.opcua_server ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-xs text-zinc-500">OPC-UA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className={`h-4 w-4 ${health.database ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-xs text-zinc-500">DB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className={`h-4 w-4 ${health.simulation_running ? 'text-green-500' : 'text-zinc-400'}`} />
                <span className="text-xs text-zinc-500">Sim</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Radio className={`h-4 w-4 ${wsConnected ? 'text-green-500' : 'text-zinc-400'}`} />
                <span className="text-xs text-zinc-500">Live</span>
              </div>
            </div>
          )}

          {/* Counts */}
          {health && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{health.pump_count} Pumps</Badge>
              <Badge variant="outline">{health.chamber_count} Chambers</Badge>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
