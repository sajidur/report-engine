import React, { useState, useRef, useEffect } from 'react';
import { 
  GridSettings, 
  GridStyleType 
} from '../../services/alignmentEngine';
import { ReportPageSettings, ReportDataSource, ActiveAppView } from '../../types/report';
import { 
  Grid, 
  Magnet, 
  Eye, 
  Layout, 
  Columns, 
  Sliders, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  Ruler, 
  FileText, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  Settings2, 
  Tv, 
  SquareDashed, 
  Droplet,
  Printer,
  Download,
  Shield,
  Palette,
  Database,
  ArrowRight,
  SplitSquareVertical,
  Maximize2
} from 'lucide-react';

interface PreviewOptionsBarProps {
  gridSettings: GridSettings;
  onUpdateGridSettings: (settings: GridSettings) => void;
  pageSettings?: ReportPageSettings;
  onUpdatePageSettings?: (settings: Partial<ReportPageSettings>) => void;
  dataSources?: ReportDataSource[];
  selectedDataSourceId?: string;
  onSelectDataSourceId?: (id: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitWidth: () => void;
  onFitWindow: () => void;
  onNavigateToPreview?: () => void;
  onOpenExportModal?: () => void;
}

export const PreviewOptionsBar: React.FC<PreviewOptionsBarProps> = ({
  gridSettings,
  onUpdateGridSettings,
  pageSettings,
  onUpdatePageSettings,
  dataSources = [],
  selectedDataSourceId,
  onSelectDataSourceId,
  zoom,
  onZoomChange,
  onFitWidth,
  onFitWindow,
  onNavigateToPreview,
  onOpenExportModal,
}) => {
  const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);
  const [isPreviewMenuOpen, setIsPreviewMenuOpen] = useState(false);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);

  const designMenuRef = useRef<HTMLDivElement>(null);
  const previewMenuRef = useRef<HTMLDivElement>(null);
  const zoomMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (designMenuRef.current && !designMenuRef.current.contains(e.target as Node)) {
        setIsDesignMenuOpen(false);
      }
      if (previewMenuRef.current && !previewMenuRef.current.contains(e.target as Node)) {
        setIsPreviewMenuOpen(false);
      }
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) {
        setIsZoomMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateGrid = (partial: Partial<GridSettings>) => {
    onUpdateGridSettings({ ...gridSettings, ...partial });
  };

  const gridSizes = [4, 8, 12, 16, 24, 32];
  const gridStyles: { id: GridStyleType; label: string; desc: string }[] = [
    { id: 'dots', label: 'Dot Matrix', desc: 'Subtle high-precision dots' },
    { id: 'lines', label: 'Cartesian Mesh', desc: 'Graph paper with major accents' },
    { id: 'crosshairs', label: 'Crosshairs', desc: 'Corner intersection markers' },
    { id: 'off', label: 'Hidden', desc: 'Snap without visual grid' },
  ];

  const paperSizes: { id: 'A4' | 'Letter' | 'Legal'; label: string; dims: string }[] = [
    { id: 'A4', label: 'A4 Standard', dims: '210 × 297 mm' },
    { id: 'Letter', label: 'US Letter', dims: '8.5 × 11.0 in' },
    { id: 'Legal', label: 'US Legal', dims: '8.5 × 14.0 in' },
  ];

  const watermarks = [
    { id: 'none', label: 'None (Clean)' },
    { id: 'draft', label: 'DRAFT' },
    { id: 'confidential', label: 'CONFIDENTIAL' },
    { id: 'approved', label: 'APPROVED' },
    { id: 'sample', label: 'SAMPLE' },
  ];

  const themePalettes = [
    { id: 'corporate-blue', label: 'Corporate Sky', color: 'bg-sky-500' },
    { id: 'emerald', label: 'Emerald Modern', color: 'bg-emerald-500' },
    { id: 'purple', label: 'Royal Violet', color: 'bg-purple-500' },
    { id: 'amber', label: 'Sunset Amber', color: 'bg-amber-500' },
    { id: 'monochrome', label: 'Monochrome', color: 'bg-slate-700' },
  ];

  return (
    <div className="flex items-center gap-2 text-xs select-none">
      {/* 1. Quick Mode Switcher: Design | Live Canvas | Split View | Full Preview */}
      <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 shadow-inner">
        <button
          id="btn-mode-design"
          onClick={() => updateGrid({ dataPreviewMode: 'design', viewLayout: 'single' })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
            gridSettings.dataPreviewMode === 'design' && gridSettings.viewLayout === 'single'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Design Mode: Edit layout, arrange bands, drag elements"
        >
          <Layout className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Design</span>
        </button>

        <button
          id="btn-mode-live-canvas"
          onClick={() => updateGrid({ dataPreviewMode: 'live', viewLayout: 'single' })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
            gridSettings.dataPreviewMode === 'live' && gridSettings.viewLayout === 'single'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Live Canvas: In-place data evaluation directly on designer canvas"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Live Canvas</span>
        </button>

        <button
          id="btn-mode-split-view"
          onClick={() => updateGrid({ viewLayout: gridSettings.viewLayout === 'split' ? 'single' : 'split' })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
            gridSettings.viewLayout === 'split'
              ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Split View: Real-time side-by-side Designer and Live Report Output"
        >
          <Columns className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Split View</span>
        </button>

        {onNavigateToPreview && (
          <button
            id="btn-mode-full-preview"
            onClick={onNavigateToPreview}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition"
            title="Full Report Viewer: Interactive Analytics & Document Export"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Full Preview</span>
          </button>
        )}
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

      {/* 2. DESIGN OPTIONS DROPDOWN */}
      <div className="relative" ref={designMenuRef}>
        <button
          id="btn-design-options-menu"
          onClick={() => {
            setIsDesignMenuOpen(!isDesignMenuOpen);
            setIsPreviewMenuOpen(false);
            setIsZoomMenuOpen(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
            isDesignMenuOpen
              ? 'bg-cyan-950/80 border-cyan-600 text-cyan-200 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
          }`}
          title="Design Options: Page geometry, Grid Snapping, Rulers, Magnetic Guides & Overlays"
        >
          <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Design Options</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>

        {isDesignMenuOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3.5 space-y-3.5 text-xs animate-in fade-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                <span>Visual Design & Layout Options</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800">
                {pageSettings?.orientation || 'portrait'}
              </span>
            </div>

            {/* Page Size & Orientation */}
            {pageSettings && onUpdatePageSettings && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Paper Format & Orientation</span>
                  <button
                    onClick={() =>
                      onUpdatePageSettings({
                        orientation: pageSettings.orientation === 'portrait' ? 'landscape' : 'portrait',
                      })
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono transition"
                  >
                    Switch to {pageSettings.orientation === 'portrait' ? 'Landscape' : 'Portrait'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {paperSizes.map((ps) => (
                    <button
                      key={ps.id}
                      onClick={() => onUpdatePageSettings({ size: ps.id })}
                      className={`p-1.5 rounded-lg border text-left transition ${
                        pageSettings.size === ps.id
                          ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-[11px] text-slate-200">{ps.label}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{ps.dims}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grid Interval & Snapping */}
            <div className="space-y-1.5 border-t border-slate-800 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">Grid Snapping Interval</span>
                <button
                  onClick={() => updateGrid({ enabled: !gridSettings.enabled })}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    gridSettings.enabled
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {gridSettings.enabled ? `Snap Active (${gridSettings.size}px)` : 'Snap Off'}
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {gridSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateGrid({ size: sz, enabled: true })}
                    className={`py-1 rounded font-mono text-center transition ${
                      gridSettings.size === sz && gridSettings.enabled
                        ? 'bg-cyan-600 text-white font-bold shadow'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Grid Pattern */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300">Grid Pattern Display</span>
              <div className="grid grid-cols-2 gap-1.5">
                {gridStyles.map((gst) => (
                  <button
                    key={gst.id}
                    onClick={() => updateGrid({ style: gst.id })}
                    className={`text-left p-1.5 rounded-lg border transition ${
                      gridSettings.style === gst.id
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="font-semibold text-[11px] text-slate-200">{gst.label}</div>
                    <div className="text-[9px] text-slate-500 truncate">{gst.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Magnetic Snapping & Smart Guides */}
            <div className="border-t border-slate-800 pt-2.5 space-y-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <Magnet className="w-3.5 h-3.5 text-pink-400" />
                  <div>
                    <div className="font-semibold text-slate-200 text-[11px] group-hover:text-pink-300">
                      Smart Magnetic Guides
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Snap to edges, centers & neighbor elements
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={gridSettings.magneticSnap}
                  onChange={(e) => updateGrid({ magneticSnap: e.target.checked })}
                  className="rounded border-slate-700 text-pink-500 focus:ring-pink-500 bg-slate-950 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Canvas Overlays checklist */}
              <div className="space-y-1 pt-1">
                <label className="flex items-center justify-between p-1 rounded hover:bg-slate-800/60 cursor-pointer">
                  <span className="text-slate-300 text-[11px] flex items-center gap-1.5">
                    <Ruler className="w-3 h-3 text-cyan-400" /> Rulers (Horizontal & Vertical)
                  </span>
                  <input
                    type="checkbox"
                    checked={gridSettings.showRulers}
                    onChange={(e) => updateGrid({ showRulers: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-500 bg-slate-950 w-3.5 h-3.5"
                  />
                </label>

                <label className="flex items-center justify-between p-1 rounded hover:bg-slate-800/60 cursor-pointer">
                  <span className="text-slate-300 text-[11px] flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-amber-400" /> Printable Margins / Safe Areas
                  </span>
                  <input
                    type="checkbox"
                    checked={gridSettings.showMargins}
                    onChange={(e) => updateGrid({ showMargins: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 bg-slate-950 w-3.5 h-3.5"
                  />
                </label>

                <label className="flex items-center justify-between p-1 rounded hover:bg-slate-800/60 cursor-pointer">
                  <span className="text-slate-300 text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-400" /> Band Headers & Heights
                  </span>
                  <input
                    type="checkbox"
                    checked={gridSettings.showBandHeaders}
                    onChange={(e) => updateGrid({ showBandHeaders: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-500 bg-slate-950 w-3.5 h-3.5"
                  />
                </label>

                <label className="flex items-center justify-between p-1 rounded hover:bg-slate-800/60 cursor-pointer">
                  <span className="text-slate-300 text-[11px] flex items-center gap-1.5">
                    <SquareDashed className="w-3 h-3 text-emerald-400" /> Element Hover & Selection Outlines
                  </span>
                  <input
                    type="checkbox"
                    checked={gridSettings.showOutlines}
                    onChange={(e) => updateGrid({ showOutlines: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 bg-slate-950 w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. PREVIEW OPTIONS DROPDOWN */}
      <div className="relative" ref={previewMenuRef}>
        <button
          id="btn-preview-options-menu"
          onClick={() => {
            setIsPreviewMenuOpen(!isPreviewMenuOpen);
            setIsDesignMenuOpen(false);
            setIsZoomMenuOpen(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
            isPreviewMenuOpen
              ? 'bg-purple-950/80 border-purple-600 text-purple-200 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
          }`}
          title="Preview Options: Data Sources, Watermarks, Theme palettes, Row limits, and Export actions"
        >
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <span>Preview Options</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>

        {isPreviewMenuOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3.5 space-y-3.5 text-xs animate-in fade-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>Live Preview & Data Engine Options</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400 px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800">
                {gridSettings.dataPreviewMode === 'live' ? 'Live Data' : 'Design View'}
              </span>
            </div>

            {/* Data Source Selector */}
            {dataSources.length > 0 && onSelectDataSourceId && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-cyan-400" /> Active Data Source
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {dataSources.find((d) => d.id === selectedDataSourceId)?.data?.length || 0} rows
                  </span>
                </div>
                <select
                  value={selectedDataSourceId || dataSources[0]?.id}
                  onChange={(e) => onSelectDataSourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
                >
                  {dataSources.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.name} ({ds.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Row Limit / Sample Size */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300">Preview Record Limit</span>
              <div className="grid grid-cols-5 gap-1 font-mono text-[11px]">
                {[5, 10, 25, 50, 100].map((lim) => (
                  <button
                    key={lim}
                    onClick={() => updateGrid({ previewRecordLimit: lim })}
                    className={`py-1 rounded text-center transition ${
                      gridSettings.previewRecordLimit === lim
                        ? 'bg-purple-600 text-white font-bold shadow'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {lim}
                  </button>
                ))}
              </div>
            </div>

            {/* Watermark Selector */}
            <div className="space-y-1.5 border-t border-slate-800 pt-2.5">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-amber-400" /> Document Watermark Overlay
              </span>
              <div className="grid grid-cols-3 gap-1">
                {watermarks.map((wm) => (
                  <button
                    key={wm.id}
                    onClick={() => updateGrid({ previewWatermark: wm.id as any })}
                    className={`p-1.5 rounded-lg border text-center font-medium text-[10px] transition ${
                      (gridSettings.previewWatermark || 'none') === wm.id
                        ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {wm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette / Theme Presets */}
            <div className="space-y-1.5 border-t border-slate-800 pt-2.5">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3 h-3 text-pink-400" /> Preview Color Scheme
              </span>
              <div className="grid grid-cols-5 gap-1">
                {themePalettes.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => updateGrid({ previewTheme: th.id as any })}
                    title={th.label}
                    className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition ${
                      (gridSettings.previewTheme || 'corporate-blue') === th.id
                        ? 'bg-slate-800 border-pink-500 text-pink-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${th.color} shadow-xs`} />
                    <span className="text-[9px] truncate w-full text-center">{th.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fast Export Actions */}
            {onOpenExportModal && (
              <div className="border-t border-slate-800 pt-2.5 flex items-center gap-2">
                <button
                  onClick={onOpenExportModal}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition shadow-sm text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report PDF / Excel</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. ZOOM & VIEWPORT CONTROLS */}
      <div className="relative ml-auto" ref={zoomMenuRef}>
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 shadow-inner">
          <button
            onClick={() => onZoomChange(Math.max(40, zoom - 10))}
            className="text-slate-400 hover:text-slate-200 p-0.5 transition"
            title="Zoom out (-10%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <button
            id="btn-zoom-menu"
            onClick={() => {
              setIsZoomMenuOpen(!isZoomMenuOpen);
              setIsDesignMenuOpen(false);
              setIsPreviewMenuOpen(false);
            }}
            className="font-mono text-[11px] px-1 text-center text-cyan-300 hover:underline flex items-center gap-0.5"
            title="Zoom presets and fit options"
          >
            <span>{zoom}%</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
          </button>

          <button
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            className="text-slate-400 hover:text-slate-200 p-0.5 transition"
            title="Zoom in (+10%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {isZoomMenuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 text-xs animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                onFitWidth();
                setIsZoomMenuOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between"
            >
              <span>Fit to Width</span>
              <Maximize className="w-3 h-3 text-cyan-400" />
            </button>
            <button
              onClick={() => {
                onFitWindow();
                setIsZoomMenuOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between"
            >
              <span>Fit Entire Page</span>
              <Minimize className="w-3 h-3 text-cyan-400" />
            </button>
            <div className="h-px bg-slate-800 my-1" />
            {[50, 75, 100, 125, 150, 200].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  onZoomChange(preset);
                  setIsZoomMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1 rounded-lg flex items-center justify-between font-mono text-[11px] ${
                  zoom === preset
                    ? 'bg-cyan-950 text-cyan-300 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{preset}%</span>
                {zoom === preset && <Check className="w-3 h-3 text-cyan-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
