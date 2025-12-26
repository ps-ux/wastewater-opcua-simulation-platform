// Pump status card component

'use client';

import * as React from 'react';
import {
  Activity,
  Power,
  AlertTriangle,
  Thermometer,
  Gauge as GaugeIcon,
  Zap,
  Droplets,
  FolderTree,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PumpData } from '@/lib/types';

interface PumpCardProps {
  pump: PumpData;
  browsePath?: string;
  displayName?: string;
  onSelect?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  isSelected?: boolean;
}

export function PumpCard({ pump, browsePath, displayName, onSelect, onStart, onStop, isSelected }: PumpCardProps) {
  const getStatusBadge = () => {
    if (pump.is_faulted) {
      return <Badge variant="destructive">Faulted</Badge>;
    }
    if (pump.is_running) {
      return <Badge variant="success">Running</Badge>;
    }
    return <Badge variant="secondary">Stopped</Badge>;
  };

  const hasAlarms = pump.alarms && pump.alarms.some(a => a.active);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{displayName || pump.name}</CardTitle>
            <p className="font-mono text-xs text-zinc-400">{pump.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasAlarms && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            {getStatusBadge()}
          </div>
        </div>
        {browsePath && (
          <div className="mt-1 flex items-center gap-1.5 rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800 overflow-hidden">
            <FolderTree className="h-3 w-3 flex-shrink-0 text-zinc-400" />
            <code className="text-xs text-zinc-500 dark:text-zinc-400 truncate" title={browsePath}>{browsePath}</code>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Flow Rate */}
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-zinc-500">Flow</p>
              <p className="font-mono text-sm font-medium">
                {pump.flow_rate.toFixed(0)} m³/h
              </p>
            </div>
          </div>

          {/* RPM */}
          <div className="flex items-center gap-2">
            <GaugeIcon className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-zinc-500">RPM</p>
              <p className="font-mono text-sm font-medium">
                {pump.rpm.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Power */}
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-zinc-500">Power</p>
              <p className="font-mono text-sm font-medium">
                {pump.power_consumption.toFixed(1)} kW
              </p>
            </div>
          </div>

          {/* Bearing Temp */}
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-zinc-500">Bearing</p>
              <p className="font-mono text-sm font-medium">
                {pump.bearing_temp_de.toFixed(1)} °C
              </p>
            </div>
          </div>

          {/* Vibration */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-zinc-500">Vibration</p>
              <p className="font-mono text-sm font-medium">
                {pump.vibration_de_h.toFixed(2)} mm/s
              </p>
            </div>
          </div>

          {/* Runtime */}
          <div className="flex items-center gap-2">
            <Power className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Runtime</p>
              <p className="font-mono text-sm font-medium">
                {pump.runtime_hours.toFixed(0)} hrs
              </p>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant={pump.is_running ? 'secondary' : 'default'}
            className="flex-1"
            onClick={onStart}
            disabled={pump.is_running || pump.is_faulted}
          >
            Start
          </Button>
          <Button
            size="sm"
            variant={pump.is_running ? 'destructive' : 'secondary'}
            className="flex-1"
            onClick={onStop}
            disabled={!pump.is_running}
          >
            Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
