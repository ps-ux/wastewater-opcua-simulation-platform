// Main dashboard page - Overview

'use client';

import * as React from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  Activity,
  Server,
  Gauge,
  Zap,
  Thermometer,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import type { ServerState, HealthStatus, PumpData } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const fetcher = async (url: string) => {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function Dashboard() {
  const { data: serverState } = useSWR<ServerState>(
    '/api/server/status',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: health } = useSWR<HealthStatus>(
    '/api/health',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { pumps, pumpData, fetchPumps } = usePumpStore();
  const { isConnected } = usePumpWebSocket();

  useEffect(() => {
    fetchPumps();
  }, [fetchPumps]);

  const runningPumps = Object.values(pumpData).filter(p => p.is_running);
  const faultedPumps = Object.values(pumpData).filter(p => p.is_faulted);
  const totalPower = runningPumps.reduce((sum, p) => sum + (p.power_consumption || 0), 0);
  const totalFlow = runningPumps.reduce((sum, p) => sum + (p.flow_rate || 0), 0);
  const avgTemp = runningPumps.length > 0
    ? runningPumps.reduce((sum, p) => sum + (p.bearing_temp_de || 0), 0) / runningPumps.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <div className="flex justify-between items-center">
          <p className="text-zinc-500">System overview and real-time metrics</p>
          <Link href="/pubsub">
            <Button variant="outline" size="sm" className="gap-2 border-orange-500/50 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30">
              <Radio className="h-4 w-4" />
              Pub/Sub Explorer
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Running Pumps"
          value={`${runningPumps.length} / ${pumps.length}`}
          icon={<Activity className="h-5 w-5" />}
          trend={runningPumps.length > 0 ? 'up' : 'neutral'}
          color="blue"
        />
        <StatCard
          title="Total Flow"
          value={`${totalFlow.toFixed(0)} m³/h`}
          icon={<Gauge className="h-5 w-5" />}
          trend="up"
          color="cyan"
        />
        <StatCard
          title="Power Consumption"
          value={`${totalPower.toFixed(1)} kW`}
          icon={<Zap className="h-5 w-5" />}
          trend="neutral"
          color="yellow"
        />
        <StatCard
          title="Avg Bearing Temp"
          value={`${avgTemp.toFixed(1)} °C`}
          icon={<Thermometer className="h-5 w-5" />}
          trend={avgTemp > 70 ? 'warning' : 'neutral'}
          color="red"
        />
      </div>

      {/* Quick Actions & Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatusItem
                label="Simulation Mode"
                value={serverState?.simulation_mode || 'OPTIMAL'}
                status="active"
              />
              <StatusItem
                label="Time Acceleration"
                value={`${serverState?.time_acceleration || 1}x`}
                status="active"
              />
              <StatusItem
                label="Update Interval"
                value={`${serverState?.simulation_interval_ms || 1000}ms`}
                status="active"
              />
              <StatusItem
                label="WebSocket"
                value={isConnected ? 'Connected' : 'Disconnected'}
                status={isConnected ? 'active' : 'inactive'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {faultedPumps.length > 0 ? (
              <div className="space-y-2">
                {faultedPumps.map(pump => (
                  <div
                    key={pump.id}
                    className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-950"
                  >
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      {pump.name}
                    </span>
                    <Badge variant="destructive">Faulted</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 rounded-full bg-green-100 p-3 dark:bg-green-950">
                  <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-zinc-500">No active alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Running Pumps Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Running Pumps</CardTitle>
          <Link href="/monitoring">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {runningPumps.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {runningPumps.slice(0, 6).map(pump => (
                <PumpPreviewCard key={pump.id} pump={pump} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                <Gauge className="h-8 w-8 text-zinc-400" />
              </div>
              <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">No pumps running</p>
              <p className="mb-4 text-sm text-zinc-500">Start a pump from the Pump Control page</p>
              <Link href="/pumps">
                <Button>Go to Pump Control</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral' | 'warning';
  color: 'blue' | 'cyan' | 'yellow' | 'red' | 'green';
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        {trend === 'up' && (
          <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            Active
          </div>
        )}
        {trend === 'warning' && (
          <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusItemProps {
  label: string;
  value: string;
  status: 'active' | 'inactive' | 'warning';
}

function StatusItem({ label, value, status }: StatusItemProps) {
  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-zinc-400',
    warning: 'bg-yellow-500',
  };

  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
      <span className="text-sm text-zinc-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        <div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
      </div>
    </div>
  );
}

function PumpPreviewCard({ pump }: { pump: PumpData }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium">{pump.name}</span>
        <Badge variant="success">Running</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-zinc-500">Flow</p>
          <p className="font-mono font-medium">{pump.flow_rate.toFixed(0)} m³/h</p>
        </div>
        <div>
          <p className="text-zinc-500">RPM</p>
          <p className="font-mono font-medium">{pump.rpm.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-zinc-500">Power</p>
          <p className="font-mono font-medium">{pump.power_consumption.toFixed(1)} kW</p>
        </div>
        <div>
          <p className="text-zinc-500">Temp</p>
          <p className="font-mono font-medium">{pump.bearing_temp_de.toFixed(1)} °C</p>
        </div>
      </div>
    </div>
  );
}
