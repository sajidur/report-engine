import React, { useState } from 'react';
import { 
  Globe, 
  Send, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Database, 
  RefreshCw, 
  Key, 
  Code, 
  Plus, 
  X,
  Layers,
  FileCode2,
  Table,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { ReportDataSource, ReportElement } from '../../types/report';

interface ApiEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDataSource: (dataSource: ReportDataSource) => void;
  activeDataSource?: ReportDataSource;
}

const PRESET_ENDPOINTS = [
  {
    name: 'E-Commerce Orders API (GET)',
    url: '/api/sample/ecommerce-orders',
    method: 'GET' as const,
    description: '100 live customer orders with revenue, net profit, discounts, and regional distribution',
    jsonPath: 'data',
  },
  {
    name: 'Financial Ledger & GL Accounts (GET)',
    url: '/api/sample/financial-ledger',
    method: 'GET' as const,
    description: 'Corporate ledger accounts with Q1-Q4 actuals, budget variance, and debit/credit journals',
    jsonPath: 'data',
  },
  {
    name: 'Inventory & Warehouse Stock (GET)',
    url: '/api/sample/inventory-items',
    method: 'GET' as const,
    description: 'Real-time SKU balances, reorder thresholds, warehouse locations, and stock valuation',
    jsonPath: 'data',
  },
  {
    name: 'OPTIONS API Catalog Introspection',
    url: '/api/sample/options-catalog',
    method: 'OPTIONS' as const,
    description: 'Introspect allowed HTTP verbs, schema definitions, and OpenAPI documentation endpoints',
    jsonPath: '.',
  },
];

export const ApiEndpointModal: React.FC<ApiEndpointModalProps> = ({
  isOpen,
  onClose,
  onApplyDataSource,
  activeDataSource,
}) => {
  const [url, setUrl] = useState(
    activeDataSource?.endpointUrl || '/api/sample/ecommerce-orders'
  );
  const [method, setMethod] = useState<'GET' | 'POST' | 'OPTIONS' | 'PUT'>(
    (activeDataSource?.httpMethod as any) || 'GET'
  );
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'apiKey'>('none');
  const [authToken, setAuthToken] = useState('');
  const [apiKeyName, setApiKeyName] = useState('X-API-Key');
  const [jsonPath, setJsonPath] = useState(activeDataSource?.jsonPath || 'data');
  const [requestHeaders, setRequestHeaders] = useState<string>('{\n  "Accept": "application/json"\n}');
  const [requestBody, setRequestBody] = useState<string>('{\n  "query": "*"\n}');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [inferredFields, setInferredFields] = useState<Array<{ name: string; type: string; sample: any }>>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestEndpoint = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    setInferredFields([]);
    setSuccessMessage(null);

    try {
      let parsedHeaders: Record<string, string> = {};
      try {
        if (requestHeaders.trim()) {
          parsedHeaders = JSON.parse(requestHeaders);
        }
      } catch (e) {
        throw new Error('Invalid JSON formatting in Custom Headers');
      }

      if (authType === 'bearer' && authToken) {
        parsedHeaders['Authorization'] = `Bearer ${authToken}`;
      } else if (authType === 'apiKey' && authToken) {
        parsedHeaders[apiKeyName] = authToken;
      }

      let parsedBody: any = undefined;
      if ((method === 'POST' || method === 'PUT') && requestBody.trim()) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e) {
          throw new Error('Invalid JSON in Request Body');
        }
      }

      const res = await fetch('/api/datasource/fetch-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method,
          headers: parsedHeaders,
          body: parsedBody,
          jsonPath,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status === 'error') {
        throw new Error(json.message || `HTTP ${res.status} Error fetching endpoint`);
      }

      setTestResult(json);

      // Extract rows
      let records: any[] = [];
      if (Array.isArray(json.data)) {
        records = json.data;
      } else if (json.data && typeof json.data === 'object') {
        // If data is single object or catalog map
        if (Array.isArray(json.data.endpoints)) {
          records = json.data.endpoints;
        } else {
          records = [json.data];
        }
      }

      // Infer fields from sample record
      if (records.length > 0) {
        const sample = records[0];
        const fields = Object.keys(sample).map((key) => {
          const val = sample[key];
          let type = 'string';
          if (typeof val === 'number') {
            type = key.toLowerCase().includes('revenue') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')
              ? 'currency'
              : 'number';
          } else if (typeof val === 'boolean') {
            type = 'boolean';
          } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            type = 'date';
          }
          return { name: key, type, sample: val };
        });
        setInferredFields(fields);
      }

      setSuccessMessage(`Endpoint responded successfully! Discovered ${records.length} records & ${Object.keys(records[0] || {}).length} schema fields.`);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to endpoint');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToReport = () => {
    if (!testResult) return;

    let records: any[] = [];
    if (Array.isArray(testResult.data)) {
      records = testResult.data;
    } else if (testResult.data?.endpoints) {
      records = testResult.data.endpoints;
    } else if (typeof testResult.data === 'object') {
      records = [testResult.data];
    }

    const dataSourceName = url.split('/').pop() || 'REST Endpoint';
    const newDs: ReportDataSource = {
      id: `ds-api-${Date.now()}`,
      name: `API: ${dataSourceName}`,
      type: 'rest',
      endpointUrl: url,
      httpMethod: method,
      jsonPath,
      data: records,
      fields: inferredFields.map((f) => ({
        name: f.name,
        type: (f.type as any) || 'string',
        displayName: f.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    };

    onApplyDataSource(newDs);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100 select-none">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>REST & OPTIONS API Data Source Options</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Visual Designer Option
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect any live HTTP REST or OPTIONS endpoint directly to your Crystal Report design
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Presets & Options Catalog</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_ENDPOINTS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUrl(preset.url);
                    setMethod(preset.method);
                    setJsonPath(preset.jsonPath);
                    setError(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    url === preset.url && method === preset.method
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200 text-[11px]">{preset.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      preset.method === 'OPTIONS' ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}>
                      {preset.method}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint URL & Method */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <label className="text-[11px] font-semibold text-slate-300">Endpoint URL & HTTP Method</label>
            <div className="flex gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold focus:ring-1 focus:ring-cyan-500 outline-hidden"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="OPTIONS">OPTIONS</option>
                <option value="PUT">PUT</option>
              </select>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/data or /api/sample/ecommerce-orders"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-hidden"
              />

              <button
                onClick={handleTestEndpoint}
                disabled={isLoading || !url.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isLoading ? 'Testing...' : 'Test Endpoint'}</span>
              </button>
            </div>
          </div>

          {/* JSON Path & Auth Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* JSON Path */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>JSON Extraction Path</span>
                <span className="text-[10px] text-slate-500">e.g. data, items, or . (root)</span>
              </label>
              <input
                type="text"
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                placeholder="data"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-hidden"
              />
            </div>

            {/* Auth Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Authentication Mode</label>
              <div className="flex gap-2">
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:ring-1 focus:ring-cyan-500 outline-hidden"
                >
                  <option value="none">No Auth (Public)</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apiKey">API Key Header</option>
                </select>
                {authType !== 'none' && (
                  <input
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="Enter token or key..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-cyan-500 outline-hidden"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Status / Errors */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <div className="font-bold">Connection Failed</div>
                <div className="text-[11px] text-red-400">{error}</div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <div className="font-bold">Connected & Inferred</div>
                <div className="text-[11px] text-emerald-400">{successMessage}</div>
              </div>
            </div>
          )}

          {/* Inferred Schema Fields Grid */}
          {inferredFields.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Discovered Schema Fields ({inferredFields.length})
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Ready to bind to visual design</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                {inferredFields.map((f, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="truncate">
                      <div className="font-mono text-[11px] text-slate-200 truncate">{f.name}</div>
                      <div className="text-[9px] text-slate-500 capitalize">{f.type}</div>
                    </div>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 shrink-0">
                      {f.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyToReport}
            disabled={!testResult || inferredFields.length === 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply API to Visual Report & Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
