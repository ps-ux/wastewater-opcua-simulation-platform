// Services Status Page

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Server,
  Database,
  Radio,
  Activity,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  HardDrive,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import type { ServerState, HealthStatus } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const fetcher = async (url: string) => {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

interface ServiceStatus {
  name: string;
  description: string;
  status: 'online' | 'offline' | 'degraded' | 'connecting';
  icon: React.ReactNode;
  endpoint?: string;
  latency?: number;
  details?: { label: string; value: string }[];
}

export default function ServicesPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  const { data: health, mutate: refreshHealth } = useSWR<HealthStatus>(
    '/api/health',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: serverState } = useSWR<ServerState>(
    '/api/server/status',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { isConnected: wsConnected, error: wsError } = usePumpWebSocket();

  // Measure API latency
  useEffect(() => {
    const measureLatency = async () => {
      const start = performance.now();
      try {
        await fetch(`${API_BASE}/api/health`);
        const end = performance.now();
        setApiLatency(Math.round(end - start));
      } catch {
        setApiLatency(null);
      }
    };
    measureLatency();
    const interval = setInterval(measureLatency, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    refreshHealth();
    setLastRefresh(new Date());
  };

  const services: ServiceStatus[] = [
    {
      name: 'OPC-UA Server',
      description: 'Industrial automation protocol server',
      status: health?.opcua_server ? 'online' : 'offline',
      icon: <Server className="h-6 w-6" />,
      endpoint: 'opc.tcp://localhost:4840',
      details: [
        { label: 'Protocol', value: 'OPC-UA' },
        { label: 'Port', value: '4840' },
        { label: 'Pumps', value: `${health?.pump_count || 0}` },
        { label: 'Chambers', value: `${health?.chamber_count || 0}` },
      ],
    },
    {
      name: 'REST API',
      description: 'HTTP API for configuration and control',
      status: health ? 'online' : 'offline',
      icon: <Globe className="h-6 w-6" />,
      endpoint: API_BASE,
      latency: apiLatency || undefined,
      details: [
        { label: 'Protocol', value: 'HTTP/REST' },
        { label: 'Port', value: '8080' },
        { label: 'Docs', value: '/docs' },
      ],
    },
    {
      name: 'WebSocket',
      description: 'Real-time data streaming',
      status: wsConnected ? 'online' : wsError ? 'offline' : 'connecting',
      icon: <Radio className="h-6 w-6" />,
      endpoint: 'ws://localhost:8080/ws/pumps',
      details: [
        { label: 'Protocol', value: 'WebSocket' },
        { label: 'Path', value: '/ws/pumps' },
        { label: 'Updates', value: 'Real-time' },
      ],
    },
    {
      name: 'SQLite Database',
      description: 'Configuration and state persistence',
      status: health?.database ? 'online' : 'offline',
      icon: <Database className="h-6 w-6" />,
      details: [
        { label: 'Engine', value: 'SQLite' },
        { label: 'File', value: 'server.db' },
      ],
    },
    {
      name: 'Simulation Engine',
      description: 'Physics-based pump simulation',
      status: health?.simulation_running ? 'online' : 'offline',
      icon: <Activity className="h-6 w-6" />,
      details: [
        { label: 'Mode', value: serverState?.simulation_mode || 'N/A' },
        { label: 'Interval', value: `${serverState?.simulation_interval_ms || 1000}ms` },
        { label: 'Time Accel', value: `${serverState?.time_acceleration || 1}x` },
      ],
    },
  ];

  const onlineCount = services.filter(s => s.status === 'online').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Services</h1>
          <p className="text-zinc-500">Monitor system services and connectivity</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className="border-2">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${
                onlineCount === services.length
                  ? 'bg-green-100 dark:bg-green-950'
                  : onlineCount > 0
                  ? 'bg-yellow-100 dark:bg-yellow-950'
                  : 'bg-red-100 dark:bg-red-950'
              }`}>
                {onlineCount === services.length ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : onlineCount > 0 ? (
                  <Activity className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {onlineCount === services.length
                    ? 'All Systems Operational'
                    : onlineCount > 0
                    ? 'Partial Service Disruption'
                    : 'System Offline'}
                </h2>
                <p className="text-zinc-500">
                  {onlineCount} of {services.length} services running
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={onlineCount === services.length ? 'success' : 'secondary'} className="text-sm">
                {onlineCount} Online
              </Badge>
              {services.length - onlineCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {services.length - onlineCount} Offline
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} />
        ))}
      </div>

      {/* Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Connection Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              icon={<Server className="h-4 w-4" />}
              label="OPC-UA Endpoint"
              value="opc.tcp://localhost:4840"
            />
            <InfoItem
              icon={<Globe className="h-4 w-4" />}
              label="REST API"
              value={API_BASE}
            />
            <InfoItem
              icon={<Radio className="h-4 w-4" />}
              label="WebSocket"
              value="ws://localhost:8080/ws/pumps"
            />
            <InfoItem
              icon={<HardDrive className="h-4 w-4" />}
              label="Database"
              value="config/server.db"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const statusConfig = {
    online: {
      badge: 'success' as const,
      text: 'Online',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-900',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    offline: {
      badge: 'destructive' as const,
      text: 'Offline',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-900',
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    degraded: {
      badge: 'secondary' as const,
      text: 'Degraded',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      borderColor: 'border-yellow-200 dark:border-yellow-900',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    connecting: {
      badge: 'secondary' as const,
      text: 'Connecting',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-900',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const config = statusConfig[service.status];

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`rounded-lg p-2.5 ${config.iconBg}`}>
            <span className={config.iconColor}>{service.icon}</span>
          </div>
          <Badge variant={config.badge}>{config.text}</Badge>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{service.name}</h3>
          <p className="mt-1 text-sm text-zinc-500">{service.description}</p>
        </div>

        {service.endpoint && (
          <div className="mt-3">
            <code className="text-xs text-zinc-500 dark:text-zinc-400 break-all">
              {service.endpoint}
            </code>
          </div>
        )}

        {service.latency !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-zinc-400" />
            <span className="text-zinc-500">{service.latency}ms</span>
          </div>
        )}

        {service.details && (
          <div className="mt-4 space-y-1.5">
            {service.details.map((detail) => (
              <div key={detail.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{detail.label}</span>
                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100 break-all">
        {value}
      </p>
    </div>
  );
}
