'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Building2,
  Factory,
  Layers,
  Box,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  MapPin,
  Calendar,
  Tag,
  Hash,
  Settings,
  Droplets,
  Gauge,
  Thermometer,
  Activity,
  Zap,
  FolderTree,
  Network,
  Server,
  GitBranch,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface AssetNode {
  id: string;
  name: string;
  displayName: string;
  type: string;
  parent: string;
  description: string;
  hierarchyLevel: string;
  simulate: boolean;
  properties: Record<string, unknown>;
  designSpecs: Record<string, number>;
  alarms: string[];
  children?: AssetNode[];
}

interface AssetsConfig {
  metadata: {
    version: string;
    description: string;
    lastModified: string;
    patterns: string[];
  };
  summary: {
    totalAssets: number;
    hierarchy: {
      plants: number;
      processes: number;
      systems: number;
      pumpStations: number;
    };
    assetsByType: Record<string, number>;
    simulatedAssets: number;
  };
  tree: AssetNode[];
  assets: AssetNode[];
  assetsByType: Record<string, Array<{ id: string; name: string; displayName: string; parent: string; hierarchyLevel: string; simulate: boolean }>>;
  assetsByLevel: Record<string, Array<{ id: string; name: string; type: string }>>;
  assetCount: number;
}

// Get icon for hierarchy level
function getHierarchyIcon(level: string, type: string) {
  if (type === 'Folder') {
    switch (level) {
      case 'Plant':
        return <Building2 className="h-5 w-5 text-indigo-500" />;
      case 'Process':
        return <Factory className="h-5 w-5 text-blue-500" />;
      case 'System':
        return <Layers className="h-5 w-5 text-cyan-500" />;
      case 'PumpStation':
        return <Server className="h-5 w-5 text-purple-500" />;
      default:
        return <FolderTree className="h-5 w-5 text-zinc-500" />;
    }
  }

  // Asset types
  switch (type) {
    case 'InfluentPumpType':
      return <Droplets className="h-5 w-5 text-blue-500" />;
    case 'PumpType':
      return <Gauge className="h-5 w-5 text-green-500" />;
    case 'ChamberType':
      return <Box className="h-5 w-5 text-amber-500" />;
    case 'SimulationConfigType':
      return <Settings className="h-5 w-5 text-zinc-500" />;
    default:
      return <Box className="h-5 w-5 text-zinc-400" />;
  }
}

// Get color for asset type
function getTypeColor(type: string): string {
  switch (type) {
    case 'InfluentPumpType':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'PumpType':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'ChamberType':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    case 'SimulationConfigType':
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
    case 'Folder':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  }
}

// Asset tree node component
function AssetTreeNode({
  node,
  level = 0,
  selectedId,
  onSelect,
  expandedIds,
  onToggle,
}: {
  node: AssetNode;
  level?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isFolder = node.type === 'Folder';

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors',
          isSelected
            ? 'bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
        )}
        style={{ marginLeft: level * 16 }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {getHierarchyIcon(node.hierarchyLevel, node.type)}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-medium truncate',
              isFolder && 'text-zinc-600 dark:text-zinc-400'
            )}>
              {node.displayName || node.name}
            </span>
            {node.simulate && (
              <Activity className="h-3 w-3 text-green-500" />
            )}
          </div>
        </div>

        <Badge variant="outline" className={cn('text-xs shrink-0', getTypeColor(node.type))}>
          {node.type === 'Folder' ? node.hierarchyLevel : node.type.replace('Type', '')}
        </Badge>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children!.map(child => (
            <AssetTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Browse path component
function BrowsePath({ asset, allAssets }: { asset: AssetNode; allAssets: AssetNode[] }) {
  const pathParts: AssetNode[] = [];
  let current = asset;

  // Build path from asset to root
  while (current) {
    pathParts.unshift(current);
    const parent = allAssets.find(a => a.id === current.parent);
    if (!parent) break;
    current = parent;
  }

  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto">
      <span className="text-zinc-400">Objects</span>
      {pathParts.map((node, i) => (
        <React.Fragment key={node.id}>
          <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
          <span className={cn(
            'shrink-0',
            i === pathParts.length - 1 ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'
          )}>
            {node.name}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// Design specs display
function DesignSpecsPanel({ specs }: { specs: Record<string, number> }) {
  const specGroups = {
    'Flow & Pressure': ['DesignFlow', 'DesignHead', 'NPSHRequired'],
    'Motor': ['DesignPower', 'MaxRPM', 'MinRPM', 'FullLoadAmps', 'RatedVoltage'],
    'Efficiency': ['ManufacturerBEP_Efficiency', 'MotorEfficiency'],
    'Physical': ['ImpellerDiameter'],
  };

  const units: Record<string, string> = {
    DesignFlow: 'm³/h',
    DesignHead: 'm',
    DesignPower: 'kW',
    MaxRPM: 'rpm',
    MinRPM: 'rpm',
    FullLoadAmps: 'A',
    RatedVoltage: 'V',
    ImpellerDiameter: 'mm',
    NPSHRequired: 'm',
    ManufacturerBEP_Efficiency: '%',
    MotorEfficiency: '%',
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(specGroups).map(([group, keys]) => {
        const groupSpecs = keys.filter(k => specs[k] !== undefined);
        if (groupSpecs.length === 0) return null;

        return (
          <div key={group}>
            <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2">{group}</h4>
            <div className="space-y-1">
              {groupSpecs.map(key => (
                <div key={key} className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {key.replace(/([A-Z])/g, ' $1').replace('BEP ', 'BEP ').trim()}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-medium">{specs[key]}</span>
                    <span className="text-xs text-zinc-400">{units[key]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AssetsPage() {
  const [config, setConfig] = useState<AssetsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'byType' | 'byLevel'>('tree');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${API_BASE}/api/config/assets-json`);
        if (!res.ok) throw new Error('Failed to load assets configuration');
        const data = await res.json();
        setConfig(data);

        // Expand all folders by default
        const folderIds = new Set<string>();
        data.assets.forEach((a: AssetNode) => {
          if (a.type === 'Folder') folderIds.add(a.id);
        });
        setExpandedIds(folderIds);

        // Auto-select first pump
        const firstPump = data.assets.find((a: AssetNode) =>
          a.type === 'InfluentPumpType' || a.type === 'PumpType'
        );
        if (firstPump) setSelectedId(firstPump.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-700 dark:text-red-400">{error || 'Failed to load configuration'}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedAsset = selectedId ? config.assets.find(a => a.id === selectedId) : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Asset Instances</h1>
        <p className="text-zinc-500 mt-1">
          Browse equipment hierarchy defined in <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">assets.json</code>
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config.summary.hierarchy.plants}</p>
                <p className="text-xs text-zinc-500">Plants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Factory className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config.summary.hierarchy.processes}</p>
                <p className="text-xs text-zinc-500">Processes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <Layers className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config.summary.hierarchy.systems}</p>
                <p className="text-xs text-zinc-500">Systems</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config.summary.hierarchy.pumpStations}</p>
                <p className="text-xs text-zinc-500">Pump Stations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config.summary.simulatedAssets}</p>
                <p className="text-xs text-zinc-500">Simulated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <Box className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config.summary.totalAssets}</p>
                <p className="text-xs text-zinc-500">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: 'tree', label: 'Hierarchy Tree', icon: GitBranch },
          { id: 'byType', label: 'By Type', icon: Layers },
          { id: 'byLevel', label: 'By Level', icon: Network },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as typeof viewMode)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              viewMode === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tree View */}
      {viewMode === 'tree' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Tree Navigation */}
          <div className="col-span-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  Asset Hierarchy
                </CardTitle>
                <CardDescription>
                  OPC-UA address space structure (Objects folder)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[600px] overflow-y-auto">
                {config.tree.map(node => (
                  <AssetTreeNode
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    expandedIds={expandedIds}
                    onToggle={toggleExpanded}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Understanding OPC-UA Assets */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  OPC-UA Address Space
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3">
                <p>
                  <strong>Assets</strong> are instances created from ObjectTypes.
                  Each pump instance has all the components defined in its type (PumpType or InfluentPumpType).
                </p>
                <p>
                  <strong>Hierarchy Levels:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Plant</strong> - Physical facility (e.g., AWWTF)</li>
                  <li><strong>Process</strong> - Treatment stage (e.g., Primary, Secondary)</li>
                  <li><strong>System</strong> - Functional group (e.g., Influent Pumping)</li>
                  <li><strong>Asset</strong> - Individual equipment (e.g., Pump 1)</li>
                </ul>
                <p>
                  <strong>Browse Path</strong> shows the node&apos;s location:
                  <code className="block mt-1 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    Objects/RC_RockCreek/P0041/S00630/IPS_PMP_001
                  </code>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Asset Details */}
          <div className="col-span-7">
            {selectedAsset ? (
              <div className="space-y-4">
                {/* Asset Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-3">
                          {getHierarchyIcon(selectedAsset.hierarchyLevel, selectedAsset.type)}
                          {selectedAsset.displayName}
                          {selectedAsset.simulate && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              Simulated
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {selectedAsset.description}
                        </CardDescription>
                      </div>
                      <Badge className={getTypeColor(selectedAsset.type)}>
                        {selectedAsset.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Browse Path */}
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <div className="text-xs text-zinc-500 mb-1 uppercase font-medium">Browse Path</div>
                      <BrowsePath asset={selectedAsset} allAssets={config.assets} />
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-500">Node ID:</span>
                        <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{selectedAsset.id}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-500">Name:</span>
                        <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{selectedAsset.name}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Properties */}
                {Object.keys(selectedAsset.properties).length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hash className="h-5 w-5 text-zinc-500" />
                        Properties
                      </CardTitle>
                      <CardDescription>
                        Asset metadata and identification
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedAsset.properties).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                            {key === 'Location' && <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />}
                            {key === 'InstallationDate' && <Calendar className="h-4 w-4 text-zinc-400 mt-0.5" />}
                            {key === 'Manufacturer' && <Factory className="h-4 w-4 text-zinc-400 mt-0.5" />}
                            {!['Location', 'InstallationDate', 'Manufacturer'].includes(key) && (
                              <Tag className="h-4 w-4 text-zinc-400 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-zinc-500">{key}</div>
                              <div className="font-medium truncate">
                                {key === 'InstallationDate'
                                  ? new Date(value as string).toLocaleDateString()
                                  : String(value)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Design Specs */}
                {Object.keys(selectedAsset.designSpecs).length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-500" />
                        Design Specifications
                      </CardTitle>
                      <CardDescription>
                        Manufacturer nameplate data and design point
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DesignSpecsPanel specs={selectedAsset.designSpecs} />
                    </CardContent>
                  </Card>
                )}

                {/* Alarms */}
                {selectedAsset.alarms && selectedAsset.alarms.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Configured Alarms
                      </CardTitle>
                      <CardDescription>
                        Limit alarms configured for this asset
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedAsset.alarms.map(alarm => (
                          <Badge
                            key={alarm}
                            variant="outline"
                            className="text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-800"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {alarm}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center text-zinc-500">
                  <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an asset from the tree to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* By Type View */}
      {viewMode === 'byType' && (
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(config.assetsByType).map(([type, assets]) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getHierarchyIcon('', type)}
                  {type}
                  <Badge variant="secondary">{assets.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assets.map(asset => (
                    <div
                      key={asset.id}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                        selectedId === asset.id
                          ? 'bg-blue-50 dark:bg-blue-950'
                          : 'bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      )}
                      onClick={() => {
                        setSelectedId(asset.id);
                        setViewMode('tree');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.displayName || asset.name}</span>
                        {asset.simulate && <Activity className="h-3 w-3 text-green-500" />}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {asset.hierarchyLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* By Level View */}
      {viewMode === 'byLevel' && (
        <div className="grid grid-cols-3 gap-6">
          {['Plant', 'Process', 'System', 'PumpStation', 'Asset', 'Other'].map(level => {
            const assets = config.assetsByLevel[level];
            if (!assets || assets.length === 0) return null;

            return (
              <Card key={level}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {level === 'Plant' && <Building2 className="h-5 w-5 text-indigo-500" />}
                    {level === 'Process' && <Factory className="h-5 w-5 text-blue-500" />}
                    {level === 'System' && <Layers className="h-5 w-5 text-cyan-500" />}
                    {level === 'PumpStation' && <Server className="h-5 w-5 text-purple-500" />}
                    {level === 'Asset' && <Box className="h-5 w-5 text-green-500" />}
                    {level === 'Other' && <Box className="h-5 w-5 text-zinc-500" />}
                    {level}
                    <Badge variant="secondary">{assets.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {assets.map(asset => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => {
                          setSelectedId(asset.id);
                          setViewMode('tree');
                        }}
                      >
                        <span className="text-sm">{asset.name}</span>
                        <Badge variant="outline" className={cn('text-xs', getTypeColor(asset.type))}>
                          {asset.type.replace('Type', '')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
