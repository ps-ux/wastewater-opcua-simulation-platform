// Live Monitoring Page

'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Gauge,
  Zap,
  Thermometer,
  Droplets,
  Wind,
  Clock,
  Radio,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart } from '@/components/charts/line-chart';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import { usePumpHistory } from '@/hooks/use-pump-history';
import type { PumpData } from '@/lib/types';

export default function MonitoringPage() {
  const [selectedPumpId, setSelectedPumpId] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);

  const { pumps, pumpData, fetchPumps } = usePumpStore();
  const { isConnected } = usePumpWebSocket();

  useEffect(() => {
    fetchPumps();
  }, [fetchPumps]);

  const runningPumps = useMemo(() =>
    pumps.filter(p => pumpData[p.id]?.is_running),
    [pumps, pumpData]
  );

  // Auto-select first running pump
  useEffect(() => {
    if (!selectedPumpId && runningPumps.length > 0) {
      setSelectedPumpId(runningPumps[0].id);
    }
  }, [selectedPumpId, runningPumps]);

  const selectedPump = selectedPumpId ? pumpData[selectedPumpId] : null;
  const selectedPumpInfo = pumps.find(p => p.id === selectedPumpId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Live Monitoring</h1>
          <p className="text-zinc-500">Real-time pump performance data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
            isConnected
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
          }`}>
            <Radio className={`h-4 w-4 ${isConnected ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {runningPumps.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
              <Activity className="h-10 w-10 text-zinc-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">No Pumps Running</h2>
            <p className="mt-2 max-w-md text-zinc-500">
              Start a pump from the Pump Control page to see live monitoring data and real-time charts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Pump Selector */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Running Pumps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {runningPumps.map(pump => (
                <PumpSelectorItem
                  key={pump.id}
                  pump={pumpData[pump.id]}
                  displayName={pump.displayName}
                  isSelected={selectedPumpId === pump.id}
                  onClick={() => setSelectedPumpId(pump.id)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Main Monitoring View */}
          <div className={`space-y-6 ${expandedView ? 'lg:col-span-3' : 'lg:col-span-3'}`}>
            {selectedPump && (
              <>
                {/* Pump Header */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold">
                            {selectedPumpInfo?.displayName || selectedPump.name}
                          </h2>
                          <Badge variant="success">Running</Badge>
                        </div>
                        <p className="mt-1 font-mono text-sm text-zinc-400">{selectedPump.id}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedView(!expandedView)}
                      >
                        {expandedView ? (
                          <><Minimize2 className="mr-2 h-4 w-4" />Collapse</>
                        ) : (
                          <><Maximize2 className="mr-2 h-4 w-4" />Expand</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    icon={<Droplets className="h-5 w-5" />}
                    label="Flow Rate"
                    value={selectedPump.flow_rate.toFixed(0)}
                    unit="m³/h"
                    color="blue"
                  />
                  <MetricCard
                    icon={<Gauge className="h-5 w-5" />}
                    label="RPM"
                    value={selectedPump.rpm.toFixed(0)}
                    color="purple"
                  />
                  <MetricCard
                    icon={<Zap className="h-5 w-5" />}
                    label="Power"
                    value={selectedPump.power_consumption.toFixed(1)}
                    unit="kW"
                    color="yellow"
                  />
                  <MetricCard
                    icon={<Thermometer className="h-5 w-5" />}
                    label="Bearing Temp"
                    value={selectedPump.bearing_temp_de.toFixed(1)}
                    unit="°C"
                    color={selectedPump.bearing_temp_de > 70 ? 'red' : 'green'}
                  />
                </div>

                {/* Charts */}
                <PumpCharts pumpId={selectedPump.id} pump={selectedPump} />

                {/* Detailed Values */}
                <DetailedValues pump={selectedPump} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PumpSelectorItem({
  pump,
  displayName,
  isSelected,
  onClick,
}: {
  pump: PumpData | undefined;
  displayName?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (!pump) return null;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {displayName || pump.name}
        </span>
        <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-blue-500' : 'text-zinc-400'}`} />
      </div>
      <div className="mt-2 flex gap-4 text-xs text-zinc-500">
        <span>{pump.flow_rate.toFixed(0)} m³/h</span>
        <span>{pump.rpm.toFixed(0)} RPM</span>
      </div>
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: 'blue' | 'purple' | 'yellow' | 'green' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="font-mono text-xl font-bold">
              {value}
              {unit && <span className="ml-1 text-sm font-normal text-zinc-400">{unit}</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PumpCharts({ pumpId, pump }: { pumpId: string; pump: PumpData }) {
  const { history } = usePumpHistory(pumpId);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Flow Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={history.flow_rate}
            color="#3b82f6"
            unit=" m³/h"
            minValue={0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            RPM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={history.rpm}
            color="#8b5cf6"
            minValue={0}
            maxValue={1200}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Power Consumption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={history.power_consumption}
            color="#eab308"
            unit=" kW"
            minValue={0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Bearing Temperature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={history.bearing_temp_de}
            color="#ef4444"
            unit=" °C"
            minValue={20}
            maxValue={100}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Vibration (DE Horizontal)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={history.vibration_de_h}
            color="#22c55e"
            unit=" mm/s"
            minValue={0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Pressure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-zinc-500">Suction</p>
              <LineChart
                data={history.suction_pressure}
                color="#06b6d4"
                height={50}
                showGrid={false}
                unit=" bar"
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-zinc-500">Discharge</p>
              <LineChart
                data={history.discharge_pressure}
                color="#0ea5e9"
                height={50}
                showGrid={false}
                unit=" bar"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailedValues({ pump }: { pump: PumpData }) {
  interface DetailItem {
    label: string;
    value: number;
    unit: string;
    decimals?: number;
  }

  interface DetailSection {
    title: string;
    icon: React.ReactNode;
    items: DetailItem[];
  }

  const sections: DetailSection[] = [
    {
      title: 'Flow & Pressure',
      icon: <Droplets className="h-4 w-4" />,
      items: [
        { label: 'Flow Rate', value: pump.flow_rate, unit: 'm³/h' },
        { label: 'Suction Pressure', value: pump.suction_pressure, unit: 'bar' },
        { label: 'Discharge Pressure', value: pump.discharge_pressure, unit: 'bar' },
      ],
    },
    {
      title: 'Electrical',
      icon: <Zap className="h-4 w-4" />,
      items: [
        { label: 'Motor Current', value: pump.motor_current, unit: 'A' },
        { label: 'Voltage', value: pump.voltage, unit: 'V' },
        { label: 'Power Factor', value: pump.power_factor, unit: '' },
        { label: 'VFD Frequency', value: pump.vfd_frequency, unit: 'Hz' },
      ],
    },
    {
      title: 'Temperature',
      icon: <Thermometer className="h-4 w-4" />,
      items: [
        { label: 'Motor Winding', value: pump.motor_winding_temp, unit: '°C' },
        { label: 'Bearing DE', value: pump.bearing_temp_de, unit: '°C' },
        { label: 'Bearing NDE', value: pump.bearing_temp_nde, unit: '°C' },
        { label: 'Seal Chamber', value: pump.seal_chamber_temp, unit: '°C' },
        { label: 'Ambient', value: pump.ambient_temp, unit: '°C' },
      ],
    },
    {
      title: 'Vibration',
      icon: <Wind className="h-4 w-4" />,
      items: [
        { label: 'DE Horizontal', value: pump.vibration_de_h, unit: 'mm/s' },
        { label: 'DE Vertical', value: pump.vibration_de_v, unit: 'mm/s' },
        { label: 'DE Axial', value: pump.vibration_de_a, unit: 'mm/s' },
        { label: 'NDE Horizontal', value: pump.vibration_nde_h, unit: 'mm/s' },
        { label: 'NDE Vertical', value: pump.vibration_nde_v, unit: 'mm/s' },
        { label: 'NDE Axial', value: pump.vibration_nde_a, unit: 'mm/s' },
      ],
    },
    {
      title: 'Counters',
      icon: <Clock className="h-4 w-4" />,
      items: [
        { label: 'Runtime Hours', value: pump.runtime_hours, unit: 'hrs', decimals: 1 },
        { label: 'Start Count', value: pump.start_count, unit: '', decimals: 0 },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Values</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {section.icon}
                {section.title}
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">{item.label}</span>
                    <span className="font-mono text-sm font-medium">
                      {item.value.toFixed(item.decimals ?? 2)}
                      {item.unit && <span className="ml-1 text-zinc-400">{item.unit}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
