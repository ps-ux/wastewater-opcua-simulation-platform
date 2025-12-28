// Pump Management Page

'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  Filter,
  Search,
  Activity,
  AlertTriangle,
  Power,
  Settings,
  MoreVertical,
  PlayCircle,
  StopCircle,
  Gauge,
  Zap,
  Box,
  Thermometer,
  FolderTree,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DesignSpecsModal } from '@/components/pumps/design-specs-modal';
import Link from 'next/link';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import type { PumpData } from '@/lib/types';

type FilterType = 'all' | 'running' | 'stopped' | 'faulted';

export default function PumpsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { pumps, pumpData, fetchPumps, startPump, stopPump, startAllPumps, stopAllPumps, isLoading } = usePumpStore();
  const { isConnected } = usePumpWebSocket();

  useEffect(() => {
    fetchPumps();
  }, [fetchPumps]);

  const filteredPumps = pumps.filter(pump => {
    const data = pumpData[pump.id];
    if (!data) return filter === 'all';

    // Filter by status
    if (filter === 'running' && !data.is_running) return false;
    if (filter === 'stopped' && (data.is_running || data.is_faulted)) return false;
    if (filter === 'faulted' && !data.is_faulted) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        pump.name.toLowerCase().includes(query) ||
        pump.id.toLowerCase().includes(query) ||
        pump.browsePath?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const stats = {
    total: pumps.length,
    running: Object.values(pumpData).filter(p => p.is_running).length,
    stopped: Object.values(pumpData).filter(p => !p.is_running && !p.is_faulted).length,
    faulted: Object.values(pumpData).filter(p => p.is_faulted).length,
  };

  const handleStartAll = async () => {
    await startAllPumps();
  };

  const handleStopAll = async () => {
    await stopAllPumps();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Pump Control</h1>
          <p className="text-zinc-500">Manage and control all pumps</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleStopAll} disabled={stats.running === 0}>
            <Square className="mr-2 h-4 w-4" />
            Stop All
          </Button>
          <Button size="sm" onClick={handleStartAll} disabled={stats.stopped === 0}>
            <Play className="mr-2 h-4 w-4" />
            Start All
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Pumps"
          value={stats.total}
          icon={<Settings className="h-5 w-5" />}
          color="zinc"
        />
        <StatCard
          label="Running"
          value={stats.running}
          icon={<Activity className="h-5 w-5" />}
          color="green"
          onClick={() => setFilter('running')}
          active={filter === 'running'}
        />
        <StatCard
          label="Stopped"
          value={stats.stopped}
          icon={<Power className="h-5 w-5" />}
          color="zinc"
          onClick={() => setFilter('stopped')}
          active={filter === 'stopped'}
        />
        <StatCard
          label="Faulted"
          value={stats.faulted}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
          onClick={() => setFilter('faulted')}
          active={filter === 'faulted'}
        />
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <div className="flex gap-1">
                {(['all', 'running', 'stopped', 'faulted'] as FilterType[]).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search pumps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 sm:w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pump List */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredPumps.map((pump) => (
          <PumpControlCard
            key={pump.id}
            pump={pumpData[pump.id] || createDefaultPumpData(pump)}
            browsePath={pump.browsePath}
            displayName={pump.displayName}
            onStart={() => startPump(pump.id)}
            onStop={() => stopPump(pump.id)}
            isLoading={isLoading}
          />
        ))}

        {filteredPumps.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-800">
            <div className="mb-3 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
              <Search className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">No pumps found</p>
            <p className="text-sm text-zinc-500">
              {searchQuery ? 'Try a different search term' : 'No pumps match the current filter'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function createDefaultPumpData(pump: { id: string; name: string }): PumpData {
  return {
    id: pump.id,
    name: pump.name,
    is_running: false,
    is_faulted: false,
    flow_rate: 0,
    suction_pressure: 0,
    discharge_pressure: 0,
    rpm: 0,
    motor_current: 0,
    voltage: 0,
    power_consumption: 0,
    power_factor: 0,
    vfd_frequency: 0,
    motor_winding_temp: 25,
    bearing_temp_de: 25,
    bearing_temp_nde: 25,
    seal_chamber_temp: 25,
    ambient_temp: 25,
    vibration_de_h: 0,
    vibration_de_v: 0,
    vibration_de_a: 0,
    vibration_nde_h: 0,
    vibration_nde_v: 0,
    vibration_nde_a: 0,
    runtime_hours: 0,
    start_count: 0,
  };
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'zinc' | 'blue';
  onClick?: () => void;
  active?: boolean;
}

function StatCard({ label, value, icon, color, onClick, active }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-blue-500' : ''
        }`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface PumpControlCardProps {
  pump: PumpData;
  browsePath?: string;
  displayName?: string;
  onStart: () => void;
  onStop: () => void;
  isLoading: boolean;
}

function PumpControlCard({ pump, browsePath, displayName, onStart, onStop, isLoading }: PumpControlCardProps) {
  const getStatusBadge = () => {
    if (pump.is_faulted) {
      return <Badge variant="destructive">Faulted</Badge>;
    }
    if (pump.is_running) {
      return <Badge variant="success">Running</Badge>;
    }
    return <Badge variant="secondary">Stopped</Badge>;
  };

  return (
    <Card className={`transition-all ${pump.is_faulted ? 'border-red-300 dark:border-red-800' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{displayName || pump.name}</CardTitle>
              <DesignSpecsModal pumpId={pump.id} pumpName={pump.name} variant="icon" />
              {getStatusBadge()}
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-400">{pump.id}</p>
            {browsePath && (
              <div className="mt-2 flex items-center gap-1.5 rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                <FolderTree className="h-3 w-3 text-zinc-400" />
                <code className="truncate text-xs text-zinc-500" title={browsePath}>
                  {browsePath}
                </code>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          <QuickStat
            icon={<Gauge className="h-4 w-4" />}
            label="Flow"
            value={`${pump.flow_rate.toFixed(0)}`}
            unit="m³/h"
          />
          <QuickStat
            icon={<Activity className="h-4 w-4" />}
            label="RPM"
            value={`${pump.rpm.toFixed(0)}`}
          />
          <QuickStat
            icon={<Zap className="h-4 w-4" />}
            label="Power"
            value={`${pump.power_consumption.toFixed(1)}`}
            unit="kW"
          />
          <QuickStat
            icon={<Thermometer className="h-4 w-4" />}
            label="Temp"
            value={`${pump.bearing_temp_de.toFixed(1)}`}
            unit="°C"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant={pump.is_running ? 'secondary' : 'default'}
            onClick={onStart}
            disabled={pump.is_running || pump.is_faulted || isLoading}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Start
          </Button>
          <Button
            className="flex-1"
            variant={pump.is_running ? 'destructive' : 'secondary'}
            onClick={onStop}
            disabled={!pump.is_running || isLoading}
          >
            <StopCircle className="mr-2 h-4 w-4" />
            Stop
          </Button>
          <Link href={`/pumps/${pump.id}/3d`} className="contents">
            <Button variant="outline" className="px-3" title="View 3D Digital Twin">
              <Box className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Runtime Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>Runtime: {pump.runtime_hours.toFixed(1)} hrs</span>
          <span>Starts: {pump.start_count}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStat({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit?: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
        {icon}
      </div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="font-mono text-sm font-medium">
        {value}
        {unit && <span className="text-xs text-zinc-400"> {unit}</span>}
      </p>
    </div>
  );
}
