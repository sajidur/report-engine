import React from 'react';
import { 
  FileText, 
  Eye, 
  Code2, 
  Database, 
  Download, 
  Play, 
  Pause, 
  Share2, 
  Plus, 
  Check, 
  Sparkles,
  Layers,
  FileCode,
  Library,
  Undo2,
  Redo2,
  BookmarkPlus
} from 'lucide-react';
import { ReportTemplate, ActiveAppView } from '../types/report';

interface NavbarProps {
  currentView: ActiveAppView;
  onViewChange: (view: ActiveAppView) => void;
  templates: ReportTemplate[];
  activeTemplate: ReportTemplate;
  onSelectTemplate: (template: ReportTemplate) => void;
  onNewTemplate: () => void;
  onImportTemplate: (template: ReportTemplate) => void;
  liveStreaming: boolean;
  onToggleLiveStream: () => void;
  onOpenExportModal: () => void;
  onShareRpt: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenSaveTemplateModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  templates,
  activeTemplate,
  onSelectTemplate,
  onNewTemplate,
  onImportTemplate,
  liveStreaming,
  onToggleLiveStream,
  onOpenExportModal,
  onShareRpt,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenSaveTemplateModal,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.id && parsed.bands && parsed.elements) {
          onImportTemplate(parsed);
        } else {
          alert('Invalid .rpt.json report format');
        }
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg tracking-tight">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Crystal<span className="text-cyan-400">Report</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  Enterprise SDK
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs">
              Visual Designer • Real-time Analytics • .NET & React SDK
            </p>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <nav className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-medium">
          {/* Template Library Tab */}
          <button
            id="nav-tab-templates"
            onClick={() => onViewChange('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentView === 'templates'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Template Library</span>
            <span className="bg-cyan-950 text-cyan-300 text-[10px] px-1.5 py-0.2 rounded-full border border-cyan-800 font-mono">
              {templates.length}
            </span>
          </button>

          {/* Visual Designer Tab */}
          <button
            id="nav-tab-designer"
            onClick={() => onViewChange('designer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentView === 'designer'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Visual Designer</span>
          </button>

          {/* Live Preview Tab */}
          <button
            id="nav-tab-preview"
            onClick={() => onViewChange('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentView === 'preview'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Analytics</span>
          </button>

          {/* Data Sources & API Studio Tab */}
          <button
            id="nav-tab-datasources"
            onClick={() => onViewChange('datasources')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentView === 'datasources'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Sources & API</span>
            <span className="bg-cyan-950 text-cyan-300 text-[10px] px-1 py-0.2 rounded font-mono border border-cyan-800">
              REST / SQL
            </span>
          </button>

          {/* Developer SDK Tab */}
          <button
            id="nav-tab-sdk"
            onClick={() => onViewChange('sdk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentView === 'sdk'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer SDK</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1 py-0.2 rounded font-mono">
              .NET / React
            </span>
          </button>
        </nav>

        {/* Right Actions: Quick Undo/Redo + Template Selector & Live Stream & Export */}
        <div className="flex items-center gap-2">
          {/* Quick Undo / Redo buttons */}
          <div className="hidden lg:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo change (Ctrl+Z)"
              className={`p-1.5 rounded text-slate-400 hover:text-cyan-400 transition ${
                !canUndo ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo change (Ctrl+Y)"
              className={`p-1.5 rounded text-slate-400 hover:text-cyan-400 transition ${
                !canRedo ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Template Selector Dropdown */}
          <div className="relative flex items-center">
            <select
              id="template-selector-dropdown"
              value={activeTemplate.id}
              onChange={(e) => {
                const found = templates.find((t) => t.id === e.target.value);
                if (found) onSelectTemplate(found);
              }}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500 max-w-[170px] truncate"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start New Report */}
          <button
            id="start-new-report-btn"
            onClick={onNewTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition"
            title="Start a new blank report design"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Report</span>
          </button>

          {/* Real-Time Live Streaming Toggle */}
          <button
            id="live-stream-toggle-btn"
            onClick={onToggleLiveStream}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              liveStreaming
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-950'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle simulated real-time MySQL stream updates"
          >
            {liveStreaming ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Live Stream ON</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline">Live Stream OFF</span>
              </>
            )}
          </button>

          {/* Share .rpt.json */}
          <button
            id="share-rpt-file-btn"
            onClick={onShareRpt}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            title="Download portable .rpt.json design specification"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">.rpt.json</span>
          </button>

          {/* PDF Export Button */}
          <button
            id="open-pdf-export-modal-btn"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          {/* Hidden File Input for import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.rpt.json"
            className="hidden"
          />
        </div>
      </div>
    </header>
  );
};
