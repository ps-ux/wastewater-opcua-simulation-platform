'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Info, X, Gauge, Zap, Droplets, Wind, ThermometerSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pumpsApi } from '@/lib/api';

interface DesignSpec {
    label: string;
    value: string | number;
    unit: string;
    icon?: React.ReactNode;
    category: 'hydraulic' | 'electrical' | 'mechanical';
}

interface DesignSpecsModalProps {
    pumpId: string;
    pumpName: string;
    variant?: 'icon' | 'button' | 'link';
    className?: string;
    dropdownMode?: boolean; // If true, shows as dropdown from button instead of centered modal
}

export function DesignSpecsModal({ pumpId, pumpName, variant = 'icon', className = '', dropdownMode = false }: DesignSpecsModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [specs, setSpecs] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside for dropdown mode
    useEffect(() => {
        if (!isOpen || !dropdownMode) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, dropdownMode]);

    const fetchSpecs = async () => {
        if (specs) {
            setIsOpen(!isOpen);
            return;
        }

        setLoading(true);
        try {
            const response = await pumpsApi.getById(pumpId);
            setSpecs(response.data.design_specs || {});
            setIsOpen(true);
        } catch (error) {
            console.error('Failed to fetch design specs:', error);
        } finally {
            setLoading(false);
        }
    };

    const designSpecs: DesignSpec[] = specs ? [
        // Hydraulic
        { label: 'Design Flow', value: specs.DesignFlow || 2500, unit: 'm³/h', icon: <Droplets className="h-4 w-4" />, category: 'hydraulic' },
        { label: 'Design Head', value: specs.DesignHead || 15, unit: 'm', icon: <Gauge className="h-4 w-4" />, category: 'hydraulic' },
        { label: 'BEP Efficiency', value: specs.ManufacturerBEP_Efficiency || 84, unit: '%', icon: <Wind className="h-4 w-4" />, category: 'hydraulic' },
        { label: 'NPSH Required', value: specs.NPSHRequired || 4.5, unit: 'm', category: 'hydraulic' },
        { label: 'Impeller Diameter', value: specs.ImpellerDiameter || 450, unit: 'mm', category: 'hydraulic' },
        // Electrical
        { label: 'Design Power', value: specs.DesignPower || 150, unit: 'kW', icon: <Zap className="h-4 w-4" />, category: 'electrical' },
        { label: 'Motor Efficiency', value: specs.MotorEfficiency || 95.4, unit: '%', category: 'electrical' },
        { label: 'Rated Voltage', value: specs.RatedVoltage || 480, unit: 'V', category: 'electrical' },
        { label: 'Full Load Amps', value: specs.FullLoadAmps || 225, unit: 'A', category: 'electrical' },
        // Mechanical
        { label: 'Max RPM', value: specs.MaxRPM || 1180, unit: 'RPM', icon: <Gauge className="h-4 w-4" />, category: 'mechanical' },
        { label: 'Min RPM', value: specs.MinRPM || 600, unit: 'RPM', category: 'mechanical' },
    ] : [];

    const hydraulicSpecs = designSpecs.filter(s => s.category === 'hydraulic');
    const electricalSpecs = designSpecs.filter(s => s.category === 'electrical');
    const mechanicalSpecs = designSpecs.filter(s => s.category === 'mechanical');

    const triggerButton = variant === 'icon' ? (
        <button
            onClick={fetchSpecs}
            className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-zinc-400 hover:text-blue-500 dark:hover:text-cyan-400 ${className}`}
            title="View Design Specs"
        >
            <Info className="h-4 w-4" />
        </button>
    ) : variant === 'link' ? (
        <button
            onClick={fetchSpecs}
            className={`text-xs text-cyan-500 hover:text-cyan-400 underline underline-offset-2 ${className}`}
        >
            {loading ? 'Loading...' : 'View Specs'}
        </button>
    ) : (
        <Button
            variant="outline"
            size="sm"
            onClick={fetchSpecs}
            className={className}
            disabled={loading}
        >
            <Info className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Design Specs'}
        </Button>
    );

    // Dropdown mode - renders inline dropdown below button
    if (dropdownMode) {
        return (
            <div ref={containerRef} className="relative">
                {triggerButton}

                {isOpen && (
                    <div
                        className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{ zIndex: 9999 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
                            <div>
                                <h3 className="text-sm font-bold text-white">Design Specs</h3>
                                <p className="text-[10px] text-slate-400 font-mono">{pumpName}</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content - Compact */}
                        <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
                            {/* Hydraulic */}
                            <div>
                                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Droplets className="h-3 w-3" /> Hydraulic
                                </h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {hydraulicSpecs.map((spec) => (
                                        <div key={spec.label} className="p-1.5 rounded bg-slate-800/50 border border-slate-700/50">
                                            <p className="text-[9px] text-slate-500 uppercase">{spec.label}</p>
                                            <p className="font-mono text-xs text-white">
                                                {typeof spec.value === 'number' ? spec.value.toLocaleString() : spec.value}
                                                <span className="text-slate-500 text-[10px] ml-0.5">{spec.unit}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Electrical */}
                            <div>
                                <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Zap className="h-3 w-3" /> Electrical
                                </h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {electricalSpecs.map((spec) => (
                                        <div key={spec.label} className="p-1.5 rounded bg-slate-800/50 border border-slate-700/50">
                                            <p className="text-[9px] text-slate-500 uppercase">{spec.label}</p>
                                            <p className="font-mono text-xs text-white">
                                                {typeof spec.value === 'number' ? spec.value.toLocaleString() : spec.value}
                                                <span className="text-slate-500 text-[10px] ml-0.5">{spec.unit}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mechanical */}
                            <div>
                                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Gauge className="h-3 w-3" /> Mechanical
                                </h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {mechanicalSpecs.map((spec) => (
                                        <div key={spec.label} className="p-1.5 rounded bg-slate-800/50 border border-slate-700/50">
                                            <p className="text-[9px] text-slate-500 uppercase">{spec.label}</p>
                                            <p className="font-mono text-xs text-white">
                                                {typeof spec.value === 'number' ? spec.value.toLocaleString() : spec.value}
                                                <span className="text-slate-500 text-[10px] ml-0.5">{spec.unit}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Standard modal mode
    if (!isOpen) {
        return triggerButton;
    }

    return (
        <>
            {triggerButton}

            {/* Modal Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                style={{ zIndex: 99999 }}
                onClick={() => setIsOpen(false)}
            >
                {/* Modal Content */}
                <div
                    className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <div>
                            <h2 className="text-lg font-bold text-white">Design Specifications</h2>
                            <p className="text-xs text-slate-400 font-mono">{pumpName}</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                        {/* Hydraulic Section */}
                        <div>
                            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Droplets className="h-3 w-3" /> Hydraulic
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {hydraulicSpecs.map((spec) => (
                                    <div key={spec.label} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{spec.label}</p>
                                        <p className="font-mono text-sm text-white">
                                            {typeof spec.value === 'number' ? spec.value.toLocaleString() : spec.value}
                                            <span className="text-slate-500 text-xs ml-1">{spec.unit}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Electrical Section */}
                        <div>
                            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Zap className="h-3 w-3" /> Electrical
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {electricalSpecs.map((spec) => (
                                    <div key={spec.label} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{spec.label}</p>
                                        <p className="font-mono text-sm text-white">
                                            {typeof spec.value === 'number' ? spec.value.toLocaleString() : spec.value}
                                            <span className="text-slate-500 text-xs ml-1">{spec.unit}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mechanical Section */}
                        <div>
                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Gauge className="h-3 w-3" /> Mechanical
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {mechanicalSpecs.map((spec) => (
                                    <div key={spec.label} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{spec.label}</p>
                                        <p className="font-mono text-sm text-white">
                                            {typeof spec.value === 'number' ? spec.value.toLocaleString() : spec.value}
                                            <span className="text-slate-500 text-xs ml-1">{spec.unit}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                        <p className="text-[10px] text-slate-500 text-center">
                            Manufacturer specifications at Best Efficiency Point (BEP)
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
