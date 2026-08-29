import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Server, 
  Cpu, 
  Database, 
  Layers, 
  Eye, 
  FileJson, 
  ExternalLink,
  ShieldCheck,
  Play
} from 'lucide-react';
import { ReportTemplate } from '../../types/report';
import { SdkCodeGenerator } from '../../services/sdkCodeGenerators';
import { ReportViewer } from '../viewer/ReportViewer';

interface SdkHubProps {
  template: ReportTemplate;
  dataset: Record<string, any>[];
  parameters: Record<string, any>;
  onUpdateTemplateJson: (updated: ReportTemplate) => void;
}

type SdkTab = 'interactive' | 'react' | 'node' | 'dotnet' | 'mysql' | 'schema';

export const SdkHub: React.FC<SdkHubProps> = ({
  template,
  dataset,
  parameters,
  onUpdateTemplateJson,
}) => {
  const [activeTab, setActiveTab] = useState<SdkTab>('interactive');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [embedTheme, setEmbedTheme] = useState<'dark' | 'light'>('light');
  const [jsonText, setJsonText] = useState(JSON.stringify(template, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync json text when template changes
  React.useEffect(() => {
    setJsonText(JSON.stringify(template, null, 2));
  }, [template]);

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
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

  const reactCode = SdkCodeGenerator.generateReactCode(template);
  const nodeCode = SdkCodeGenerator.generateNodeJsCode(template);
  const dotnetCode = SdkCodeGenerator.generateCSharpNetCode(template);
  const appSettings = SdkCodeGenerator.generateAppSettingsJson();
  const mysqlDdl = SdkCodeGenerator.generateMySqlDdl();

  return (
    <div className="flex-1 bg-slate-950 flex flex-col min-w-0 overflow-y-auto select-none">
      {/* SDK Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded">
                Developer Integration Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Template ID: <span className="text-slate-200">{template.id}</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              <span>Crystal Report SDK & Ecosystem Architecture</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Design once in this report engine studio, export the <code className="text-cyan-300 font-mono">.rpt.json</code> design file, and embed seamlessly across React web apps, Node.js microservices, and C# .NET Web API backends connected to MySQL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadFile(JSON.stringify(template, null, 2), `${template.id}.rpt.json`, 'application/json')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .rpt.json</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
          <button
            id="tab-sdk-interactive"
            onClick={() => setActiveTab('interactive')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'interactive'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Interactive Embed Sandbox</span>
          </button>

          <button
            id="tab-sdk-react"
            onClick={() => setActiveTab('react')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'react'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>React Client SDK</span>
          </button>

          <button
            id="tab-sdk-node"
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'node'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Node.js / Express Service</span>
          </button>

          <button
            id="tab-sdk-dotnet"
            onClick={() => setActiveTab('dotnet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'dotnet'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>.NET Web API & Dapper</span>
          </button>

          <button
            id="tab-sdk-mysql"
            onClick={() => setActiveTab('mysql')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'mysql'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>MySQL Schema DDL</span>
          </button>

          <button
            id="tab-sdk-schema"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'schema'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileJson className="w-3.5 h-3.5 text-blue-400" />
            <span>.rpt.json Schema Inspector</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 max-w-6xl mx-auto w-full flex-1">
        {/* 1. INTERACTIVE EMBED SANDBOX */}
        {activeTab === 'interactive' && (
          <div className="space-y-6">
            {/* Host App Mock Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Host App Simulation: <span className="text-cyan-300">https://internal-portal.acme.com/analytics</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Embed Theme:</span>
                  <select
                    value={embedTheme}
                    onChange={(e) => setEmbedTheme(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300"
                  >
                    <option value="light">Light Paper</option>
                    <option value="dark">Dark Theme</option>
                  </select>
                </div>
              </div>

              {/* Code Snippet of what developers write */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 flex items-center justify-between overflow-x-auto">
                <code>
                  &lt;<span className="text-cyan-400">ReportViewer</span>{' '}
                  <span className="text-purple-300">template</span>={'{'}reportDesign{'}'}{' '}
                  <span className="text-purple-300">endpoint</span>="<span className="text-emerald-300">https://api.enterprise/reports/{template.id}</span>"{' '}
                  <span className="text-purple-300">theme</span>="<span className="text-amber-300">{embedTheme}</span>" /&gt;
                </code>
                <button
                  onClick={() => handleCopy(`<ReportViewer template={reportDesign} endpoint="https://api.enterprise/reports/${template.id}" theme="${embedTheme}" />`, 'snippet')}
                  className="text-slate-400 hover:text-slate-200 ml-4 flex items-center gap-1 text-[11px]"
                >
                  {copiedSection === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Live Rendered View Inside Host App */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <ReportViewer
                  template={template}
                  dataset={dataset}
                  parameters={parameters}
                  onUpdateParameter={() => {}}
                  liveStreaming={true}
                  onOpenExportModal={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. REACT SDK CODE */}
        {activeTab === 'react' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>NPM Package Installation</span>
                  </h3>
                  <p className="text-xs text-slate-400">Install the React client SDK in any Next.js, Vite, or Create React App</p>
                </div>
                <button
                  onClick={() => handleCopy('npm install @crystal-engine/react lucide-react recharts', 'npm-react')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedSection === 'npm-react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Install</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-cyan-300 border border-slate-800">
                npm install @crystal-engine/react lucide-react recharts
              </pre>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono">AnalyticsReportDashboard.tsx</span>
                <button
                  onClick={() => handleCopy(reactCode, 'code-react')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedSection === 'code-react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy TSX Code</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-[500px]">
                {reactCode}
              </pre>
            </div>
          </div>
        )}

        {/* 3. NODE.JS SDK CODE */}
        {activeTab === 'node' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Node.js Server Installation</span>
                  </h3>
                  <p className="text-xs text-slate-400">Headless PDF rendering and MySQL query proxy service</p>
                </div>
                <button
                  onClick={() => handleCopy('npm install @crystal-engine/node express mysql2', 'npm-node')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedSection === 'npm-node' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Install</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-emerald-300 border border-slate-800">
                npm install @crystal-engine/node express mysql2
              </pre>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono">server.js</span>
                <button
                  onClick={() => handleCopy(nodeCode, 'code-node')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedSection === 'code-node' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Node Code</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-[500px]">
                {nodeCode}
              </pre>
            </div>
          </div>
        )}

        {/* 4. .NET WEB API & C# ARCHITECTURE */}
        {activeTab === 'dotnet' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>.NET 8 / 9 Web API Package Dependencies</span>
                  </h3>
                  <p className="text-xs text-slate-400">C# Controller, Dapper MySQL data provider, and PDF Generator</p>
                </div>
                <button
                  onClick={() => handleCopy('dotnet add package Dapper\ndotnet add package MySqlConnector\ndotnet add package CrystalReport.Net', 'nuget')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedSection === 'nuget' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy NuGet</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-purple-300 border border-slate-800">
                dotnet add package Dapper{'\n'}dotnet add package MySqlConnector{'\n'}dotnet add package CrystalReport.Net
              </pre>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono">ReportsController.cs (C# Web API)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(dotnetCode, 'ReportsController.cs', 'text/plain')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download .cs</span>
                  </button>
                  <button
                    onClick={() => handleCopy(dotnetCode, 'code-dotnet')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                  >
                    {copiedSection === 'code-dotnet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy C# Code</span>
                  </button>
                </div>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-[500px]">
                {dotnetCode}
              </pre>
            </div>

            {/* appsettings.json */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono">appsettings.json (MySQL Connection)</span>
                <button
                  onClick={() => handleCopy(appSettings, 'code-appsettings')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedSection === 'code-appsettings' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Config</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
                {appSettings}
              </pre>
            </div>
          </div>
        )}

        {/* 5. MYSQL SCHEMA DDL */}
        {activeTab === 'mysql' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>MySQL Database DDL Schema</span>
                  </h3>
                  <p className="text-xs text-slate-400">Enterprise relational schema with indexes for high-throughput reporting</p>
                </div>
                <button
                  onClick={() => handleCopy(mysqlDdl, 'code-mysql')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedSection === 'code-mysql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy SQL Script</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-amber-300 border border-slate-800 overflow-x-auto max-h-[500px]">
                {mysqlDdl}
              </pre>
            </div>
          </div>
        )}

        {/* 6. RAW JSON SCHEMA INSPECTOR */}
        {activeTab === 'schema' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-blue-400" />
                    <span>Report Definition Specification (.rpt.json)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Directly inspect or edit the JSON report definition specification</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(jsonText);
                        onUpdateTemplateJson(parsed);
                        setJsonError(null);
                        alert('Report template updated from JSON!');
                      } catch (err: any) {
                        setJsonError(err.message);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-semibold text-white transition shadow-sm"
                  >
                    Apply JSON Changes
                  </button>
                  <button
                    onClick={() => handleCopy(jsonText, 'code-json')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                  >
                    {copiedSection === 'code-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
              </div>

              {jsonError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
                  {jsonError}
                </div>
              )}

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={22}
                className="w-full bg-slate-950 p-4 rounded-xl font-mono text-xs text-cyan-300 border border-slate-800 focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
