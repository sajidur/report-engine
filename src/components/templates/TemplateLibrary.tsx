import React, { useState } from 'react';
import { ReportTemplate, ActiveAppView } from '../../types/report';
import { 
  Library, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Eye, 
  Edit3, 
  Copy, 
  Download, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Layout, 
  Layers, 
  BarChart3, 
  Table as TableIcon, 
  TrendingUp, 
  Calendar, 
  User, 
  Database,
  ArrowRight,
  BookmarkPlus
} from 'lucide-react';
import { PdfExporter } from '../../services/pdfExporter';

interface TemplateLibraryProps {
  templates: ReportTemplate[];
  activeTemplate: ReportTemplate;
  onSelectTemplate: (template: ReportTemplate) => void;
  onNewTemplate: () => void;
  onDuplicateTemplate: (template: ReportTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onOpenSaveModal: () => void;
  onNavigateView: (view: ActiveAppView) => void;
}

const CATEGORIES = ['All', 'Sales', 'Financial', 'Invoicing', 'Operations', 'SaaS', 'HR', 'Custom'];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  activeTemplate,
  onSelectTemplate,
  onNewTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onOpenSaveModal,
  onNavigateView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orientationFilter, setOrientationFilter] = useState<'all' | 'portrait' | 'landscape'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<ReportTemplate | null>(null);

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || tpl.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesOrientation =
      orientationFilter === 'all' || tpl.pageSettings.orientation === orientationFilter;

    return matchesSearch && matchesCategory && matchesOrientation;
  });

  const handleApplyTemplate = (tpl: ReportTemplate) => {
    onSelectTemplate(tpl);
    onNavigateView('designer');
  };

  const handlePreviewAndLaunch = (tpl: ReportTemplate) => {
    onSelectTemplate(tpl);
    onNavigateView('preview');
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col min-w-0 overflow-y-auto select-none p-6 lg:p-8">
      {/* Top Banner & Title */}
      <div className="max-w-7xl mx-auto w-full mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" />
                Template Library & Specification Catalog
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">{templates.length} Templates Available</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Enterprise Crystal Report Templates
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Standardized banded report layouts engineered for MySQL enterprise analytics, C# .NET Web APIs, and React SDK integration. Select, customize, or export .rpt.json design specifications.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              id="save-current-as-template-btn"
              onClick={onOpenSaveModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold shadow-md transition"
            >
              <BookmarkPlus className="w-4 h-4 text-cyan-400" />
              <span>Save Current Design</span>
            </button>

            <button
              id="create-blank-template-btn"
              onClick={() => {
                onNewTemplate();
                onNavigateView('designer');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Blank Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="max-w-7xl mx-auto w-full mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by report name, author, keywords or SQL query..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Orientation Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setOrientationFilter('all')}
              className={`px-2.5 py-1 rounded ${
                orientationFilter === 'all' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setOrientationFilter('portrait')}
              className={`px-2.5 py-1 rounded ${
                orientationFilter === 'portrait' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => setOrientationFilter('landscape')}
              className={`px-2.5 py-1 rounded ${
                orientationFilter === 'landscape' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Landscape
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto w-full">
        {filteredTemplates.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <Library className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Templates Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              No report templates match your current filter or search criteria. Try clearing search filters or create a new custom template.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setOrientationFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-semibold transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => {
              const isCurrent = activeTemplate.id === tpl.id;
              const kpiCount = tpl.elements.filter((el) => el.type === 'kpi').length;
              const chartCount = tpl.elements.filter((el) => el.type === 'chart').length;
              const tableCount = tpl.elements.filter((el) => el.type === 'table').length;
              const isLandscape = tpl.pageSettings.orientation === 'landscape';

              return (
                <div
                  key={tpl.id}
                  id={`template-card-${tpl.id}`}
                  className={`bg-slate-900/90 border rounded-2xl overflow-hidden shadow-lg hover:shadow-cyan-950/40 transition flex flex-col group ${
                    isCurrent
                      ? 'border-cyan-500/80 ring-1 ring-cyan-500/40 shadow-cyan-900/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Visual Blueprint Thumbnail */}
                  <div className="h-36 bg-slate-950 p-4 relative border-b border-slate-800/80 flex items-center justify-center overflow-hidden">
                    {/* Simulated Wireframe Mini Canvas */}
                    <div
                      style={{
                        width: isLandscape ? '180px' : '135px',
                        height: '110px',
                      }}
                      className="bg-white rounded-md shadow-md border border-slate-300 p-2 flex flex-col justify-between transform group-hover:scale-105 transition-transform duration-200 pointer-events-none"
                    >
                      {/* Mini Report Header */}
                      <div className="border-b border-cyan-400/40 pb-1 flex items-center justify-between">
                        <div className="w-16 h-2 bg-cyan-700 rounded-sm" />
                        <div className="w-3 h-3 bg-slate-300 rounded-sm" />
                      </div>

                      {/* Mini KPIs & Content */}
                      <div className="flex gap-1 my-1">
                        <div className="flex-1 h-4 bg-emerald-100 rounded border border-emerald-300" />
                        <div className="flex-1 h-4 bg-blue-100 rounded border border-blue-300" />
                      </div>

                      {/* Mini Table grid */}
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded p-1 flex flex-col justify-around">
                        <div className="w-full h-1.5 bg-slate-300 rounded-sm" />
                        <div className="w-full h-1 bg-slate-200 rounded-sm" />
                        <div className="w-full h-1 bg-slate-200 rounded-sm" />
                      </div>

                      {/* Mini Footer */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-sm mt-1" />
                    </div>

                    {/* Active Template Badge */}
                    {isCurrent && (
                      <div className="absolute top-2.5 right-2.5 bg-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </div>
                    )}

                    {/* Category Pill */}
                    <div className="absolute top-2.5 left-2.5 bg-slate-900/90 border border-slate-700 text-cyan-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      {tpl.category}
                    </div>

                    {/* Orientation Pill */}
                    <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 border border-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded">
                      {tpl.pageSettings.size} • {isLandscape ? 'Landscape' : 'Portrait'}
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition line-clamp-1">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Component stats pill row */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        {tableCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px]" title="Data Tables">
                            <TableIcon className="w-3.5 h-3.5 text-purple-400" />
                            {tableCount}
                          </span>
                        )}
                        {kpiCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px]" title="KPI Metrics">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            {kpiCount}
                          </span>
                        )}
                        {chartCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px]" title="Charts">
                            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                            {chartCount}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          {tpl.elements.length} components
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">v{tpl.version}</span>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => handleApplyTemplate(tpl)}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Design</span>
                      </button>

                      <button
                        onClick={() => handlePreviewAndLaunch(tpl)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg text-xs font-medium border border-slate-700 transition"
                        title="Live Analytics Preview"
                      >
                        <Eye className="w-4 h-4 text-cyan-400" />
                      </button>

                      <button
                        onClick={() => onDuplicateTemplate(tpl)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs font-medium border border-slate-700 transition"
                        title="Duplicate Template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => PdfExporter.exportTemplateJson(tpl)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs font-medium border border-slate-700 transition"
                        title="Download .rpt.json"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {tpl.category === 'Custom' && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete custom template "${tpl.name}"?`)) {
                              onDeleteTemplate(tpl.id);
                            }
                          }}
                          className="bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 p-2 rounded-lg text-xs font-medium border border-slate-700 transition"
                          title="Delete Custom Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
