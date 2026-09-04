import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Server, 
  Cpu, 
  Terminal, 
  FileJson, 
  ExternalLink, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  Sliders, 
  Key, 
  Braces,
  Share2,
  FileCode2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { ReportTemplate, ReportDataSource } from '../../types/report';
import { resolveElementDataSource } from '../../services/dataSourceCatalog';

interface ExternalAppIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ReportTemplate;
  dataset: Record<string, any>[];
  parameters: Record<string, any>;
}

type IntegrationMode = 'endpoint' | 'injected' | 'headless' | 'iframe';
type LanguageTarget = 'react' | 'nodejs' | 'python' | 'curl' | 'dotnet' | 'html';

export const ExternalAppIntegrationModal: React.FC<ExternalAppIntegrationModalProps> = ({
  isOpen,
  onClose,
  template,
  dataset,
  parameters,
}) => {
  // Configurable dynamic properties for the external application
  const [baseUrl, setBaseUrl] = useState<string>('https://api.mycompany.com');
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>(
    template.dataSources[0]?.id || ''
  );
  const [integrationMode, setIntegrationMode] = useState<IntegrationMode>('endpoint');
  const [activeLang, setActiveLang] = useState<LanguageTarget>('react');
  const [authType, setAuthType] = useState<'bearer' | 'apiKey' | 'none'>('bearer');
  const [bearerToken, setBearerToken] = useState<string>('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  const [apiKeyHeader, setApiKeyHeader] = useState<string>('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState<string>('ent_live_983bc7190f84');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'schema' | 'architecture'>('code');

  const activeDataSource = useMemo(() => {
    return template.dataSources.find((d) => d.id === selectedDataSourceId) || template.dataSources[0];
  }, [template, selectedDataSourceId]);

  const endpointPath = useMemo(() => {
    if (activeDataSource?.endpointUrl && activeDataSource.endpointUrl.startsWith('/')) {
      return activeDataSource.endpointUrl;
    }
    return `/api/reports/${template.id}/data`;
  }, [activeDataSource, template.id]);

  const jsonPath = activeDataSource?.jsonPath || 'data';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Build clean Base URL
  const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '') || 'https://api.mycompany.com';
  const fullEndpointUrl = `${cleanBaseUrl}${endpointPath}`;

  // Generate Sample Expected JSON Schema Payload
  const sampleRecords = (activeDataSource?.data || dataset).slice(0, 3);
  const samplePayloadJson = useMemo(() => {
    if (jsonPath === '.' || !jsonPath) {
      return JSON.stringify(sampleRecords, null, 2);
    }
    return JSON.stringify(
      {
        status: 'success',
        [jsonPath]: sampleRecords,
        total: sampleRecords.length,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }, [sampleRecords, jsonPath]);

  // Code Generation based on configuration and active language
  const generatedCode = useMemo(() => {
    const authHeaderJs = authType === 'bearer' 
      ? `'Authorization': 'Bearer ${bearerToken}'` 
      : authType === 'apiKey' 
        ? `'${apiKeyHeader}': '${apiKeyValue}'`
        : null;

    if (activeLang === 'react') {
      if (integrationMode === 'endpoint') {
        return `// ============================================================================
// React Component: Dynamic API Endpoint Integration with Custom Base URL
// Package: @crystal-engine/react
// Template: ${template.name}
// ============================================================================

import React, { useState, useEffect } from 'react';
import { ReportViewer, useReportEngine } from '@crystal-engine/react';
import '@crystal-engine/react/dist/index.css';

// 1. Import or dynamically fetch your report template definition (.rpt.json)
import reportTemplate from './reports/${template.id}.rpt.json';

export interface ReportContainerProps {
  /**
   * Override base URL for different environments (e.g. Staging, Production, or multi-tenant)
   * Default: ${cleanBaseUrl}
   */
  apiBaseUrl?: string;
  authToken?: string;
  regionFilter?: string;
}

export const EnterpriseReportView: React.FC<ReportContainerProps> = ({
  apiBaseUrl = '${cleanBaseUrl}',
  authToken = '${authType === 'bearer' ? bearerToken : ''}',
  regionFilter = 'All',
}) => {
  // Construct dynamic endpoint URL using the provided Base URL
  const endpoint = \`\${apiBaseUrl}${endpointPath}\`;

  // Dynamic report engine hook: automatically queries your API, handles parameters & auth
  const { data, loading, error, refresh, exportPdf } = useReportEngine({
    template: reportTemplate,
    endpoint,
    headers: {
      ${authHeaderJs ? `${authHeaderJs},` : '// Add your session or JWT credentials here'}
      'Accept': 'application/json',
    },
    parameters: {
      Region: regionFilter,
    },
    jsonPath: '${jsonPath}', // extracts records from API envelope
  });

  return (
    <div className="report-wrapper p-6 bg-slate-900 min-h-screen text-slate-100 flex flex-col gap-4">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between bg-slate-800 border border-slate-700 p-4 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white">${template.name}</h2>
          <p className="text-xs text-slate-400 font-mono">Connected to: {endpoint}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition"
          >
            Refresh Data
          </button>
          <button
            onClick={() => exportPdf({ watermark: 'CONFIDENTIAL' })}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white transition shadow-sm"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Embedded Crystal Report Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl">
        <ReportViewer
          template={reportTemplate}
          data={data}
          parameters={{ Region: regionFilter }}
          loading={loading}
          error={error}
          theme="light"
          showPagination={true}
        />
      </div>
    </div>
  );
};

export default EnterpriseReportView;
`;
      } else if (integrationMode === 'injected') {
        return `// ============================================================================
// React Component: Direct In-Memory / State Injection (No extra HTTP call)
// You supply your existing state, ORM results, or Redux/TanStack Query records directly!
// ============================================================================

import React from 'react';
import { ReportViewer } from '@crystal-engine/react';
import '@crystal-engine/react/dist/index.css';
import reportTemplate from './reports/${template.id}.rpt.json';

export interface InjectedReportProps {
  /**
   * Pass your local dataset array directly from your state or parent component
   */
  records: Array<{
${(activeDataSource?.fields || []).slice(0, 6).map((f) => `    ${f.name}: ${f.type === 'number' || f.type === 'currency' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'};`).join('\n')}
  }>;
  onExport?: () => void;
}

export const DirectInjectedReport: React.FC<InjectedReportProps> = ({ records }) => {
  return (
    <div className="w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <ReportViewer
        template={reportTemplate}
        data={records}
        parameters={{ Region: 'All' }}
        theme="light"
        showPagination={true}
      />
    </div>
  );
};

export default DirectInjectedReport;
`;
      } else if (integrationMode === 'headless') {
        return `// ============================================================================
// React / Next.js: Request Server-Side Compiled PDF from Reporting API
// ============================================================================

export async function downloadReportPdf(options = { region: 'All' }) {
  const response = await fetch('${cleanBaseUrl}/api/reports/${template.id}/render-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ${authHeaderJs ? `${authHeaderJs},` : ''}
    },
    body: JSON.stringify({
      parameters: { Region: options.region },
      watermark: 'CONFIDENTIAL',
      orientation: '${template.pageSettings.orientation}',
    }),
  });

  if (!response.ok) {
    throw new Error('PDF compilation failed');
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = \`${template.id}-\${Date.now()}.pdf\`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
`;
      } else {
        // Iframe
        return `// ============================================================================
// React Iframe Embed with Dynamic Base URL & Query Parameters
// ============================================================================

import React from 'react';

export const IframeReportEmbed = () => {
  const embedUrl = new URL('${cleanBaseUrl}/view/${template.id}');
  embedUrl.searchParams.set('baseUrl', '${cleanBaseUrl}');
  ${authType === 'bearer' ? `embedUrl.searchParams.set('token', '${bearerToken.slice(0, 15)}...');` : ''}
  embedUrl.searchParams.set('theme', 'light');

  return (
    <div className="w-full h-[850px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <iframe
        src={embedUrl.toString()}
        title="${template.name}"
        className="w-full h-full border-0"
        allow="clipboard-write"
      />
    </div>
  );
};
`;
      }
    }

    if (activeLang === 'nodejs') {
      return `// ============================================================================
// Node.js / Express Service: Dynamic Base URL & Headless PDF Generation
// Package: @crystal-engine/node
// ============================================================================

const express = require('express');
const axios = require('axios');
const { CrystalReportEngine } = require('@crystal-engine/node');
const reportTemplate = require('./reports/${template.id}.rpt.json');

const app = express();
app.use(express.json());

const reportEngine = new CrystalReportEngine();

// Environment-aware Base URL (Configurable via ENV or request header)
const DEFAULT_API_BASE_URL = process.env.API_BASE_URL || '${cleanBaseUrl}';

/**
 * GET /api/generate-report
 * Fetches data from configured Base URL API, runs report calculations, and streams PDF.
 */
app.get('/api/generate-report', async (req, res) => {
  try {
    // 1. Allow caller to override Base URL or use default
    const apiBaseUrl = req.headers['x-api-base-url'] || DEFAULT_API_BASE_URL;
    const region = req.query.region || 'All';

    // 2. Fetch live JSON data from external API endpoint
    const endpoint = \`\${apiBaseUrl}${endpointPath}\`;
    console.log(\`Fetching report data from: \${endpoint}\`);

    const apiResponse = await axios.get(endpoint, {
      headers: {
        ${authHeaderJs ? `${authHeaderJs},` : ''}
        'Accept': 'application/json',
      },
      params: { Region: region },
    });

    // 3. Extract records array from envelope (e.g. data or root)
    const records = apiResponse.data['${jsonPath}'] || apiResponse.data;

    // 4. Render multi-page PDF using Crystal Engine
    const pdfBuffer = await reportEngine.renderToPdf({
      template: reportTemplate,
      dataset: records,
      parameters: { Region: region },
      options: {
        paperSize: '${template.pageSettings.size}',
        orientation: '${template.pageSettings.orientation}',
        watermark: req.query.draft ? 'DRAFT' : undefined,
      },
    });

    // 5. Send PDF stream directly to browser or caller
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', \`attachment; filename="${template.id}-\${Date.now()}.pdf"\`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Report generation error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(4000, () => {
  console.log('Report generation service running on port 4000');
});
`;
    }

    if (activeLang === 'python') {
      return `# ============================================================================
# Python / FastAPI: Dynamic Base URL Report Integration
# ============================================================================

import os
import requests
from fastapi import FastAPI, Response, Query
from typing import Optional

app = FastAPI(title="${template.name} Service")

# Configurable environment Base URL
API_BASE_URL = os.getenv("API_BASE_URL", "${cleanBaseUrl}")
REPORT_ID = "${template.id}"

@app.get("/reports/pdf")
def generate_report_pdf(
    region: str = Query("All"),
    base_url: Optional[str] = None
):
    """
    Fetches data using configurable base URL and generates PDF report.
    """
    target_base = base_url or API_BASE_URL
    endpoint = f"{target_base}${endpointPath}"

    # 1. Query external API data
    headers = {
        ${authType === 'bearer' ? `"Authorization": "Bearer ${bearerToken}",` : authType === 'apiKey' ? `"${apiKeyHeader}": "${apiKeyValue}",` : ''}
        "Accept": "application/json"
    }
    
    response = requests.get(endpoint, headers=headers, params={"Region": region})
    response.raise_for_status()
    payload = response.json()

    # 2. Extract records array from API JSON envelope
    records = payload.get("${jsonPath}", payload)

    # 3. Call Reporting Engine to render PDF
    reporting_service_url = f"{target_base}/api/reports/{REPORT_ID}/render-pdf"
    pdf_res = requests.post(
        reporting_service_url,
        json={
            "data": records,
            "parameters": {"Region": region},
            "watermark": "CONFIDENTIAL"
        },
        headers={"Content-Type": "application/json"}
    )
    
    return Response(
        content=pdf_res.content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={REPORT_ID}.pdf"}
    )
`;
    }

    if (activeLang === 'curl') {
      return `# ============================================================================
# cURL & REST API: Test Endpoint & Generate Report
# ============================================================================

# 1. Query Data from the API Endpoint using Base URL:
curl -X GET "${fullEndpointUrl}?Region=All" \\
  -H "Accept: application/json" \\
  ${authType === 'bearer' ? `-H "Authorization: Bearer ${bearerToken}" \\` : authType === 'apiKey' ? `-H "${apiKeyHeader}: ${apiKeyValue}" \\` : ''}

# ----------------------------------------------------------------------------
# 2. Render Server-Side PDF with custom parameters:
curl -X POST "${cleanBaseUrl}/api/reports/${template.id}/render-pdf" \\
  -H "Content-Type: application/json" \\
  ${authType === 'bearer' ? `-H "Authorization: Bearer ${bearerToken}" \\` : authType === 'apiKey' ? `-H "${apiKeyHeader}: ${apiKeyValue}" \\` : ''}
  -d '{
    "parameters": {
      "Region": "All",
      "FiscalQuarter": "Q1-2025"
    },
    "watermark": "CONFIDENTIAL",
    "orientation": "${template.pageSettings.orientation}"
  }' \\
  --output "${template.id}.pdf"
`;
    }

    if (activeLang === 'dotnet') {
      return `// ============================================================================
// C# / .NET 8 / 9: Service Layer with Configurable HttpClient BaseAddress
// ============================================================================

using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Enterprise.Reporting.Services
{
    public interface IExternalReportService
    {
        Task<byte[]> GenerateReportPdfAsync(string? customBaseUrl = null, string region = "All");
    }

    public class ExternalReportService : IExternalReportService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _defaultBaseUrl;

        public ExternalReportService(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _defaultBaseUrl = config["Reporting:ApiBaseUrl"] ?? "${cleanBaseUrl}";
        }

        public async Task<byte[]> GenerateReportPdfAsync(string? customBaseUrl = null, string region = "All")
        {
            var client = _httpClientFactory.CreateClient();
            var baseUrl = customBaseUrl ?? _defaultBaseUrl;
            
            // Set dynamic BaseAddress
            client.BaseAddress = new Uri(baseUrl);
            ${authType === 'bearer' ? `client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "${bearerToken}");` : ''}

            // 1. Query Data from endpoint
            var endpoint = "${endpointPath}?Region=" + Uri.EscapeDataString(region);
            var response = await client.GetAsync(endpoint);
            response.EnsureSuccessStatusCode();

            // 2. Request PDF from Render API
            var renderResponse = await client.PostAsJsonAsync("/api/reports/${template.id}/render-pdf", new
            {
                parameters = new { Region = region },
                watermark = "CONFIDENTIAL",
                orientation = "${template.pageSettings.orientation}"
            });
            renderResponse.EnsureSuccessStatusCode();

            return await renderResponse.Content.ReadAsByteArrayAsync();
        }
    }
}
`;
    }

    // Vanilla HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${template.name} - External App Integration</title>
  <!-- Load Crystal Report Web SDK -->
  <script src="${cleanBaseUrl}/sdk/crystal-report-bundle.js"></script>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #fff; padding: 24px; }
    #report-host { max-width: 1100px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
  </style>
</head>
<body>
  <h1>${template.name}</h1>
  <p>Connected to API Base URL: <code>${cleanBaseUrl}</code></p>

  <!-- Report Mount Container -->
  <div id="report-host"></div>

  <script>
    // Initialize Crystal Report Viewer with dynamic base URL & endpoint
    CrystalReport.mount({
      container: document.getElementById('report-host'),
      templateUrl: '${cleanBaseUrl}/api/reports/${template.id}',
      endpoint: '${fullEndpointUrl}',
      headers: {
        ${authHeaderJs ? `${authHeaderJs},` : ''}
      },
      parameters: { Region: 'All' },
      theme: 'light'
    });
  </script>
</body>
</html>
`;
  }, [
    activeLang, 
    integrationMode, 
    template, 
    cleanBaseUrl, 
    endpointPath, 
    jsonPath, 
    authType, 
    bearerToken, 
    apiKeyHeader, 
    apiKeyValue, 
    activeDataSource
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  External Application Integration & API Configuration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Dynamic Base URL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure how <span className="text-cyan-300 font-semibold">{template.name}</span> connects to your application's API endpoints, changes Base URLs across environments, or accepts direct data payloads.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadFile(JSON.stringify(template, null, 2), `${template.id}.rpt.json`, 'application/json')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Download report definition (.rpt.json)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>.rpt.json</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Controls: Interactive Environment Base URL & Configuration Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Base URL Input */}
            <div className="md:col-span-6 space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Application Base URL (Configurable)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Dev / Staging / Prod</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.mycompany.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
                {/* Quick Presets */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setBaseUrl('https://api.mycompany.com')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700"
                    title="Set to Production domain"
                  >
                    Prod
                  </button>
                  <button
                    onClick={() => setBaseUrl('https://staging-api.internal:8443')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700"
                    title="Set to Staging domain"
                  >
                    Stage
                  </button>
                  <button
                    onClick={() => setBaseUrl('http://localhost:5000')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700"
                    title="Set to Localhost"
                  >
                    Local
                  </button>
                </div>
              </div>
            </div>

            {/* Target Data Source Selector */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bound Data Source</span>
              </label>
              <select
                value={selectedDataSourceId}
                onChange={(e) => setSelectedDataSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500 truncate"
              >
                {template.dataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} ({ds.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Integration Pattern Selector */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Integration Pattern</span>
              </label>
              <select
                value={integrationMode}
                onChange={(e) => setIntegrationMode(e.target.value as IntegrationMode)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500"
              >
                <option value="endpoint">1. Dynamic API Endpoint (Base URL + Auth)</option>
                <option value="injected">2. Direct Injected Data (Props / State)</option>
                <option value="headless">3. Headless Server PDF API</option>
                <option value="iframe">4. Web Iframe Embed</option>
              </select>
            </div>
          </div>

          {/* Sub-bar: Auth Header Configuration */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-800/60 text-slate-400">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300">API Authentication:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setAuthType('bearer')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    authType === 'bearer' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bearer Token
                </button>
                <button
                  onClick={() => setAuthType('apiKey')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    authType === 'apiKey' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  API Key Header
                </button>
                <button
                  onClick={() => setAuthType('none')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    authType === 'none' ? 'bg-slate-700 text-slate-200 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  None (Cookies / Open)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span>Resolved Endpoint:</span>
              <span className="text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-md">
                {fullEndpointUrl}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Code Examples vs Schema Specification vs Architecture) */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'code'
                  ? 'border-cyan-500 text-cyan-300 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Application Code Examples</span>
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'schema'
                  ? 'border-cyan-500 text-cyan-300 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Braces className="w-4 h-4" />
              <span>Expected API Response Format</span>
              <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono px-1.5 py-0.2 rounded">
                JSON
              </span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'architecture'
                  ? 'border-cyan-500 text-cyan-300 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Base URL & Multi-Environment Guide</span>
            </button>
          </div>

          {/* Quick Copy Active Block */}
          {activeTab === 'code' && (
            <div className="flex items-center gap-1.5">
              {(['react', 'nodejs', 'python', 'curl', 'dotnet', 'html'] as LanguageTarget[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                    activeLang === lang
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {lang === 'react' ? 'React / TS' : lang === 'nodejs' ? 'Node.js' : lang === 'python' ? 'Python' : lang === 'curl' ? 'cURL' : lang === 'dotnet' ? '.NET C#' : 'HTML'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/80">
          {/* TAB 1: CODE EXAMPLES */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>
                    Ready to copy into your <strong>{activeLang.toUpperCase()}</strong> codebase with Base URL:{' '}
                    <code className="text-cyan-300 font-mono">{cleanBaseUrl}</code>
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(generatedCode, 'active-code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs shadow-md transition"
                >
                  {copiedKey === 'active-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'active-code' ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto max-h-[460px] leading-relaxed">
                  {generatedCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: EXPECTED API RESPONSE FORMAT */}
          {activeTab === 'schema' && (
            <div className="space-y-5">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>How Report Field Binding Works with Your API JSON</span>
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  When your application calls an API or supplies records directly, the report engine inspects each item in the array and binds values to elements matching their field keys.
                  If your API wraps the array in an envelope like <code>{`{ data: [...] }`}</code>, set <code>jsonPath: "{jsonPath}"</code>.
                </p>
              </div>

              {/* Schema Fields Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Fields Required / Expected by {activeDataSource.name}:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeDataSource.fields.length} Fields Defined
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {activeDataSource.fields.map((field) => (
                    <div
                      key={field.name}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono text-cyan-300 font-semibold text-[11px]">{field.name}</div>
                        <div className="text-[10px] text-slate-400">{field.displayName || field.name}</div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {field.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Sample JSON Response */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    Sample HTTP Response Payload from: {endpointPath}
                  </span>
                  <button
                    onClick={() => handleCopy(samplePayloadJson, 'sample-json')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'sample-json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-64">
                  {samplePayloadJson}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE & BASE URL BEST PRACTICES */}
          {activeTab === 'architecture' && (
            <div className="space-y-5 text-xs text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pattern A */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Globe className="w-4 h-4" />
                    <span>Pattern 1: Dynamic Base URL Configuration</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Most enterprise apps use environment variables (e.g. <code>VITE_API_URL</code> or <code>process.env.API_BASE_URL</code>).
                    Pass this variable as <code>apiBaseUrl</code> into <code>&lt;ReportViewer /&gt;</code> or your backend service.
                  </p>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
                    &lt;ReportViewer<br />
                    &nbsp;&nbsp;template={'{reportTemplate}'}<br />
                    &nbsp;&nbsp;endpoint={`\`\${process.env.REACT_APP_API_URL}/api/reports/${template.id}\`}`}<br />
                    &nbsp;&nbsp;headers={`{{ Authorization: \`Bearer \${token}\` }}`}<br />
                    /&gt;
                  </div>
                </div>

                {/* Pattern B */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Layers className="w-4 h-4" />
                    <span>Pattern 2: Injected Props Data (Zero HTTP Call)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    If your application already fetched the data using Prisma, GraphQL, TypeORM, or Redux, simply pass the array into <code>data={'{myOrders}'}</code>.
                    The report will render instantly without duplicate network requests.
                  </p>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-purple-300">
                    &lt;ReportViewer<br />
                    &nbsp;&nbsp;template={'{reportTemplate}'}<br />
                    &nbsp;&nbsp;data={'{myStateOrders}'}<br />
                    &nbsp;&nbsp;parameters={`{{ Region: 'All' }}`}<br />
                    /&gt;
                  </div>
                </div>
              </div>

              {/* Multi-Tenant Base URL Explanation */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Multi-Tenant & Environment URL Switching</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  In SaaS applications where each client or tenant has a separate database or subdomain (e.g. <code>https://acme.api.yourcompany.com</code> vs <code>https://globex.api.yourcompany.com</code>), the report component dynamically resolves the endpoint by computing:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-emerald-300 text-xs">
                  const tenantBaseUrl = `https://\${currentTenant}.api.yourcompany.com`;<br />
                  const finalEndpoint = `\${tenantBaseUrl}${endpointPath}`;
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Report Template: <strong className="text-slate-200">{template.name}</strong> (v{template.version})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(generatedCode, 'footer-copy')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition"
            >
              {copiedKey === 'footer-copy' ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-md transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
