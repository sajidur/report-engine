import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Play, 
  Table, 
  CheckCircle2, 
  Clock, 
  Code2, 
  Layers, 
  Plus, 
  RefreshCw, 
  Sliders, 
  Info,
  Server,
  Globe,
  Send,
  Sparkles,
  Key,
  ShieldCheck,
  FileJson,
  ArrowRight,
  Check,
  Copy,
  AlertCircle,
  Hash,
  Type,
  DollarSign,
  Calendar,
  ToggleLeft,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ReportTemplate, ReportDataSource, DataSourceField } from '../../types/report';
import { MYSQL_SCHEMAS, executeMySqlQuery } from '../../services/mysqlMockData';
import { 
  ApiEndpointConfig, 
  ApiFetchResult, 
  ApiDataSourceService, 
  SAMPLE_API_PRESETS 
} from '../../services/apiDataSourceService';

interface DataSourceManagerProps {
  template: ReportTemplate;
  onUpdateDataSource: (updatedDs: ReportDataSource) => void;
  onNewTemplateFromEndpoint?: (newTemplate: ReportTemplate) => void;
  onNavigateView?: (view: 'designer' | 'preview' | 'templates' | 'sdk' | 'datasources' | 'export') => void;
  liveStreaming: boolean;
  onToggleLiveStream: () => void;
}

type TabMode = 'api_endpoint' | 'mysql_database';

export const DataSourceManager: React.FC<DataSourceManagerProps> = ({
  template,
  onUpdateDataSource,
  onNewTemplateFromEndpoint,
  onNavigateView,
  liveStreaming,
  onToggleLiveStream,
}) => {
  const activeDs = template.dataSources[0];

  // Tab mode
  const [activeTab, setActiveTab] = useState<TabMode>(activeDs?.type === 'rest' ? 'api_endpoint' : 'api_endpoint');

  // --- API Endpoint State ---
  const [apiConfig, setApiConfig] = useState<ApiEndpointConfig>({
    name: activeDs?.type === 'rest' ? activeDs.name : 'E-Commerce Sales & Orders API',
    url: activeDs?.endpoint || '/api/sample/ecommerce-orders',
    method: (activeDs?.parametersMap?.method as any) || 'GET',
    jsonPath: activeDs?.parametersMap?.jsonPath || 'data',
    headers: [
      { key: 'Accept', value: 'application/json', enabled: true },
      { key: 'X-Requested-With', value: 'CrystalReportEngine', enabled: true },
    ],
    body: '',
    authType: 'none',
    authToken: '',
    apiKeyName: 'X-API-KEY',
    apiKeyValue: '',
    apiKeyLocation: 'header',
  });

  const [apiSubTab, setApiSubTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [apiFetchResult, setApiFetchResult] = useState<ApiFetchResult | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiCopied, setApiCopied] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // --- MySQL State ---
  const [queryText, setQueryText] = useState(activeDs?.type === 'mysql' ? activeDs?.query || 'SELECT * FROM sales_transactions LIMIT 25;' : 'SELECT * FROM sales_transactions LIMIT 25;');
  const [selectedTable, setSelectedTable] = useState<string>('sales_transactions');
  const [queryResult, setQueryResult] = useState<any>(() => executeMySqlQuery(queryText));
  const [executing, setExecuting] = useState(false);

  // Auto-fetch API on initial mount
  useEffect(() => {
    handleFetchApi(apiConfig);
  }, []);

  const handleFetchApi = async (configToFetch: ApiEndpointConfig) => {
    setApiLoading(true);
    setAppliedSuccess(false);
    try {
      const res = await ApiDataSourceService.fetchEndpoint(configToFetch);
      setApiFetchResult(res);
    } catch (err: any) {
      setApiFetchResult({
        success: false,
        statusCode: 0,
        statusText: 'Network Error',
        latencyMs: 0,
        data: [],
        fields: [],
        rowCount: 0,
        error: err.message || 'Error executing request',
      });
    } finally {
      setApiLoading(false);
    }
  };

  const handleSelectPreset = (preset: ApiEndpointConfig) => {
    const updated: ApiEndpointConfig = {
      ...apiConfig,
      name: preset.name,
      url: preset.url,
      method: preset.method,
      jsonPath: preset.jsonPath || '.',
      headers: preset.headers || [{ key: 'Accept', value: 'application/json', enabled: true }],
      body: preset.body || '',
    };
    setApiConfig(updated);
    handleFetchApi(updated);
  };

  const handleApplyApiToActiveReport = () => {
    if (!apiFetchResult || !apiFetchResult.success) return;

    const updatedDataSource: ReportDataSource = {
      id: activeDs?.id || `ds-api-${Date.now()}`,
      name: apiConfig.name || 'API Endpoint Data Source',
      type: 'rest',
      endpoint: apiConfig.url,
      fields: apiFetchResult.fields,
      data: apiFetchResult.data,
      parametersMap: {
        method: apiConfig.method,
        jsonPath: apiConfig.jsonPath || '.',
      },
    };

    onUpdateDataSource(updatedDataSource);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  const handleGenerateReportFromEndpoint = () => {
    if (!apiFetchResult || !apiFetchResult.success) return;

    const newTemplate = ApiDataSourceService.createReportTemplateFromApi(apiConfig, apiFetchResult);
    if (onNewTemplateFromEndpoint) {
      onNewTemplateFromEndpoint(newTemplate);
    }
    if (onNavigateView) {
      onNavigateView('designer');
    }
  };

  const handleAddHeader = () => {
    setApiConfig({
      ...apiConfig,
      headers: [...(apiConfig.headers || []), { key: '', value: '', enabled: true }],
    });
  };

  const handleUpdateHeader = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const next = [...(apiConfig.headers || [])];
    next[index] = { ...next[index], [field]: val };
    setApiConfig({ ...apiConfig, headers: next });
  };

  const handleRemoveHeader = (index: number) => {
    const next = (apiConfig.headers || []).filter((_, i) => i !== index);
    setApiConfig({ ...apiConfig, headers: next });
  };

  // --- MySQL actions ---
  const handleRunQuery = () => {
    setExecuting(true);
    setTimeout(() => {
      const res = executeMySqlQuery(queryText);
      setQueryResult(res);
      setExecuting(false);

      if (activeDs) {
        onUpdateDataSource({
          ...activeDs,
          type: 'mysql',
          query: queryText,
          data: res.rows,
        });
      }
    }, 150);
  };

  const handleSelectTablePreset = (tableName: string) => {
    setSelectedTable(tableName);
    const newSql = `SELECT * FROM ${tableName} ORDER BY 1 DESC LIMIT 25;`;
    setQueryText(newSql);
    const res = executeMySqlQuery(newSql);
    setQueryResult(res);

    if (activeDs) {
      onUpdateDataSource({
        ...activeDs,
        type: 'mysql',
        query: newSql,
        data: res.rows,
      });
    }
  };

  const getFieldTypeIcon = (type: DataSourceField['type']) => {
    switch (type) {
      case 'currency':
        return <DollarSign className="w-3 h-3 text-emerald-400" />;
      case 'number':
        return <Hash className="w-3 h-3 text-cyan-400" />;
      case 'date':
        return <Calendar className="w-3 h-3 text-amber-400" />;
      case 'boolean':
        return <CheckCircle2 className="w-3 h-3 text-purple-400" />;
      default:
        return <Type className="w-3 h-3 text-slate-400" />;
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-cyan-950 text-cyan-400 border-cyan-500/40';
      case 'POST':
        return 'bg-emerald-950 text-emerald-400 border-emerald-500/40';
      case 'OPTIONS':
        return 'bg-purple-950 text-purple-300 border-purple-500/40';
      case 'PUT':
        return 'bg-amber-950 text-amber-400 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col min-w-0 overflow-y-auto select-none">
      {/* Header & Source Mode Switcher */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Universal Data Source Studio</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Active Report: <span className="text-slate-200 font-semibold">{template.name}</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Connect Any REST / Options API Endpoint or Database</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Connect external REST APIs, custom HTTP/OPTIONS endpoints, or MySQL databases to introspect schemas, parse nested JSON datasets, and auto-generate reports.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('api_endpoint')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'api_endpoint'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>REST & Options API</span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-cyan-700/50">
                Any Endpoint
              </span>
            </button>

            <button
              onClick={() => setActiveTab('mysql_database')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'mysql_database'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>MySQL Database</span>
              <span className="text-[9px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-mono">
                SQL
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="p-6 max-w-6xl mx-auto w-full flex-1 space-y-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: REST & OPTIONS API ENDPOINT AS DATA SOURCE                         */}
        {/* ========================================================================= */}
        {activeTab === 'api_endpoint' && (
          <div className="space-y-6">
            
            {/* 1. Quick Presets Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Instant Sample API Presets</span>
                </span>
                <span className="text-[11px] text-slate-400">Click any preset to test & inspect schema instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SAMPLE_API_PRESETS.map((preset) => {
                  const isCurrent = apiConfig.url === preset.url && apiConfig.method === preset.method;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                        isCurrent
                          ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getMethodBadgeClass(preset.method)}`}>
                            {preset.method}
                          </span>
                          <span className="text-xs font-semibold truncate text-slate-200">{preset.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{preset.url}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Endpoint Request Composer Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">API Endpoint Request Composer</h2>
                    <p className="text-[11px] text-slate-400">Configure URL, HTTP verbs (GET, POST, OPTIONS), headers, and JSON path</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-fetch-api-endpoint"
                    onClick={() => handleFetchApi(apiConfig)}
                    disabled={apiLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 active:scale-95 transition disabled:opacity-50"
                  >
                    {apiLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{apiLoading ? 'Testing Endpoint...' : 'Send Request & Introspect Schema'}</span>
                  </button>
                </div>
              </div>

              {/* Main URL Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                {/* Method selector */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">HTTP Method</label>
                  <select
                    value={apiConfig.method}
                    onChange={(e) => setApiConfig({ ...apiConfig, method: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="OPTIONS">OPTIONS</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>

                {/* URL Input */}
                <div className="md:col-span-7">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Endpoint URL (Absolute or Relative)</label>
                  <input
                    type="text"
                    value={apiConfig.url}
                    onChange={(e) => setApiConfig({ ...apiConfig, url: e.target.value })}
                    placeholder="https://api.example.com/v1/data or /api/sample/ecommerce-orders"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* JSON Array Extraction Path */}
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">JSON Array Path</label>
                  <input
                    type="text"
                    value={apiConfig.jsonPath || ''}
                    onChange={(e) => setApiConfig({ ...apiConfig, jsonPath: e.target.value })}
                    placeholder="e.g. data or items or ."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Subtabs for Request Details: Headers, Body, Auth */}
              <div className="pt-2">
                <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setApiSubTab('params')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      apiSubTab === 'params'
                        ? 'bg-slate-800 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Data Source Name & Options
                  </button>
                  <button
                    onClick={() => setApiSubTab('headers')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      apiSubTab === 'headers'
                        ? 'bg-slate-800 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Headers</span>
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded font-mono text-slate-300">
                      {apiConfig.headers?.filter((h) => h.enabled).length || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setApiSubTab('auth')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      apiSubTab === 'auth'
                        ? 'bg-slate-800 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Key className="w-3 h-3" />
                    <span>Auth & Keys</span>
                    {apiConfig.authType !== 'none' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    )}
                  </button>
                  {(apiConfig.method === 'POST' || apiConfig.method === 'PUT' || apiConfig.method === 'OPTIONS') && (
                    <button
                      onClick={() => setApiSubTab('body')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                        apiSubTab === 'body'
                          ? 'bg-slate-800 text-cyan-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Request Payload (Body)</span>
                    </button>
                  )}
                </div>

                {/* SubTab Content */}
                <div className="py-3">
                  {/* Tab 1: Name & Options */}
                  {apiSubTab === 'params' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Friendly Data Source Name</label>
                        <input
                          type="text"
                          value={apiConfig.name}
                          onChange={(e) => setApiConfig({ ...apiConfig, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5 text-xs text-slate-400">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>JSON Path <code className="text-amber-300 font-mono font-bold">"."</code> points to the root array; or specify property like <code className="text-amber-300 font-mono font-bold">"data"</code>, <code className="text-amber-300 font-mono font-bold">"items"</code>, or <code className="text-amber-300 font-mono font-bold">"products"</code>.</span>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Headers */}
                  {apiSubTab === 'headers' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400">Custom HTTP Request Headers</span>
                        <button
                          onClick={handleAddHeader}
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Header</span>
                        </button>
                      </div>

                      {(apiConfig.headers || []).map((header, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={header.enabled}
                            onChange={(e) => handleUpdateHeader(idx, 'enabled', e.target.checked)}
                            className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                          />
                          <input
                            type="text"
                            placeholder="Header Key (e.g. Authorization)"
                            value={header.key}
                            onChange={(e) => handleUpdateHeader(idx, 'key', e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                          />
                          <input
                            type="text"
                            placeholder="Header Value"
                            value={header.value}
                            onChange={(e) => handleUpdateHeader(idx, 'value', e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                          />
                          <button
                            onClick={() => handleRemoveHeader(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 3: Auth */}
                  {apiSubTab === 'auth' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        {(['none', 'bearer', 'apiKey'] as const).map((type) => (
                          <label key={type} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="authType"
                              checked={apiConfig.authType === type}
                              onChange={() => setApiConfig({ ...apiConfig, authType: type })}
                              className="text-cyan-500 bg-slate-950 border-slate-700"
                            />
                            <span className="capitalize">{type === 'apiKey' ? 'API Key' : type === 'bearer' ? 'Bearer Token' : 'No Auth'}</span>
                          </label>
                        ))}
                      </div>

                      {apiConfig.authType === 'bearer' && (
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Bearer Token / JWT</label>
                          <input
                            type="password"
                            value={apiConfig.authToken || ''}
                            onChange={(e) => setApiConfig({ ...apiConfig, authToken: e.target.value })}
                            placeholder="eyJhbGciOi..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300"
                          />
                        </div>
                      )}

                      {apiConfig.authType === 'apiKey' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Header Name</label>
                            <input
                              type="text"
                              value={apiConfig.apiKeyName || 'X-API-KEY'}
                              onChange={(e) => setApiConfig({ ...apiConfig, apiKeyName: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">API Key Secret</label>
                            <input
                              type="password"
                              value={apiConfig.apiKeyValue || ''}
                              onChange={(e) => setApiConfig({ ...apiConfig, apiKeyValue: e.target.value })}
                              placeholder="key_live_..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Body */}
                  {apiSubTab === 'body' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Raw JSON Payload</label>
                      <textarea
                        rows={4}
                        value={apiConfig.body || ''}
                        onChange={(e) => setApiConfig({ ...apiConfig, body: e.target.value })}
                        placeholder='{"query": "SELECT *", "limit": 50}'
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Introspection & Schema Results */}
            {apiFetchResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
                
                {/* Result Status Header HUD */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                      apiFetchResult.success
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                    }`}>
                      {apiFetchResult.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>HTTP {apiFetchResult.statusCode} {apiFetchResult.statusText}</span>
                    </div>

                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{apiFetchResult.latencyMs}ms</span>
                    </span>

                    <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {apiFetchResult.rowCount} Records Extracted
                    </span>

                    <span className="text-xs font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {apiFetchResult.fields.length} Schema Fields
                    </span>
                  </div>

                  {/* Action Buttons to connect/create report */}
                  {apiFetchResult.success && apiFetchResult.data.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-apply-active-report-ds"
                        onClick={handleApplyApiToActiveReport}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                          appliedSuccess
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                        }`}
                      >
                        {appliedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{appliedSuccess ? 'Applied to Active Report!' : 'Bind to Active Report'}</span>
                      </button>

                      <button
                        id="btn-generate-report-from-endpoint"
                        onClick={handleGenerateReportFromEndpoint}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20 active:scale-95 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Generate Report from this Endpoint</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Banner if any */}
                {!apiFetchResult.success && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Endpoint Request Failed</div>
                      <div className="font-mono text-[11px] text-rose-300 mt-1">{apiFetchResult.error}</div>
                    </div>
                  </div>
                )}

                {/* OPTIONS Schema Discovery Metadata */}
                {apiFetchResult.optionsAllowedMethods && apiFetchResult.optionsAllowedMethods.length > 0 && (
                  <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>OPTIONS Endpoint Capability Discovery</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-400">Allowed HTTP Methods:</span>
                      {apiFetchResult.optionsAllowedMethods.map((m) => (
                        <span key={m} className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getMethodBadgeClass(m)}`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discovered Schema Fields Grid */}
                {apiFetchResult.fields.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Auto-Inferred Schema Fields ({apiFetchResult.fields.length})</span>
                      </span>
                      <span className="text-[11px] text-slate-400">These fields are available in the visual designer and tables</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {apiFetchResult.fields.map((field) => (
                        <div
                          key={field.name}
                          className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-1 hover:border-cyan-500/40 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-200 truncate">{field.name}</span>
                            <span className="flex items-center gap-1 text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 font-mono">
                              {getFieldTypeIcon(field.type)}
                              <span>{field.type}</span>
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans truncate">{field.displayName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Data Records Table */}
                {apiFetchResult.data.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Table className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Extracted Records Preview ({apiFetchResult.rowCount} rows)</span>
                      </span>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-80 shadow-inner">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead className="bg-slate-950 sticky top-0 border-b border-slate-800">
                          <tr>
                            {apiFetchResult.fields.map((field) => (
                              <th key={field.name} className="p-2.5 text-cyan-400 font-semibold text-[11px] whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {getFieldTypeIcon(field.type)}
                                  <span>{field.name}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                          {apiFetchResult.data.slice(0, 50).map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-800/60 transition">
                              {apiFetchResult.fields.map((field) => {
                                const val = row[field.name];
                                return (
                                  <td key={field.name} className="p-2.5 text-slate-300 whitespace-nowrap text-[11px]">
                                    {field.type === 'currency' && typeof val === 'number'
                                      ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                      : typeof val === 'number'
                                      ? val.toLocaleString()
                                      : typeof val === 'boolean'
                                      ? val ? 'TRUE' : 'FALSE'
                                      : String(val ?? 'NULL')}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RELATIONAL MYSQL DATABASE                                          */}
        {/* ========================================================================= */}
        {activeTab === 'mysql_database' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column: Schema Tree Explorer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Database Tables</span>
                    <span className="text-[10px] text-amber-400 font-mono">InnoDB</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Click a table to inspect columns & load query</p>
                </div>
              </div>

              <div className="space-y-2">
                {MYSQL_SCHEMAS.map((table) => {
                  const isSelected = selectedTable === table.name;
                  return (
                    <div
                      key={table.name}
                      onClick={() => handleSelectTablePreset(table.name)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-mono text-xs font-bold mb-1">
                        <Table className="w-3.5 h-3.5 text-amber-400" />
                        <span>{table.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{table.comment}</p>
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                        {table.columns.slice(0, 4).map((col) => (
                          <div key={col.name} className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className={col.isPrimary ? 'text-cyan-400 font-bold' : ''}>
                              {col.name} {col.isPrimary && '★'}
                            </span>
                            <span className="text-slate-500">{col.type.split(' ')[0]}</span>
                          </div>
                        ))}
                        {table.columns.length > 4 && (
                          <div className="text-[9px] text-slate-500 italic">
                            +{table.columns.length - 4} more columns
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: SQL Editor & Results Grid */}
            <div className="lg:col-span-3 space-y-5">
              {/* SQL Editor Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      SQL Query Editor (Parameterized)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunQuery}
                      disabled={executing}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{executing ? 'Executing...' : 'Execute SQL'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-inner"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Supports parameter placeholders like <code className="text-cyan-300">@Region</code> and <code className="text-cyan-300">@StartDate</code></span>
                  </div>
                  {queryResult && (
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {queryResult.executionTimeMs}ms
                      </span>
                      <span className="text-slate-300">{queryResult.rowCount} rows fetched</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Grid Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Query Output Dataset
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Schema: {queryResult.columns.length} columns
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-slate-950 sticky top-0 border-b border-slate-800">
                      <tr>
                        {queryResult.columns.map((col: string) => (
                          <th key={col} className="p-2.5 text-cyan-400 font-semibold text-[11px] whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                      {queryResult.rows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-800/60 transition">
                          {queryResult.columns.map((col: string) => (
                            <td key={col} className="p-2.5 text-slate-300 whitespace-nowrap text-[11px]">
                              {typeof row[col] === 'number'
                                ? row[col].toLocaleString()
                                : String(row[col] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
