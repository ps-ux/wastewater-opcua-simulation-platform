// Simulation control panel component

'use client';

import * as React from 'react';
import { useState } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SimulationMode, FailureType, ServerState } from '@/lib/types';

interface SimulationControlsProps {
  serverState: ServerState | null;
  onSetMode: (mode: SimulationMode) => void;
  onReset: () => void;
  onTriggerFailure: (type: FailureType) => void;
  isLoading?: boolean;
}

const SIMULATION_MODES: { value: SimulationMode; label: string; description: string; color: string }[] = [
  {
    value: 'OPTIMAL',
    label: 'Optimal',
    description: 'New equipment, peak performance',
    color: 'bg-green-500',
  },
  {
    value: 'AGED',
    label: 'Aged',
    description: 'Years of normal wear',
    color: 'bg-blue-500',
  },
  {
    value: 'DEGRADED',
    label: 'Degraded',
    description: 'Component wear and degradation',
    color: 'bg-yellow-500',
  },
  {
    value: 'FAILURE',
    label: 'Failure',
    description: 'Simulated failure condition',
    color: 'bg-red-500',
  },
];

const FAILURE_TYPES: { value: FailureType; label: string }[] = [
  { value: 'BEARING', label: 'Bearing Failure' },
  { value: 'SEAL', label: 'Seal Failure' },
  { value: 'CAVITATION', label: 'Cavitation' },
  { value: 'IMPELLER', label: 'Impeller Damage' },
  { value: 'MOTOR', label: 'Motor Failure' },
];

export function SimulationControls({
  serverState,
  onSetMode,
  onReset,
  onTriggerFailure,
  isLoading,
}: SimulationControlsProps) {
  const [showFailureMenu, setShowFailureMenu] = useState(false);

  const currentMode = serverState?.simulation_mode || 'OPTIMAL';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Simulation Control
            </CardTitle>
            <CardDescription>
              Control simulation mode and trigger events
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset} disabled={isLoading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-zinc-500">Simulation Mode</h4>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {SIMULATION_MODES.map((mode) => (
              <button
                key={mode.value}
                className={`flex flex-col items-center rounded-lg border-2 p-3 transition-all ${
                  currentMode === mode.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800'
                }`}
                onClick={() => onSetMode(mode.value)}
                disabled={isLoading}
              >
                <div className={`mb-2 h-3 w-3 rounded-full ${mode.color}`} />
                <span className="font-medium">{mode.label}</span>
                <span className="text-center text-xs text-zinc-500">{mode.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Configuration */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Interval</p>
            <p className="font-mono text-lg font-medium">
              {serverState?.simulation_interval_ms || 1000}ms
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Time Accel</p>
            <p className="font-mono text-lg font-medium">
              {serverState?.time_acceleration || 1}x
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Diurnal</p>
            <p className="text-lg font-medium">
              {serverState?.diurnal_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Status</p>
            <Badge variant={serverState?.status === 'running' ? 'success' : 'secondary'}>
              {serverState?.status || 'Unknown'}
            </Badge>
          </div>
        </div>

        {/* Failure Trigger */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-zinc-500">Trigger Failure</h4>
          <div className="relative">
            <Button
              variant="destructive"
              className="w-full md:w-auto"
              onClick={() => setShowFailureMenu(!showFailureMenu)}
              disabled={isLoading}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Trigger Failure
            </Button>

            {showFailureMenu && (
              <div className="absolute left-0 top-full z-10 mt-2 w-56 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                {FAILURE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => {
                      onTriggerFailure(type.value);
                      setShowFailureMenu(false);
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mode-specific Config */}
        {currentMode === 'AGED' && serverState?.aged_config && (
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h4 className="mb-3 font-medium">Aged Configuration</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Years</p>
                <p className="font-mono text-lg">{serverState.aged_config.years}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Hours/Year</p>
                <p className="font-mono text-lg">{serverState.aged_config.hours_per_year}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Starts/Year</p>
                <p className="font-mono text-lg">{serverState.aged_config.starts_per_year}</p>
              </div>
            </div>
          </div>
        )}

        {currentMode === 'DEGRADED' && serverState?.degraded_config && (
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h4 className="mb-3 font-medium">Degraded Configuration</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Impeller Wear</p>
                <p className="font-mono text-lg">{serverState.degraded_config.impeller_wear}%</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Bearing Wear</p>
                <p className="font-mono text-lg">{serverState.degraded_config.bearing_wear}%</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Seal Wear</p>
                <p className="font-mono text-lg">{serverState.degraded_config.seal_wear}%</p>
              </div>
            </div>
          </div>
        )}

        {currentMode === 'FAILURE' && serverState?.failure_config && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <h4 className="mb-3 font-medium text-red-700 dark:text-red-400">Failure Configuration</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Type</p>
                <p className="font-mono text-lg">{serverState.failure_config.type}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Progression</p>
                <p className="font-mono text-lg">{serverState.failure_config.progression}%</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Time to Failure</p>
                <p className="font-mono text-lg">{serverState.failure_config.time_to_failure}h</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
