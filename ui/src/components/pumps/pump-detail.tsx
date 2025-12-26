// Pump detail view component

'use client';

import * as React from 'react';
import { FolderTree, Copy, Check } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge } from '@/components/ui/gauge';
import type { PumpData } from '@/lib/types';

interface PumpDetailProps {
  pump: PumpData;
  browsePath?: string;
  displayName?: string;
  history?: { timestamp: number; value: number }[];
}

export function PumpDetail({ pump, browsePath, displayName, history = [] }: PumpDetailProps) {
  const [copied, setCopied] = React.useState(false);

  const copyBrowsePath = () => {
    if (browsePath) {
      navigator.clipboard.writeText(browsePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{displayName || pump.name}</h2>
          <p className="font-mono text-sm text-zinc-500">{pump.id}</p>
          {browsePath && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                <FolderTree className="h-3.5 w-3.5 text-zinc-400" />
                <code className="text-sm text-zinc-600 dark:text-zinc-300">{browsePath}</code>
              </div>
              <button
                onClick={copyBrowsePath}
                className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Copy browse path"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-zinc-400" />
                )}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {pump.is_faulted && <Badge variant="destructive">Faulted</Badge>}
          {pump.is_running ? (
            <Badge variant="success">Running</Badge>
          ) : (
            <Badge variant="secondary">Stopped</Badge>
          )}
        </div>
      </div>

      {/* Alarms */}
      {pump.alarms && pump.alarms.filter(a => a.active).length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-700 dark:text-yellow-400">Active Alarms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pump.alarms
                .filter(a => a.active)
                .map((alarm, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="font-medium">{alarm.name}</span>
                    <span className="text-sm text-zinc-500">{alarm.message}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flow and Pressure */}
      <Card>
        <CardHeader>
          <CardTitle>Flow & Pressure</CardTitle>
          <CardDescription>Hydraulic performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Gauge
              value={pump.flow_rate}
              min={0}
              max={5000}
              label="Flow Rate"
              unit="m³/h"
            />
            <Gauge
              value={pump.suction_pressure}
              min={-0.5}
              max={1.0}
              label="Suction Pressure"
              unit="bar"
              warningThreshold={0.2}
              criticalThreshold={-0.1}
            />
            <Gauge
              value={pump.discharge_pressure}
              min={0}
              max={3.0}
              label="Discharge Pressure"
              unit="bar"
            />
          </div>
        </CardContent>
      </Card>

      {/* VFD / Electrical */}
      <Card>
        <CardHeader>
          <CardTitle>VFD / Electrical</CardTitle>
          <CardDescription>Motor and drive parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <Gauge
              value={pump.rpm}
              min={0}
              max={1800}
              label="Speed"
              unit="RPM"
            />
            <Gauge
              value={pump.motor_current}
              min={0}
              max={300}
              label="Motor Current"
              unit="A"
              warningThreshold={236}
              criticalThreshold={248}
            />
            <Gauge
              value={pump.voltage}
              min={0}
              max={520}
              label="Voltage"
              unit="V"
            />
            <Gauge
              value={pump.power_consumption}
              min={0}
              max={200}
              label="Power"
              unit="kW"
            />
            <Gauge
              value={pump.power_factor}
              min={0}
              max={1}
              label="Power Factor"
              unit=""
            />
            <Gauge
              value={pump.vfd_frequency}
              min={0}
              max={60}
              label="VFD Frequency"
              unit="Hz"
            />
          </div>
        </CardContent>
      </Card>

      {/* Temperature */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature</CardTitle>
          <CardDescription>Thermal monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <Gauge
              value={pump.motor_winding_temp}
              min={0}
              max={180}
              label="Motor Winding"
              unit="°C"
              warningThreshold={120}
              criticalThreshold={150}
            />
            <Gauge
              value={pump.bearing_temp_de}
              min={0}
              max={120}
              label="Bearing (DE)"
              unit="°C"
              warningThreshold={80}
              criticalThreshold={95}
            />
            <Gauge
              value={pump.bearing_temp_nde}
              min={0}
              max={120}
              label="Bearing (NDE)"
              unit="°C"
              warningThreshold={80}
              criticalThreshold={95}
            />
            <Gauge
              value={pump.seal_chamber_temp}
              min={0}
              max={100}
              label="Seal Chamber"
              unit="°C"
              warningThreshold={60}
              criticalThreshold={80}
            />
            <Gauge
              value={pump.ambient_temp}
              min={-10}
              max={50}
              label="Ambient"
              unit="°C"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vibration */}
      <Card>
        <CardHeader>
          <CardTitle>Vibration</CardTitle>
          <CardDescription>Mechanical health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <h4 className="mb-3 text-sm font-medium text-zinc-500">Drive End</h4>
              <div className="space-y-4">
                <Gauge
                  value={pump.vibration_de_h}
                  min={0}
                  max={30}
                  label="Horizontal"
                  unit="mm/s"
                  warningThreshold={7.1}
                  criticalThreshold={11.2}
                  size="sm"
                />
                <Gauge
                  value={pump.vibration_de_v}
                  min={0}
                  max={30}
                  label="Vertical"
                  unit="mm/s"
                  warningThreshold={7.1}
                  criticalThreshold={11.2}
                  size="sm"
                />
                <Gauge
                  value={pump.vibration_de_a}
                  min={0}
                  max={30}
                  label="Axial"
                  unit="mm/s"
                  warningThreshold={7.1}
                  criticalThreshold={11.2}
                  size="sm"
                />
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-medium text-zinc-500">Non-Drive End</h4>
              <div className="space-y-4">
                <Gauge
                  value={pump.vibration_nde_h}
                  min={0}
                  max={30}
                  label="Horizontal"
                  unit="mm/s"
                  warningThreshold={7.1}
                  criticalThreshold={11.2}
                  size="sm"
                />
                <Gauge
                  value={pump.vibration_nde_v}
                  min={0}
                  max={30}
                  label="Vertical"
                  unit="mm/s"
                  warningThreshold={7.1}
                  criticalThreshold={11.2}
                  size="sm"
                />
                <Gauge
                  value={pump.vibration_nde_a}
                  min={0}
                  max={30}
                  label="Axial"
                  unit="mm/s"
                  warningThreshold={7.1}
                  criticalThreshold={11.2}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runtime Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>Operational counters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{pump.runtime_hours.toFixed(0)}</p>
              <p className="text-sm text-zinc-500">Runtime Hours</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{pump.start_count}</p>
              <p className="text-sm text-zinc-500">Start Count</p>
            </div>
            {pump.wet_well_level !== undefined && (
              <div className="text-center">
                <p className="text-3xl font-bold">{pump.wet_well_level.toFixed(1)}</p>
                <p className="text-sm text-zinc-500">Wet Well (m)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart (if history available) */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Flow Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
