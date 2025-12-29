"use client";

import React from 'react';
import {
    Activity,
    Thermometer,
    Zap,
    Droplets,
    AlertTriangle,
    Play,
    Square,
    RotateCcw,
    Gauge
} from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PumpData } from '@/lib/types';

interface PumpControlPanelProps {
    pump: PumpData;
    onStart: () => void;
    onStop: () => void;
    onResetFault: () => void;
    onSetSpeed: (rpm: number) => void;
}

export function PumpControlPanel({
    pump,
    onStart,
    onStop,
    onResetFault,
    onSetSpeed
}: PumpControlPanelProps) {

    // --- Vibration Data Preparation ---
    const vibrationData = [
        { subject: 'DE Horiz', A: pump.vibration_de_h, fullMark: 10 },
        { subject: 'DE Vert', A: pump.vibration_de_v, fullMark: 10 },
        { subject: 'DE Axial', A: pump.vibration_de_a, fullMark: 10 },
        { subject: 'NDE Horiz', A: pump.vibration_nde_h, fullMark: 10 },
        { subject: 'NDE Vert', A: pump.vibration_nde_v, fullMark: 10 },
        { subject: 'NDE Axial', A: pump.vibration_nde_a, fullMark: 10 },
    ];

    // --- Temperature Status Helper ---
    const getTempStatus = (temp: number, warn: number, crit: number) => {
        if (temp >= crit) return "text-red-500 font-bold";
        if (temp >= warn) return "text-yellow-500 font-bold";
        return "text-green-500";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pump.name}</h2>
                    <p className="text-muted-foreground">Heavy-Duty Centrifugal Pump Simulator</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={pump.is_running ? "destructive" : "default"}
                        size="lg"
                        onClick={pump.is_running ? onStop : onStart}
                        disabled={pump.is_faulted}
                        className="w-32"
                    >
                        {pump.is_running ? <Square className="mr-2 h-5 w-5 fill-current" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                        {pump.is_running ? "STOP" : "START"}
                    </Button>
                    {pump.is_faulted && (
                        <Button variant="outline" size="lg" onClick={onResetFault} className="text-red-500 border-red-500 hover:bg-red-50">
                            <RotateCcw className="mr-2 h-5 w-5" />
                            RESET FAULT
                        </Button>
                    )}
                </div>
            </div>

            {/* Primary Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className={pump.is_running ? "border-green-500/50 bg-green-50/10" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Activity className={`h-4 w-4 ${pump.is_running ? "text-green-500" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {pump.is_faulted ? <span className="text-red-500">FAULTED</span> :
                                pump.is_running ? <span className="text-green-500">RUNNING</span> :
                                    "STOPPED"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Runtime: {pump.runtime_hours.toFixed(1)} hrs
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flow Rate</CardTitle>
                        <Droplets className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pump.flow_rate.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">GPM</span></div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Differential: {(pump.discharge_pressure - pump.suction_pressure).toFixed(1)} PSI
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Motor Speed</CardTitle>
                        <Gauge className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pump.rpm.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">RPM</span></div>
                        <p className="text-xs text-muted-foreground mt-1">
                            VFD Out: {pump.vfd_frequency.toFixed(1)} Hz
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Power</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pump.power_consumption.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kW</span></div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current: {pump.motor_current.toFixed(1)} A
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Vibration Analysis (Radar) */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-purple-500" />
                            Vibration Analysis
                        </CardTitle>
                        <CardDescription>6-Axis Mechanical Vibration (mm/s)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={vibrationData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                <Radar
                                    name="Vibration"
                                    dataKey="A"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Thermal Monitoring */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Thermometer className="h-5 w-5 text-red-500" />
                            Thermal Monitoring
                        </CardTitle>
                        <CardDescription>Component Temperatures (°C)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Motor Windings</span>
                                <span className={getTempStatus(pump.motor_winding_temp, 130, 155)}>
                                    {pump.motor_winding_temp.toFixed(1)}°C
                                </span>
                            </div>
                            <Progress value={(pump.motor_winding_temp / 180) * 100} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Drive End Bearing</span>
                                <span className={getTempStatus(pump.bearing_temp_de, 90, 110)}>
                                    {pump.bearing_temp_de.toFixed(1)}°C
                                </span>
                            </div>
                            <Progress value={(pump.bearing_temp_de / 150) * 100} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Non-Drive End Bearing</span>
                                <span className={getTempStatus(pump.bearing_temp_nde, 90, 110)}>
                                    {pump.bearing_temp_nde.toFixed(1)}°C
                                </span>
                            </div>
                            <Progress value={(pump.bearing_temp_nde / 150) * 100} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Seal Chamber</span>
                                <span className={getTempStatus(pump.seal_chamber_temp, 80, 100)}>
                                    {pump.seal_chamber_temp.toFixed(1)}°C
                                </span>
                            </div>
                            <Progress value={(pump.seal_chamber_temp / 120) * 100} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Electrical Diagnostics */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Electrical Diagnostics
                        </CardTitle>
                        <CardDescription>Power Quality & VFD Status</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Voltage</div>
                            <div className="text-2xl font-mono mt-1 text-blue-500">{pump.voltage.toFixed(0)} V</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Current</div>
                            <div className="text-2xl font-mono mt-1 text-yellow-500">{pump.motor_current.toFixed(1)} A</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Power Factor</div>
                            <div className="text-2xl font-mono mt-1 text-green-500">{pump.power_factor.toFixed(2)}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Frequency</div>
                            <div className="text-2xl font-mono mt-1 text-purple-500">{pump.vfd_frequency.toFixed(1)} Hz</div>
                        </div>

                        <div className="col-span-2 mt-4 p-4 border rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Speed Control</span>
                                <span className="text-xs text-muted-foreground">{pump.rpm.toFixed(0)} / 1200 RPM</span>
                            </div>
                            <input
                                type="range"
                                min="600"
                                max="1200"
                                step="10"
                                value={pump.is_running ? pump.rpm : 0}
                                disabled={!pump.is_running}
                                onChange={(e) => onSetSpeed(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
