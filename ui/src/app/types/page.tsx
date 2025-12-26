'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Box,
  GitBranch,
  Database,
  Settings,
  Zap,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  Layers,
  Hash,
  Type,
  ArrowRight,
  Clock,
  Gauge,
  Thermometer,
  Activity,
  Play,
  Square,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface TypeComponent {
  name: string;
  type: string;
  dataType: string | null;
  description: string;
  modellingRule: string;
  accessLevel: string;
  engineeringUnits?: string;
  euRange?: { low: number; high: number };
  instrumentRange?: { low: number; high: number };
  trueState?: string;
  falseState?: string;
  nestedComponents?: Record<string, TypeComponent>;
}

interface TypeMethod {
  name: string;
  description: string;
  inputArguments: Array<{ name: string; dataType: string; description: string }>;
  outputArguments: Array<{ name: string; dataType: string; description: string }>;
}

interface TypeDefinition {
  name: string;
  base: string;
  isAbstract: boolean;
  description: string;
  properties: Record<string, TypeComponent>;
  components: Record<string, TypeComponent>;
  methods: Record<string, TypeMethod>;
}

interface EngineeringUnit {
  name: string;
  displayName: string;
  description: string;
  unitId: number;
}

interface DataType {
  name: string;
  type: string;
  description: string;
  fields?: Record<string, { dataType: string; description: string }>;
  values?: Record<string, number>;
}

interface AlarmType {
  name: string;
  type: string;
  description: string;
  severity: number;
  inputNode: string;
  highHighLimit?: number;
  highLimit?: number;
  lowLimit?: number;
  lowLowLimit?: number;
  message: string;
}

interface TypesConfig {
  namespaceUri: string;
  namespace: number;
  inheritance: Record<string, { name: string; base: string; isAbstract: boolean; description: string }>;
  types: Record<string, TypeDefinition>;
  engineeringUnits: Record<string, EngineeringUnit>;
  dataTypes: Record<string, DataType>;
  alarmTypes: Record<string, AlarmType>;
  summary: Record<string, unknown>;
}

// Component type icons
function getComponentIcon(type: string) {
  switch (type) {
    case 'AnalogItemType':
      return <Gauge className="h-4 w-4 text-blue-500" />;
    case 'TwoStateDiscreteType':
      return <Zap className="h-4 w-4 text-yellow-500" />;
    case 'Property':
      return <Hash className="h-4 w-4 text-zinc-500" />;
    case 'DataItemType':
      return <Database className="h-4 w-4 text-purple-500" />;
    case 'Object':
      return <Box className="h-4 w-4 text-green-500" />;
    case 'Method':
      return <Play className="h-4 w-4 text-orange-500" />;
    default:
      return <Type className="h-4 w-4 text-zinc-400" />;
  }
}

// Type hierarchy node component
function TypeNode({
  typeDef,
  allTypes,
  level = 0,
  isSelected,
  onSelect
}: {
  typeDef: TypeDefinition;
  allTypes: Record<string, TypeDefinition>;
  level?: number;
  isSelected: boolean;
  onSelect: (name: string) => void;
}) {
  const childTypes = Object.values(allTypes).filter(t => t.base === typeDef.name);
  const [expanded, setExpanded] = useState(true);
  const hasChildren = childTypes.length > 0;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors',
          isSelected
            ? 'bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
        )}
        style={{ marginLeft: level * 20 }}
        onClick={() => onSelect(typeDef.name)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Box className={cn(
          'h-5 w-5',
          typeDef.isAbstract ? 'text-zinc-400' : 'text-blue-500'
        )} />
        <span className={cn(
          'font-medium',
          typeDef.isAbstract && 'italic text-zinc-500'
        )}>
          {typeDef.name}
        </span>
        {typeDef.isAbstract && (
          <Badge variant="outline" className="text-xs">abstract</Badge>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {childTypes.map(child => (
            <TypeNode
              key={child.name}
              typeDef={child}
              allTypes={allTypes}
              level={level + 1}
              isSelected={isSelected && child.name === typeDef.name}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Component details panel
function ComponentPanel({ component }: { component: TypeComponent }) {
  const [expanded, setExpanded] = useState(false);
  const hasNested = component.nestedComponents && Object.keys(component.nestedComponents).length > 0;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 cursor-pointer',
          hasNested && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
        )}
        onClick={() => hasNested && setExpanded(!expanded)}
      >
        {hasNested && (
          expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
        {getComponentIcon(component.type)}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-sm">{component.name}</span>
            <Badge variant="secondary" className="text-xs">{component.type}</Badge>
            {component.dataType && (
              <Badge variant="outline" className="text-xs font-mono">{component.dataType}</Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{component.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {component.engineeringUnits && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
              {component.engineeringUnits}
            </Badge>
          )}
          {component.euRange && (
            <span className="text-xs text-zinc-500">
              [{component.euRange.low} - {component.euRange.high}]
            </span>
          )}
          {component.trueState && component.falseState && (
            <span className="text-xs text-zinc-500">
              {component.trueState} / {component.falseState}
            </span>
          )}
        </div>
      </div>
      {expanded && hasNested && (
        <div className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          {Object.values(component.nestedComponents!).map(nc => (
            <div key={nc.name} className="flex items-center gap-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded">
              {getComponentIcon(nc.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{nc.name}</span>
                  {nc.dataType && (
                    <Badge variant="outline" className="text-xs font-mono">{nc.dataType}</Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{nc.description}</p>
              </div>
              {nc.engineeringUnits && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                  {nc.engineeringUnits}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Method panel
function MethodPanel({ method }: { method: TypeMethod }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-950">
        <Play className="h-4 w-4 text-orange-500" />
        <div className="flex-1">
          <span className="font-mono font-medium text-sm">{method.name}()</span>
          <p className="text-xs text-zinc-500 mt-0.5">{method.description}</p>
        </div>
      </div>
      {(method.inputArguments.length > 0 || method.outputArguments.length > 0) && (
        <div className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
          {method.inputArguments.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-medium text-zinc-500 uppercase">Input Arguments</span>
              <div className="mt-1 space-y-1">
                {method.inputArguments.map((arg, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-3 w-3 text-blue-500" />
                    <span className="font-mono">{arg.name}</span>
                    <Badge variant="outline" className="text-xs font-mono">{arg.dataType}</Badge>
                    <span className="text-xs text-zinc-500">{arg.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {method.outputArguments.length > 0 && (
            <div>
              <span className="text-xs font-medium text-zinc-500 uppercase">Output Arguments</span>
              <div className="mt-1 space-y-1">
                {method.outputArguments.map((arg, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-3 w-3 text-green-500 rotate-180" />
                    <span className="font-mono">{arg.name}</span>
                    <Badge variant="outline" className="text-xs font-mono">{arg.dataType}</Badge>
                    <span className="text-xs text-zinc-500">{arg.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TypesPage() {
  const [config, setConfig] = useState<TypesConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'types' | 'dataTypes' | 'units' | 'alarms'>('types');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${API_BASE}/api/config/types-yaml`);
        if (!res.ok) throw new Error('Failed to load types configuration');
        const data = await res.json();
        setConfig(data);
        // Auto-select first non-abstract type
        const firstType = Object.values(data.types).find((t: unknown) => !(t as TypeDefinition).isAbstract) as TypeDefinition | undefined;
        if (firstType) setSelectedType(firstType.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

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

  const selectedTypeDef = selectedType ? config.types[selectedType] : null;

  // Find root types (those whose base is BaseObjectType)
  const rootTypes = Object.values(config.types).filter(t => t.base === 'BaseObjectType');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">OPC-UA Type Definitions</h1>
        <p className="text-zinc-500 mt-1">
          Explore the type hierarchy defined in <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">types.yaml</code>
        </p>
      </div>

      {/* Namespace info */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Namespace:</span>
              <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{config.namespaceUri}</code>
            </div>
            <Badge variant="secondary">Index: {config.namespace}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>{Object.keys(config.types).length} Types</span>
            <span>|</span>
            <span>{Object.keys(config.dataTypes).length} Data Types</span>
            <span>|</span>
            <span>{Object.keys(config.alarmTypes).length} Alarms</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: 'types', label: 'Object Types', icon: Box },
          { id: 'dataTypes', label: 'Data Types', icon: Database },
          { id: 'units', label: 'Engineering Units', icon: Gauge },
          { id: 'alarms', label: 'Alarm Types', icon: AlertTriangle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Object Types Tab */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Type Hierarchy */}
          <div className="col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Type Hierarchy
                </CardTitle>
                <CardDescription>
                  OPC-UA ObjectType inheritance tree
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {/* Show BaseObjectType as root */}
                <div className="flex items-center gap-2 px-3 py-2 text-zinc-400">
                  <Box className="h-5 w-5" />
                  <span className="italic">BaseObjectType</span>
                  <Badge variant="outline" className="text-xs">OPC-UA</Badge>
                </div>
                {rootTypes.map(typeDef => (
                  <TypeNode
                    key={typeDef.name}
                    typeDef={typeDef}
                    allTypes={config.types}
                    level={1}
                    isSelected={selectedType === typeDef.name}
                    onSelect={setSelectedType}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Inheritance explanation */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Understanding OPC-UA Types
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3">
                <p>
                  <strong>ObjectTypes</strong> are like classes in OOP - they define the structure
                  (properties, components, methods) that instances will have.
                </p>
                <p>
                  <strong>Inheritance</strong> allows specialized types to extend base types.
                  For example, <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">InfluentPumpType</code> extends
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">PumpType</code> with wet well level.
                </p>
                <p>
                  <strong>Abstract types</strong> (italic) cannot be instantiated directly -
                  they serve as base classes for other types.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Type Details */}
          <div className="col-span-8">
            {selectedTypeDef ? (
              <div className="space-y-4">
                {/* Type Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-3">
                          <Box className={cn(
                            'h-6 w-6',
                            selectedTypeDef.isAbstract ? 'text-zinc-400' : 'text-blue-500'
                          )} />
                          {selectedTypeDef.name}
                          {selectedTypeDef.isAbstract && (
                            <Badge variant="outline">abstract</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {selectedTypeDef.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-zinc-500">
                          Extends: <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {selectedTypeDef.base}
                          </code>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-zinc-500" />
                        <span>{Object.keys(selectedTypeDef.properties).length} Properties</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-blue-500" />
                        <span>{Object.keys(selectedTypeDef.components).length} Components</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-orange-500" />
                        <span>{Object.keys(selectedTypeDef.methods).length} Methods</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Properties */}
                {Object.keys(selectedTypeDef.properties).length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hash className="h-5 w-5 text-zinc-500" />
                        Properties
                      </CardTitle>
                      <CardDescription>
                        Metadata and configuration values for this type
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.values(selectedTypeDef.properties).map(prop => (
                        <div key={prop.name} className="flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                          <Hash className="h-4 w-4 text-zinc-500" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{prop.name}</span>
                              {prop.dataType && (
                                <Badge variant="outline" className="text-xs font-mono">{prop.dataType}</Badge>
                              )}
                              <Badge
                                variant={prop.modellingRule === 'Mandatory' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {prop.modellingRule}
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-500">{prop.description}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Components */}
                {Object.keys(selectedTypeDef.components).length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-500" />
                        Components
                      </CardTitle>
                      <CardDescription>
                        Data points, sensors, and nested objects
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.values(selectedTypeDef.components).map(comp => (
                        <ComponentPanel key={comp.name} component={comp} />
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Methods */}
                {Object.keys(selectedTypeDef.methods).length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Play className="h-5 w-5 text-orange-500" />
                        Methods
                      </CardTitle>
                      <CardDescription>
                        Callable operations on instances of this type
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.values(selectedTypeDef.methods).map(method => (
                        <MethodPanel key={method.name} method={method} />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center text-zinc-500">
                  <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a type from the hierarchy to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Data Types Tab */}
      {activeTab === 'dataTypes' && (
        <div className="grid grid-cols-2 gap-6">
          {Object.values(config.dataTypes).map(dt => (
            <Card key={dt.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {dt.type === 'Enumeration' ? (
                    <Hash className="h-5 w-5 text-purple-500" />
                  ) : (
                    <Database className="h-5 w-5 text-blue-500" />
                  )}
                  {dt.name}
                  <Badge variant="secondary">{dt.type}</Badge>
                </CardTitle>
                <CardDescription>{dt.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {dt.type === 'Enumeration' && dt.values && (
                  <div className="space-y-1">
                    {Object.entries(dt.values).map(([name, value]) => (
                      <div key={name} className="flex items-center gap-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded">
                        <Badge variant="outline" className="font-mono">{value}</Badge>
                        <span className="font-mono text-sm">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {dt.type === 'Structure' && dt.fields && (
                  <div className="space-y-1">
                    {Object.entries(dt.fields).map(([name, field]) => (
                      <div key={name} className="flex items-center gap-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded">
                        <span className="font-mono text-sm flex-1">{name}</span>
                        <Badge variant="outline" className="font-mono text-xs">{field.dataType}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Engineering Units Tab */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-3 gap-4">
          {Object.values(config.engineeringUnits).map(unit => (
            <Card key={unit.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{unit.name}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{unit.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-lg font-medium">
                      {unit.displayName}
                    </Badge>
                    <p className="text-xs text-zinc-400 mt-1">UNECE: {unit.unitId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Alarm Types Tab */}
      {activeTab === 'alarms' && (
        <div className="grid grid-cols-2 gap-6">
          {Object.values(config.alarmTypes).map(alarm => (
            <Card key={alarm.name} className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {alarm.name}
                </CardTitle>
                <CardDescription>{alarm.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-500">Input Node:</span>
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{alarm.inputNode}</code>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-500">Severity:</span>
                    <Badge
                      variant={alarm.severity >= 800 ? 'destructive' : alarm.severity >= 500 ? 'warning' : 'secondary'}
                    >
                      {alarm.severity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {alarm.highHighLimit !== undefined && alarm.highHighLimit !== null && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-red-50 dark:bg-red-950 rounded">
                        <span className="text-red-600 dark:text-red-400">HH:</span>
                        <span className="font-mono">{alarm.highHighLimit}</span>
                      </div>
                    )}
                    {alarm.highLimit !== undefined && alarm.highLimit !== null && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-orange-50 dark:bg-orange-950 rounded">
                        <span className="text-orange-600 dark:text-orange-400">H:</span>
                        <span className="font-mono">{alarm.highLimit}</span>
                      </div>
                    )}
                    {alarm.lowLimit !== undefined && alarm.lowLimit !== null && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-950 rounded">
                        <span className="text-yellow-600 dark:text-yellow-400">L:</span>
                        <span className="font-mono">{alarm.lowLimit}</span>
                      </div>
                    )}
                    {alarm.lowLowLimit !== undefined && alarm.lowLowLimit !== null && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-950 rounded">
                        <span className="text-blue-600 dark:text-blue-400">LL:</span>
                        <span className="font-mono">{alarm.lowLowLimit}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                    &ldquo;{alarm.message}&rdquo;
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
