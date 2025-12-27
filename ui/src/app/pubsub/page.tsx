"use client";

import { useEffect, useState, useRef } from 'react';
import { usePubSubStore, PubSubMessage } from '@/stores/pubsub-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import {
    Radio,
    Database,
    Server,
    Cloud,
    ArrowRight,
    MessageSquare,
    Activity,
    ShieldCheck,
    Clock,
    Terminal,
    BarChart3,
    Search,
    Filter,
    Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function PubSubPage() {
    const { messages, topics, subscriptions, clearMessages, toggleSubscription } = usePubSubStore();
    const { isConnected } = usePumpWebSocket();
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [filterText, setFilterText] = useState('');
    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredMessages = messages.filter(msg => {
        const matchesTopic = selectedTopic ? msg.topic === selectedTopic : true;
        const matchesFilter = filterText ? JSON.stringify(msg.payload).toLowerCase().includes(filterText.toLowerCase()) : true;
        return matchesTopic && matchesFilter;
    });

    // Performance data simulation
    const performanceData = Array.from({ length: 20 }).map((_, i) => ({
        time: i,
        latency: 10 + Math.random() * 15,
        throughput: 400 + Math.random() * 200
    }));

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
            <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
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
                    <p className="text-gray-400 mt-1">Cross-Platform MQTT Broker Performance & Telemetry Stream</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? 'Broker Connected' : 'Broker Disconnected'}
                    </div>
                    <button
                        onClick={clearMessages}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Clear Stream"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* Left column: Network Flow Diagram */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

                    {/* Architecture Visualization */}
                    <section className="glass-panel p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <ShieldCheck className="text-blue-500" size={20} />
                                Network Topology: Semantic Fan-out
                            </h2>
                            <span className="text-xs text-blue-400 code-font">PROTOCOL: MQTT v5.0 (Binary over WS)</span>
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

                            {/* Data Flow Line 1 */}
                            <div className="flex-1 px-4 relative">
                                <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 to-orange-500 opacity-30" />
                                <div className="absolute top-1/2 left-0 w-3 h-3 bg-blue-500 rounded-full -translate-y-1/2 blur-[2px] animate-[dot-flow_2s_linear_infinite]" />
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
                                    { icon: <Terminal size={20} />, label: 'Enterprise HMI' }
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
                            { label: 'Total Messages', value: messages.length, color: 'text-white' },
                            { label: 'Active Topics', value: topics.length, color: 'text-orange-500' },
                            { label: 'Avg Latency', value: '1.2ms', color: 'text-green-500' },
                            { label: 'Drop Rate', value: '0.00%', color: 'text-blue-500' }
                        ].map((stat, i) => (
                            <div key={i} className="glass-panel p-4 text-center">
                                <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column: Message Stream */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* Topic Navigator */}
                    <section className="glass-panel p-4 flex flex-col gap-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Search size={16} className="text-orange-400" />
                            Topic Explorer
                        </h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => toggleSubscription('#')}
                                className={`w-full text-left px-3 py-2 rounded-md transition-all text-xs code-font flex justify-between items-center ${subscriptions.includes('#') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                <span># (Global Wildcard)</span>
                                {subscriptions.includes('#') && <Badge className="text-[8px] bg-orange-500">Live</Badge>}
                            </button>
                            {topics.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => toggleSubscription(topic)}
                                    className={`w-full text-left px-3 py-2 rounded-md transition-all text-xs code-font flex justify-between items-center group ${subscriptions.includes(topic) ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-white/5'}`}
                                >
                                    <span className="truncate mr-2">{topic}</span>
                                    {subscriptions.includes(topic) ? (
                                        <Badge className="text-[8px] bg-blue-500">Subscribed</Badge>
                                    ) : (
                                        <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">Subscribe</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Quick Filters */}
                    <section className="glass-panel p-4 flex flex-col gap-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Filter size={16} className="text-blue-400" />
                            Pre-defined Filters
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                            {['telemetry', 'maintenance', 'analytics'].map(term => (
                                <button
                                    key={term}
                                    onClick={() => setFilterText(term)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] uppercase tracking-wider text-gray-400"
                                >
                                    {term}
                                </button>
                            ))}
                            <button
                                onClick={() => setFilterText('')}
                                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] uppercase tracking-wider text-gray-200"
                            >
                                Reset
                            </button>
                        </div>
                    </section>

                    {/* Console Log */}
                    <section className="glass-panel flex-1 flex flex-col overflow-hidden min-h-[500px]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/2">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Terminal size={16} className="text-green-400" />
                                Inbound Message Terminal
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-green-500 code-font">LISTENING</span>
                            </div>
                        </div>

                        <div className="p-4 border-b border-white/10 bg-black/40">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                                <input
                                    type="text"
                                    placeholder="Filter payload..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-8 py-1.5 text-xs code-font focus:outline-none focus:border-orange-500/50"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 code-font text-xs">
                            {filteredMessages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-600 italic">
                                    Waiting for publication...
                                </div>
                            ) : (
                                filteredMessages.map((msg) => (
                                    <div key={msg.id} className={`group border-l-2 pl-3 py-1 transition-colors ${msg.topic.includes('telemetry') ? 'border-orange-500/30 hover:border-orange-500' : 'border-blue-500/30 hover:border-blue-500'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`${msg.topic.includes('telemetry') ? 'text-orange-400' : 'text-blue-400'} font-bold`}>{msg.topic}</span>
                                            <span className="text-gray-600 text-[10px]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded border border-white/5 text-gray-300 overflow-x-auto whitespace-pre">
                                            <div className="flex flex-col gap-1">
                                                {Object.entries(msg.payload).map(([key, val]) => (
                                                    <div key={key} className="flex gap-2">
                                                        <span className="text-zinc-500 font-bold uppercase text-[9px]">{key}:</span>
                                                        <span className="text-zinc-300">
                                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </section>
                </div>

            </div>

            {/* Footer Info */}
            <footer className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>Last Sync: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MessageSquare size={14} />
                        <span>Active Connections: 1 Client, 3 Subscribers</span>
                    </div>
                </div>
                <div className="uppercase tracking-widest opacity-50">
                    Wastewater Distributed Intelligence Platform v1.2.0
                </div>
            </footer>
        </div>
    );
}
