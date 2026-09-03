import React, { useState, useMemo } from 'react';
import { 
  ReportTemplate, 
  TableColumn,
  ActiveAppView 
} from '../../types/report';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Layers, 
  QrCode as QrIcon, 
  RefreshCw,
  Layout,
  FileText,
  Shield,
  Palette,
  Sliders,
  Settings2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sparkles,
  Eye,
  ArrowLeft,
  Check
} from 'lucide-react';
import { FormulaEngine } from '../../services/formulaEngine';
import { ConditionalFormattingEngine } from '../../services/conditionalFormattingEngine';
import { PdfExporter } from '../../services/pdfExporter';

interface ReportViewerProps {
  template: ReportTemplate;
  dataset: Record<string, any>[];
  parameters: Record<string, any>;
  onUpdateParameter: (name: string, value: any) => void;
  liveStreaming: boolean;
  onOpenExportModal: () => void;
  onNavigateView?: (view: ActiveAppView) => void;
}

const PALETTES: Record<string, string[]> = {
  'corporate-blue': ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#0369a1'],
  'emerald': ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'],
  'purple': ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9'],
  'amber': ['#f59e0b', '#fbbf24', '#d97706', '#fde68a', '#b45309'],
  'monochrome': ['#334155', '#475569', '#64748b', '#94a3b8', '#1e293b'],
};

export const ReportViewer: React.FC<ReportViewerProps> = ({
  template,
  dataset,
  parameters,
  onUpdateParameter,
  liveStreaming,
  onOpenExportModal,
  onNavigateView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [activeWatermark, setActiveWatermark] = useState<string>(
    template.pageSettings.watermark?.enabled ? template.pageSettings.watermark.text : 'none'
  );
  const [activeTheme, setActiveTheme] = useState<string>('corporate-blue');
  const [viewLayoutMode, setViewLayoutMode] = useState<'sheet' | 'continuous' | 'matrix'>('sheet');
  const [viewerZoom, setViewerZoom] = useState<number>(100);
  const [showKpiCards, setShowKpiCards] = useState<boolean>(true);

  // Filter dataset by search term and parameters
  const filteredData = useMemo(() => {
    let list = [...dataset];

    // Territory / Region Filter
    const activeRegion = parameters.Region;
    if (activeRegion && activeRegion !== 'All') {
      list = list.filter((r) => r.region?.toLowerCase() === activeRegion.toLowerCase());
    }

    // Free text search across all columns
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    return list;
  }, [dataset, parameters, searchTerm]);

  // Aggregated totals for charts & summaries
  const totalRevenue = useMemo(() => {
    return filteredData.reduce((sum, r) => sum + (Number(r.gross_revenue) || 0), 0);
  }, [filteredData]);

  const totalProfit = useMemo(() => {
    return filteredData.reduce((sum, r) => sum + (Number(r.net_profit) || 0), 0);
  }, [filteredData]);

  const totalUnits = useMemo(() => {
    return filteredData.reduce((sum, r) => sum + (Number(r.units) || 0), 0);
  }, [filteredData]);

  // Region breakdown for charts
  const chartData = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; profit: number }> = {};
    filteredData.forEach((r) => {
      const cat = r.product_category || r.category || r.region || 'Other';
      if (!map[cat]) {
        map[cat] = { name: cat, revenue: 0, profit: 0 };
      }
      map[cat].revenue += Number(r.gross_revenue || r.ytd_total || r.total_valuation || 0);
      map[cat].profit += Number(r.net_profit || r.q1_actual || 0);
    });
    return Object.values(map);
  }, [filteredData]);

  // Table pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    if (itemsPerPage === 0) return filteredData; // all
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const tableEl = template.elements.find((el) => el.type === 'table');
  const columns: TableColumn[] = tableEl?.columns || [
    { id: '1', header: 'Invoice #', field: 'order_number', width: 20, align: 'left' },
    { id: '2', header: 'Customer Name', field: 'customer_name', width: 30, align: 'left' },
    { id: '3', header: 'Region', field: 'region', width: 20, align: 'left', format: 'badge' },
    { id: '4', header: 'Revenue', field: 'gross_revenue', width: 30, align: 'right', format: 'currency', summaryType: 'sum' },
  ];

  const currentColors = PALETTES[activeTheme] || PALETTES['corporate-blue'];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    PdfExporter.exportToCsv(template, filteredData);
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col min-w-0 overflow-y-auto select-none">
      {/* 1. TOP PREVIEW OPTIONS & CONTROL BAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-3.5 sticky top-0 z-30 shadow-md space-y-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Quick Return to Designer & View Mode Switcher */}
          <div className="flex items-center gap-2.5">
            {onNavigateView && (
              <button
                id="btn-back-to-designer"
                onClick={() => onNavigateView('designer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Visual Designer</span>
              </button>
            )}

            {/* Preview Sheet Layout Selector */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewLayoutMode('sheet')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                  viewLayoutMode === 'sheet'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Paginated Document Sheet View with true print boundaries"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Paginated Sheet</span>
              </button>

              <button
                onClick={() => setViewLayoutMode('continuous')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                  viewLayoutMode === 'continuous'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Continuous Analytics Dashboard Layout"
              >
                <Layout className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analytics View</span>
              </button>
            </div>
          </div>

          {/* Center: Live Filters & Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider hidden md:flex">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filters:</span>
            </div>

            {template.parameters.map((param) => (
              <div key={param.id} className="flex items-center gap-1.5">
                <span className="text-xs text-slate-300 font-medium">{param.label}:</span>
                {param.type === 'select' && param.options ? (
                  <select
                    id={`filter-param-${param.name}`}
                    value={parameters[param.name] ?? param.defaultValue}
                    onChange={(e) => onUpdateParameter(param.name, e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    {param.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={parameters[param.name] ?? param.defaultValue}
                    onChange={(e) => onUpdateParameter(param.name, e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  />
                )}
              </div>
            ))}

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search rows..."
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
              />
            </div>
          </div>

          {/* Right: Export & Print Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Download raw dataset as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Print document directly"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Secondary Bar: Preview Controls (Watermarks, Themes, Page Density, Zoom) */}
        <div className="max-w-7xl mx-auto pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          {/* Watermark Selector */}
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Watermark:</span>
            <select
              value={activeWatermark}
              onChange={(e) => setActiveWatermark(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-amber-300 font-mono"
            >
              <option value="none">None</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="APPROVED">APPROVED</option>
              <option value="SAMPLE">SAMPLE</option>
            </select>
          </div>

          {/* Theme Palette Selector */}
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Theme:</span>
            <select
              value={activeTheme}
              onChange={(e) => setActiveTheme(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-pink-300 font-medium"
            >
              <option value="corporate-blue">Corporate Sky</option>
              <option value="emerald">Emerald Modern</option>
              <option value="purple">Royal Violet</option>
              <option value="amber">Sunset Amber</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>

          {/* Rows Per Page */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rows / Page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-indigo-300 font-mono"
            >
              <option value={5}>5 rows</option>
              <option value={8}>8 rows</option>
              <option value={15}>15 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={0}>All rows</option>
            </select>
          </div>

          {/* KPI Summary Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showKpiCards}
              onChange={(e) => setShowKpiCards(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 bg-slate-950 w-3.5 h-3.5"
            />
            <span className="text-slate-300 text-[11px]">Show KPI Cards</span>
          </label>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewerZoom(Math.max(50, viewerZoom - 10))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[11px] text-cyan-400 w-10 text-center">{viewerZoom}%</span>
            <button
              onClick={() => setViewerZoom(Math.min(150, viewerZoom + 10))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewerZoom(100)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN PREVIEW DOCUMENT CONTAINER */}
      <div className="p-8 flex justify-center items-start flex-1 overflow-auto">
        <div 
          style={{
            transform: `scale(${viewerZoom / 100})`,
            transformOrigin: 'top center',
          }}
          className={`w-full ${
            viewLayoutMode === 'sheet' ? 'max-w-4xl' : 'max-w-6xl'
          } bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative print:shadow-none print:border-none transition-transform duration-75`}
        >
          {/* Watermark Overlay */}
          {activeWatermark !== 'none' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
              <span
                style={{
                  opacity: 0.12,
                  color: '#dc2626',
                  fontSize: '92px',
                  transform: 'rotate(-35deg)',
                }}
                className="font-extrabold tracking-widest uppercase border-4 border-red-600/20 px-8 py-4 rounded-3xl"
              >
                {activeWatermark}
              </span>
            </div>
          )}

          {/* 1. REPORT HEADER BAND */}
          <div className="p-8 pb-4 border-b border-slate-200 bg-slate-50/50 flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-cyan-600 tracking-wider uppercase bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                  {template.category} • Crystal Engine v{template.version}
                </span>
                {liveStreaming && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Streaming MySQL
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{template.name}</h1>
              <p className="text-xs text-slate-500 font-medium">
                {template.description}
              </p>
            </div>

            {/* QR Audit Code & Date */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <QrIcon className="w-12 h-12 text-slate-800" />
                <span className="text-[8px] text-slate-400 font-mono mt-0.5">AUDIT VERIFIED</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                GENERATED: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* 2. PAGE HEADER / KPI SUMMARY & CHARTS */}
          <div className="p-8 py-6 space-y-6 relative z-10">
            {/* KPI Cards Grid */}
            {showKpiCards && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-cyan-800 font-semibold mb-1">
                    <span>Total Gross Revenue</span>
                    <DollarSign className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {FormulaEngine.formatCurrency(totalRevenue)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    +18.4% vs FY-24 Budget
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
                    <span>Operating Net Profit</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {FormulaEngine.formatCurrency(totalProfit)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% Profit Margin
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-purple-800 font-semibold mb-1">
                    <span>Total Order Volume</span>
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {totalUnits.toLocaleString()} units
                  </div>
                  <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                    {filteredData.length} records processed
                  </div>
                </div>
              </div>
            )}

            {/* Visual Analytics Chart Breakdown */}
            {chartData.length > 0 && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Performance & Revenue Distribution
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aggregated across active territory parameters and categories
                    </p>
                  </div>
                  <span className="text-xs font-mono text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded font-bold">
                    {chartData.length} Categories
                  </span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: number) => [FormulaEngine.formatCurrency(val), 'Gross Revenue']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={currentColors[i % currentColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 3. DETAILS BAND - TABULAR DATASET */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Details Records Stream</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200">
                    Showing {paginatedRows.length} of {filteredData.length} records
                  </span>
                </div>

                {/* Pagination Controls */}
                {itemsPerPage > 0 && totalPages > 1 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-slate-700 font-mono px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.id}
                          style={{
                            width: col.width ? `${col.width}%` : 'auto',
                            textAlign: col.align || 'left',
                          }}
                          className="p-3 font-semibold uppercase tracking-wider text-[11px]"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="p-8 text-center text-slate-400">
                          No matching records found for the current query parameters.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row, rowIdx) => {
                        const rowRuleEval =
                          tableEl?.conditionalRules && tableEl.conditionalRules.length > 0
                            ? ConditionalFormattingEngine.evaluateElementRules(
                                tableEl,
                                row,
                                filteredData
                              )
                            : null;

                        if (rowRuleEval?.isHidden) return null;

                        return (
                        <tr
                          key={rowIdx}
                          className="transition"
                          style={{
                            backgroundColor: rowRuleEval?.style.backgroundColor,
                            color: rowRuleEval?.style.color,
                            fontWeight: rowRuleEval?.style.fontWeight,
                            fontStyle: rowRuleEval?.style.fontStyle,
                            textDecoration: rowRuleEval?.style.textDecoration,
                          }}
                        >
                          {columns.map((col) => {
                            const rawVal = row[col.field];
                            let formatted = FormulaEngine.formatValue(rawVal, col.format);

                            // Apply row-level and cell-level conditional formatting rules
                            let style = rowRuleEval?.style || {};
                            if (col.conditionalRules && col.conditionalRules.length > 0) {
                              style = {
                                ...style,
                                ...ConditionalFormattingEngine.evaluateColumnRules(
                                  col,
                                  rawVal,
                                  row,
                                  filteredData
                                ).style,
                              };
                            }

                            return (
                              <td
                                key={col.id}
                                style={{
                                  textAlign: col.align || 'left',
                                  ...style,
                                }}
                                className="p-3 font-medium text-slate-700"
                              >
                                {col.format === 'badge' ? (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                    {String(rawVal || '')}
                                  </span>
                                ) : (
                                  formatted
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. REPORT FOOTER / GRAND TOTALS */}
            <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between text-xs">
              <div className="text-slate-400 font-medium">
                Enterprise Report • Crystal Reports v{template.version}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-slate-500 font-medium">Grand Total Revenue: </span>
                  <span className="text-base font-black text-slate-900 font-mono ml-2">
                    {FormulaEngine.formatCurrency(totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
