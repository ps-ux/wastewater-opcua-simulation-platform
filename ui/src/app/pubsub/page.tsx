"use client";

import { useEffect, useState } from 'react';
import { usePubSubStore } from '@/stores/pubsub-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import {
    Radio,
    Database,
    Server,
    Cloud,
    Activity,
    ShieldCheck,
    Clock,
    BarChart3,
    Search,
    Trash2,
    CheckCircle2,
    XCircle,
    Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function PubSubPage() {
    const { latestMessagesByTopic, topics, subscriptions, clearMessages, toggleSubscription } = usePubSubStore();
    const [lastSync, setLastSync] = useState<string>('');
    const { isConnected } = usePumpWebSocket(); // This establishes the WebSocket connection
    const [performanceData, setPerformanceData] = useState<Array<{ time: number; latency: number; throughput: number }>>([]);

    // Update last sync time on client
    useEffect(() => {
        setLastSync(new Date().toLocaleTimeString());
        const syncInterval = setInterval(() => {
            setLastSync(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(syncInterval);
    }, []);

    // Update performance metrics
    useEffect(() => {
        const interval = setInterval(() => {
            setPerformanceData(prev => {
                const newData = [...prev, {
                    time: prev.length,
                    latency: 10 + Math.random() * 15,
                    throughput: 400 + Math.random() * 200
                }].slice(-20);
                return newData;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Get subscribed topics data
    const subscribedTopicsData = Object.entries(latestMessagesByTopic)
        .filter(([topic]) => subscriptions.includes(topic) || subscriptions.includes('#'))
        .map(([topic, message]) => ({ topic, message }));

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
            <style jsx global>{`
        .glass-panel {
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
        .code-font {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <Radio className="text-orange-500 animate-pulse" size={32} />
                        Enterprise Pub/Sub Analytics
                    </h1>
                    <p className="text-gray-400 mt-1">MQTT Broker - Real-time Telemetry Monitoring</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? 'Broker Connected' : 'Broker Disconnected'}
                    </div>
                    <button
                        onClick={clearMessages}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Clear Data"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* Left column: Topology & Charts */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

                    {/* Architecture Visualization */}
                    <section className="glass-panel p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <ShieldCheck className="text-blue-500" size={20} />
                                Network Topology: Semantic Fan-out
                            </h2>
                            <span className="text-xs text-blue-400 code-font">PROTOCOL: MQTT v5.0</span>
                        </div>

                        <div className="relative h-64 flex items-center justify-between px-10">
                            {/* OPC UA Server Node */}
                            <div className="flex flex-col items-center gap-3 relative z-10">
                                <div className="w-20 h-20 glass-panel flex items-center justify-center border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                    <Server className="text-blue-500" size={40} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Simulation Engine</span>
                                <span className="text-[10px] text-gray-500 code-font">OPC-UA Source</span>
                            </div>

                            {/* Data Flow Line */}
                            <div className="flex-1 px-4 relative">
                                <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 to-orange-500 opacity-30" />
                                <div className="absolute top-1/2 left-0 w-3 h-3 bg-blue-500 rounded-full -translate-y-1/2 blur-[2px] animate-pulse" />
                            </div>

                            {/* MQTT Broker Node */}
                            <div className="flex flex-col items-center gap-3 relative z-10">
                                <div className="w-24 h-24 glass-panel flex items-center justify-center border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.3)] bg-orange-500/5">
                                    <Cloud className="text-orange-500" size={48} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Central Broker</span>
                                <span className="text-[10px] text-gray-500 code-font">127.0.0.1:1883</span>
                            </div>

                            {/* Data Flow Path (Multi) */}
                            <div className="flex-1 relative flex flex-col justify-between h-40 py-4 ml-4">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="relative w-full">
                                        <div className="h-[1px] w-full bg-gradient-to-r from-orange-500 to-green-500 opacity-20" />
                                        <div
                                            className="absolute top-1/2 left-0 w-2 h-2 bg-orange-400 rounded-full -translate-y-1/2 blur-[1px] animate-pulse"
                                            style={{ animationDelay: `${i * 0.4}s` }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Subscribers */}
                            <div className="flex flex-col gap-6">
                                {[
                                    { icon: <Activity size={20} />, label: 'Analytics' },
                                    { icon: <Database size={20} />, label: 'Historian' },
                                    { icon: <Zap size={20} />, label: 'Dashboard' }
                                ].map((sub, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-10 h-10 glass-panel flex items-center justify-center border-green-500/30 text-green-500">
                                            {sub.icon}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">{sub.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Real-time Analytics Charts */}
                    <div className="grid grid-cols-2 gap-6">
                        <section className="glass-panel p-6">
                            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                                <Activity size={16} className="text-purple-500" />
                                Message Latency (ms)
                            </h3>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="latentGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="time" hide />
                                        <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ background: '#111', border: '1px solid #333' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Area type="monotone" dataKey="latency" stroke="#a855f7" fillOpacity={1} fill="url(#latentGrad)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="glass-panel p-6">
                            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                                <BarChart3 size={16} className="text-cyan-500" />
                                Throughput (msgs/sec)
                            </h3>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="time" hide />
                                        <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ background: '#111', border: '1px solid #333' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Area type="monotone" dataKey="throughput" stroke="#06b6d4" fillOpacity={1} fill="url(#tpGrad)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'Active Subscriptions', value: subscriptions.length, color: 'text-orange-500' },
                            { label: 'Available Topics', value: topics.length, color: 'text-blue-500' },
                            { label: 'Avg Latency', value: '12ms', color: 'text-green-500' },
                            { label: 'QoS Level', value: 'QoS 1', color: 'text-purple-500' }
                        ].map((stat, i) => (
                            <div key={i} className="glass-panel p-4 text-center">
                                <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Live Data Table */}
                    <section className="glass-panel flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/2">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Database size={16} className="text-green-400" />
                                Live Data Monitor - Subscribed Topics
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-green-500 code-font">STREAMING</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {subscribedTopicsData.length === 0 ? (
                                <div className="p-12 text-center text-gray-600">
                                    <Radio className="mx-auto mb-4 opacity-50" size={48} />
                                    <p className="text-sm">No active subscriptions</p>
                                    <p className="text-xs mt-2">Subscribe to topics from the panel on the right to see live data</p>
                                </div>
                            ) : (
                                <table className="w-full code-font text-xs">
                                    <thead className="bg-white/5 sticky top-0">
                                        <tr>
                                            <th className="text-left p-3 font-bold text-gray-400 uppercase tracking-wider">Topic</th>
                                            <th className="text-left p-3 font-bold text-gray-400 uppercase tracking-wider">Metric</th>
                                            <th className="text-right p-3 font-bold text-gray-400 uppercase tracking-wider">Value</th>
                                            <th className="text-right p-3 font-bold text-gray-400 uppercase tracking-wider">Last Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscribedTopicsData.map(({ topic, message }) => {
                                            const payload = message.payload;
                                            const rows: Array<{ key: string; value: any }> = [];

                                            // Flatten nested payload
                                            Object.entries(payload).forEach(([key, val]) => {
                                                if (typeof val === 'object' && val !== null) {
                                                    Object.entries(val).forEach(([subKey, subVal]) => {
                                                        rows.push({ key: `${key}.${subKey}`, value: subVal });
                                                    });
                                                } else {
                                                    rows.push({ key, value: val });
                                                }
                                            });

                                            return rows.map((row, idx) => (
                                                <tr key={`${topic}-${row.key}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    {idx === 0 && (
                                                        <td rowSpan={rows.length} className="p-3 align-top border-r border-white/10">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${topic.includes('telemetry') ? 'bg-orange-500' : 'bg-blue-500'} animate-pulse`} />
                                                                <span className={topic.includes('telemetry') ? 'text-orange-400' : 'text-blue-400'}>{topic}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="p-3 text-gray-400">{row.key}</td>
                                                    <td className="p-3 text-right font-mono text-white">
                                                        {typeof row.value === 'number' ? row.value.toFixed(2) : String(row.value)}
                                                    </td>
                                                    {idx === 0 && (
                                                        <td rowSpan={rows.length} className="p-3 text-right text-gray-500 align-top border-l border-white/10">
                                                            {new Date(message.timestamp).toLocaleTimeString()}
                                                        </td>
                                                    )}
                                                </tr>
                                            ));
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right column: Topic Subscription Panel */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* Topic Navigator */}
                    <section className="glass-panel p-4 flex flex-col gap-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Search size={16} className="text-orange-400" />
                            Topic Subscription Manager
                        </h3>
                        <p className="text-xs text-gray-500">Click to subscribe/unsubscribe to topics</p>
                        <div className="space-y-1 max-h-[600px] overflow-y-auto">
                            {topics.length === 0 ? (
                                <div className="text-center py-8 text-gray-600 text-xs">
                                    <Clock className="mx-auto mb-2 opacity-50" size={32} />
                                    <p>Waiting for topics...</p>
                                </div>
                            ) : (
                                topics.map(topic => {
                                    const isSubscribed = subscriptions.includes(topic);
                                    return (
                                        <button
                                            key={topic}
                                            onClick={() => toggleSubscription(topic)}
                                            className={`w-full text-left px-3 py-2.5 rounded-md transition-all text-xs code-font flex justify-between items-center group ${isSubscribed ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
                                        >
                                            <span className="truncate mr-2 flex items-center gap-2">
                                                {isSubscribed ? (
                                                    <CheckCircle2 size={14} className="text-green-500" />
                                                ) : (
                                                    <XCircle size={14} className="text-gray-600" />
                                                )}
                                                {topic}
                                            </span>
                                            {isSubscribed ? (
                                                <Badge className="text-[8px] bg-blue-500">Active</Badge>
                                            ) : (
                                                <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">Click to subscribe</span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* Subscription Info */}
                    <section className="glass-panel p-4">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Activity size={16} className="text-purple-400" />
                            Subscription Status
                        </h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Active Subscriptions:</span>
                                <span className="text-white font-bold">{subscriptions.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Available Topics:</span>
                                <span className="text-white font-bold">{topics.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Connection:</span>
                                <span className={isConnected ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

            </div>

            {/* Footer Info */}
            <footer className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>Last Sync: {lastSync || 'Loading...'}</span>
                    </div>
                </div>
                <div className="uppercase tracking-widest opacity-50">
                    Wastewater Distributed Intelligence Platform v1.2.0
                </div>
            </footer>
        </div>
    );
}
