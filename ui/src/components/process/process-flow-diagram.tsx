"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PumpData } from '@/lib/types';

interface ProcessFlowDiagramProps {
    pumps: PumpData[];
    wetWellLevelNorth: number; // feet
    wetWellLevelSouth: number; // feet
}

export function ProcessFlowDiagram({
    pumps,
    wetWellLevelNorth,
    wetWellLevelSouth
}: ProcessFlowDiagramProps) {

    // Group pumps by wet well
    const northPumps = pumps.filter(p => ['IPS_PMP_001', 'IPS_PMP_002', 'IPS_PMP_003', 'IPS_PMP_004'].includes(p.id));
    const southPumps = pumps.filter(p => ['IPS_PMP_005', 'IPS_PMP_006', 'IPS_PMP_007'].includes(p.id));

    // Determine flow animation speeds based on total flow
    const totalFlowNorth = northPumps.reduce((acc, p) => acc + (p.flow_rate || 0), 0);
    const totalFlowSouth = southPumps.reduce((acc, p) => acc + (p.flow_rate || 0), 0);

    return (
        <Card className="w-full bg-slate-950/50 border-slate-800 backdrop-blur-sm overflow-hidden">
            <CardHeader>
                <CardTitle className="text-white">Process Flow: Influent Pump Station</CardTitle>
            </CardHeader>
            <CardContent className="relative h-[400px] p-0 select-none">

                {/* --- North Side --- */}
                <div className="absolute top-10 left-10 w-[40%] h-[150px] border-2 border-slate-600 rounded-lg bg-slate-900/50 overflow-hidden">
                    <div className="absolute top-2 left-2 text-xs font-bold text-slate-400">NORTH WET WELL</div>
                    <div className="absolute bottom-2 right-2 text-xs font-mono text-blue-400">{wetWellLevelNorth.toFixed(1)} ft</div>

                    {/* Water Level Animation */}
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-blue-500/30 border-t border-blue-400/50"
                        animate={{ height: `${(wetWellLevelNorth / 20) * 100}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                    />
                </div>

                {/* North Pumps */}
                <div className="absolute top-[160px] left-10 w-[40%] flex justify-around">
                    {northPumps.map((pump, i) => (
                        <div key={pump.id} className="flex flex-col items-center gap-1">
                            <div className={`w-1 h-8 ${pump.is_running ? "bg-blue-400 animate-pulse" : "bg-slate-700"}`} />
                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 
                  ${pump.is_faulted ? "border-red-500 bg-red-900/20 text-red-500" :
                                    pump.is_running ? "border-green-500 bg-green-900/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" :
                                        "border-slate-600 bg-slate-800 text-slate-500"}`}>
                                P-{i + 1}
                            </div>
                            {pump.is_running && (
                                <div className="text-[10px] font-mono text-blue-300">{pump.flow_rate.toFixed(0)}</div>
                            )}
                        </div>
                    ))}
                </div>


                {/* --- South Side --- */}
                <div className="absolute top-10 right-10 w-[30%] h-[150px] border-2 border-slate-600 rounded-lg bg-slate-900/50 overflow-hidden">
                    <div className="absolute top-2 left-2 text-xs font-bold text-slate-400">SOUTH WET WELL</div>
                    <div className="absolute bottom-2 right-2 text-xs font-mono text-blue-400">{wetWellLevelSouth.toFixed(1)} ft</div>

                    <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-blue-500/30 border-t border-blue-400/50"
                        animate={{ height: `${(wetWellLevelSouth / 20) * 100}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                    />
                </div>

                {/* South Pumps */}
                <div className="absolute top-[160px] right-10 w-[30%] flex justify-around">
                    {southPumps.map((pump, i) => (
                        <div key={pump.id} className="flex flex-col items-center gap-1">
                            <div className={`w-1 h-8 ${pump.is_running ? "bg-blue-400 animate-pulse" : "bg-slate-700"}`} />
                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 
                  ${pump.is_faulted ? "border-red-500 bg-red-900/20 text-red-500" :
                                    pump.is_running ? "border-green-500 bg-green-900/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" :
                                        "border-slate-600 bg-slate-800 text-slate-500"}`}>
                                P-{i + 5}
                            </div>
                            {pump.is_running && (
                                <div className="text-[10px] font-mono text-blue-300">{pump.flow_rate.toFixed(0)}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* --- Discharge Header --- */}
                <div className="absolute bottom-10 left-0 right-0 h-12 bg-slate-800 mx-8 rounded-full flex items-center justify-center border border-slate-600 relative overflow-hidden">
                    <div className="z-10 text-xs font-bold tracking-widest text-slate-300">DISCHARGE HEADER TO HEADWORKS</div>

                    {/* Flow Animation */}
                    {(totalFlowNorth > 0 || totalFlowSouth > 0) && (
                        <div className="absolute inset-0 opacity-30 flex items-center space-x-12 animate-marquee">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="w-4 h-1 bg-blue-400 rounded-full" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pipe Connections */}
                <svg className="absolute inset-0 pointer-events-none stroke-slate-600" style={{ opacity: 0.5 }}>
                    {/* North connections */}
                    {northPumps.map((_, i) => {
                        const x = 100 + i * 80; // Approximate positions
                        return <path key={`n-${i}`} d={`M ${120 + i * 90} 220 L ${120 + i * 90} 340`} strokeWidth="4" fill="none" />
                    })}

                    {/* South connections */}
                    {southPumps.map((_, i) => {
                        return <path key={`s-${i}`} d={`M ${550 + i * 90} 220 L ${550 + i * 90} 340`} strokeWidth="4" fill="none" />
                    })}
                </svg>

            </CardContent>
        </Card>
    );
}
