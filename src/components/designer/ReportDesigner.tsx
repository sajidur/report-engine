import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ReportTemplate, 
  ReportElement, 
  BandType, 
  ElementType,
  ReportBand 
} from '../../types/report';
import { HistoryEntry } from '../../hooks/useUndoRedo';
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
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  Maximize2, 
  Minimize2, 
  Grid, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  TrendingUp, 
  DollarSign, 
  Package, 
  QrCode as QrIcon, 
  ChevronDown, 
  ChevronRight,
  Undo2,
  Redo2,
  History,
  Clock,
  RotateCcw,
  Layers,
  Check,
  Magnet,
  Eye,
  Sliders,
  Maximize,
  Sparkles,
  ChevronUp,
  LayoutGrid,
  AlignJustify,
  ArrowRight,
} from 'lucide-react';
import { FormulaEngine } from '../../services/formulaEngine';
import { ConditionalFormattingEngine } from '../../services/conditionalFormattingEngine';
import { 
  AlignmentEngine, 
  GridSettings, 
  DEFAULT_GRID_SETTINGS, 
  SnapGuide, 
  DragHudInfo 
} from '../../services/alignmentEngine';
import { CanvasRulers } from './CanvasRulers';
import { PrecisionAlignmentBar } from './PrecisionAlignmentBar';
import { PreviewOptionsBar } from './PreviewOptionsBar';
import { ActiveAppView, ReportPageSettings } from '../../types/report';

interface ReportDesignerProps {
  template: ReportTemplate;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (el: ReportElement, actionLabel?: string) => void;
  onUpdateMultipleElements?: (
    updatedElements: ReportElement[],
    actionLabel?: string,
    updatedBandHeight?: { bandType: BandType; height: number }
  ) => void;
  onUpdateBands: (bands: Record<BandType, ReportBand>, actionLabel?: string) => void;
  activeBand: BandType;
  onSelectBand: (band: BandType) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  history?: HistoryEntry[];
  currentHistoryIndex?: number;
  onJumpToHistoryIndex?: (index: number) => void;
  lastAction?: string;
  onDeleteElement?: (id: string) => void;
  onDuplicateElement?: (el: ReportElement) => void;
  onNavigateView?: (view: ActiveAppView) => void;
  onUpdatePageSettings?: (settings: Partial<ReportPageSettings>) => void;
  onOpenExportModal?: () => void;
}

const BAND_ORDER: BandType[] = [
  'reportHeader',
  'pageHeader',
  'groupHeader',
  'details',
  'groupFooter',
  'pageFooter',
  'reportFooter',
];

const BAND_COLORS: Record<BandType, { label: string; badgeBg: string; border: string }> = {
  reportHeader: { label: 'Report Header (Printed Once)', badgeBg: 'bg-cyan-950 text-cyan-400 border-cyan-800', border: 'border-cyan-800/40' },
  pageHeader: { label: 'Page Header (Top of Every Page)', badgeBg: 'bg-blue-950 text-blue-400 border-blue-800', border: 'border-blue-800/40' },
  groupHeader: { label: 'Group Header (Subtotals / Breakdown)', badgeBg: 'bg-emerald-950 text-emerald-400 border-emerald-800', border: 'border-emerald-800/40' },
  details: { label: 'Details Band (MySQL Data Grid / Rows)', badgeBg: 'bg-purple-950 text-purple-400 border-purple-800', border: 'border-purple-800/40' },
  groupFooter: { label: 'Group Footer (Subtotal Calculations)', badgeBg: 'bg-indigo-950 text-indigo-400 border-indigo-800', border: 'border-indigo-800/40' },
  pageFooter: { label: 'Page Footer (Bottom of Every Page)', badgeBg: 'bg-slate-900 text-slate-400 border-slate-700', border: 'border-slate-700/40' },
  reportFooter: { label: 'Report Footer (Grand Totals & Signatures)', badgeBg: 'bg-amber-950 text-amber-400 border-amber-800', border: 'border-amber-800/40' },
};

const CHART_PALETTE = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const ReportDesigner: React.FC<ReportDesignerProps> = ({
  template,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onUpdateMultipleElements,
  onUpdateBands,
  activeBand,
  onSelectBand,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  history = [],
  currentHistoryIndex = 0,
  onJumpToHistoryIndex,
  lastAction = 'Ready',
  onDeleteElement,
  onDuplicateElement,
  onNavigateView,
  onUpdatePageSettings,
  onOpenExportModal,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [gridSettings, setGridSettings] = useState<GridSettings>(DEFAULT_GRID_SETTINGS);
  const [collapsedBands, setCollapsedBands] = useState<Record<string, boolean>>({});
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState<boolean>(false);
  const [isAutoArrangeMenuOpen, setIsAutoArrangeMenuOpen] = useState<boolean>(false);
  
  // Live Active Guides & Drag HUD state
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [activeDragHud, setActiveDragHud] = useState<DragHudInfo | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number } | null>(null);

  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLDivElement>(null);

  const dataset = template.dataSources[0]?.data || [];
  const primaryRow = dataset[0] || {};
  const isLandscape = template.pageSettings.orientation === 'landscape';
  const canvasWidth = isLandscape ? 1040 : 760;

  // Compute total canvas height based on visible bands
  const totalCanvasHeight = useMemo(() => {
    return BAND_ORDER.reduce((sum, bType) => {
      const b = template.bands[bType];
      if (!b || !b.visible) return sum;
      return sum + (collapsedBands[bType] ? 28 : (b.height || 60));
    }, 0);
  }, [template.bands, collapsedBands]);

  const selectedElement = useMemo(() => {
    return template.elements.find((el) => el.id === selectedElementId) || null;
  }, [template.elements, selectedElementId]);

  const selectedBandObj = useMemo(() => {
    return template.bands[activeBand] || template.bands['details'];
  }, [template.bands, activeBand]);

  const activeBandElementsCount = useMemo(() => {
    return template.elements.filter((el) => el.band === activeBand).length;
  }, [template.elements, activeBand]);

  // Constraint-based Auto-Arrange Handler for Active Band
  const handleAutoArrange = useCallback(
    (
      bandToArrange: BandType = activeBand,
      mode: 'auto' | 'horizontal' | 'grid' | 'vertical' = 'auto'
    ) => {
      const targetBandObj = template.bands[bandToArrange];
      if (!targetBandObj) return;

      const result = AlignmentEngine.autoArrangeBandElements(
        template.elements,
        bandToArrange,
        targetBandObj,
        canvasWidth,
        gridSettings.enabled ? gridSettings.size : 0,
        mode
      );

      if (result.arrangedCount === 0) {
        return;
      }

      if (onUpdateMultipleElements) {
        onUpdateMultipleElements(
          result.updatedElements,
          result.layoutDescription,
          result.recommendedBandHeight
            ? { bandType: bandToArrange, height: result.recommendedBandHeight }
            : undefined
        );
      } else {
        result.updatedElements.forEach((el) => {
          onUpdateElement(el, result.layoutDescription);
        });
        if (result.recommendedBandHeight) {
          onUpdateBands(
            {
              ...template.bands,
              [bandToArrange]: {
                ...targetBandObj,
                height: result.recommendedBandHeight,
              },
            },
            `Adjusted ${targetBandObj.name || bandToArrange} Height`
          );
        }
      }
    },
    [
      template.elements,
      template.bands,
      activeBand,
      canvasWidth,
      gridSettings.enabled,
      gridSettings.size,
      onUpdateMultipleElements,
      onUpdateElement,
      onUpdateBands,
    ]
  );

  // Dragging / Moving state
  const draggingRef = useRef<{
    elementId: string;
    startX: number;
    startY: number;
    initialElX: number;
    initialElY: number;
    hasMoved: boolean;
    element: ReportElement;
  } | null>(null);

  // Resizing state
  const resizingRef = useRef<{
    elementId: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    hasResized: boolean;
    element: ReportElement;
  } | null>(null);

  // Band Height Resizing
  const bandResizeRef = useRef<{
    bandType: BandType;
    startY: number;
    initialHeight: number;
    hasChanged: boolean;
  } | null>(null);

  // Keyboard navigation & nudging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or contentEditable
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (!selectedElement) return;

      const step = e.shiftKey
        ? (gridSettings.enabled ? gridSettings.size * 2 : 10)
        : (gridSettings.enabled ? gridSettings.size : 1);

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateElement({
          ...selectedElement,
          x: Math.max(0, selectedElement.x - step),
        }, `Nudged Left (${step}px)`);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateElement({
          ...selectedElement,
          x: Math.max(0, selectedElement.x + step),
        }, `Nudged Right (${step}px)`);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateElement({
          ...selectedElement,
          y: Math.max(0, selectedElement.y - step),
        }, `Nudged Up (${step}px)`);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateElement({
          ...selectedElement,
          y: Math.max(0, selectedElement.y + step),
        }, `Nudged Down (${step}px)`);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (onDeleteElement) {
          e.preventDefault();
          onDeleteElement(selectedElement.id);
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        if (onDuplicateElement) {
          e.preventDefault();
          onDuplicateElement(selectedElement);
        }
      } else if (e.key === 'Escape') {
        onSelectElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, gridSettings, onUpdateElement, onDeleteElement, onDuplicateElement, onSelectElement]);

  // Track cursor coordinates relative to canvas for rulers
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasElementRef.current) return;
    const rect = canvasElementRef.current.getBoundingClientRect();
    const scale = zoom / 100;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setMouseCanvasPos({ x, y });
  };

  const handleCanvasMouseLeave = () => {
    setMouseCanvasPos(null);
  };

  // Zoom Fit helpers
  const handleFitWidth = () => {
    if (!canvasScrollRef.current) return;
    const containerWidth = canvasScrollRef.current.clientWidth - 80;
    const targetZoom = Math.max(40, Math.min(200, Math.round((containerWidth / canvasWidth) * 100)));
    setZoom(targetZoom);
  };

  const handleFitWindow = () => {
    if (!canvasScrollRef.current) return;
    const containerWidth = canvasScrollRef.current.clientWidth - 80;
    const containerHeight = canvasScrollRef.current.clientHeight - 80;
    const zoomW = (containerWidth / canvasWidth) * 100;
    const zoomH = (containerHeight / totalCanvasHeight) * 100;
    const targetZoom = Math.max(40, Math.min(150, Math.round(Math.min(zoomW, zoomH))));
    setZoom(targetZoom);
  };

  // Element Dragging Handler
  const handleMouseDownElement = (e: React.MouseEvent, el: ReportElement) => {
    e.stopPropagation();
    onSelectElement(el.id);
    onSelectBand(el.band);

    draggingRef.current = {
      elementId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      initialElX: el.x,
      initialElY: el.y,
      hasMoved: false,
      element: el,
    };

    const targetBand = template.bands[el.band] || { type: el.band, name: el.band, height: 80, visible: true };
    const otherElements = template.elements.filter((other) => other.band === el.band && other.id !== el.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = (moveEvent.clientX - draggingRef.current.startX) / (zoom / 100);
      const dy = (moveEvent.clientY - draggingRef.current.startY) / (zoom / 100);

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        draggingRef.current.hasMoved = true;
      }

      const rawX = draggingRef.current.initialElX + dx;
      const rawY = draggingRef.current.initialElY + dy;

      // Compute Magnetic Alignment & Grid Snapping
      const { finalX, finalY, guides, hud } = AlignmentEngine.computeDragAlignment(
        el,
        rawX,
        rawY,
        el.width,
        el.height,
        otherElements,
        targetBand,
        canvasWidth,
        gridSettings,
        draggingRef.current.initialElX,
        draggingRef.current.initialElY
      );

      setActiveGuides(guides);
      setActiveDragHud(hud);

      const latestEl: ReportElement = {
        ...el,
        x: finalX,
        y: finalY,
      };

      onUpdateElement(latestEl, `Moved ${el.name || el.type}`);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      draggingRef.current = null;
      setActiveGuides([]);
      setActiveDragHud(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Element Resizing Handler
  const handleMouseDownResize = (e: React.MouseEvent, el: ReportElement) => {
    e.stopPropagation();
    resizingRef.current = {
      elementId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: el.width,
      initialHeight: el.height,
      hasResized: false,
      element: el,
    };

    const targetBand = template.bands[el.band] || { type: el.band, name: el.band, height: 80, visible: true };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const dx = (moveEvent.clientX - resizingRef.current.startX) / (zoom / 100);
      const dy = (moveEvent.clientY - resizingRef.current.startY) / (zoom / 100);

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        resizingRef.current.hasResized = true;
      }

      let newW = Math.max(20, resizingRef.current.initialWidth + dx);
      let newH = Math.max(16, resizingRef.current.initialHeight + dy);

      if (gridSettings.enabled) {
        newW = AlignmentEngine.snapToGridValue(newW, gridSettings.size);
        newH = AlignmentEngine.snapToGridValue(newH, gridSettings.size);
      }

      setActiveDragHud({
        x: el.x,
        y: el.y,
        width: Math.round(newW),
        height: Math.round(newH),
        bandName: targetBand.name || targetBand.type,
        snapMessage: gridSettings.enabled ? `Resized to ${gridSettings.size}px Grid` : 'Resizing',
        isSnapped: gridSettings.enabled,
        deltaX: Math.round(newW - resizingRef.current.initialWidth),
        deltaY: Math.round(newH - resizingRef.current.initialHeight),
      });

      const latestEl: ReportElement = {
        ...el,
        width: Math.round(newW),
        height: Math.round(newH),
      };

      onUpdateElement(latestEl, `Resized ${el.name || el.type}`);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      resizingRef.current = null;
      setActiveDragHud(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Band Height Resizing Handler
  const handleMouseDownBandResize = (e: React.MouseEvent, bandType: BandType) => {
    e.stopPropagation();
    const currentBand = template.bands[bandType];
    bandResizeRef.current = {
      bandType,
      startY: e.clientY,
      initialHeight: currentBand?.height || 60,
      hasChanged: false,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!bandResizeRef.current) return;
      const dy = (moveEvent.clientY - bandResizeRef.current.startY) / (zoom / 100);
      let newHeight = Math.max(30, Math.round(bandResizeRef.current.initialHeight + dy));

      if (gridSettings.enabled) {
        newHeight = AlignmentEngine.snapToGridValue(newHeight, gridSettings.size);
      }

      if (Math.abs(dy) > 2) {
        bandResizeRef.current.hasChanged = true;
      }

      onUpdateBands({
        ...template.bands,
        [bandType]: {
          ...template.bands[bandType],
          height: newHeight,
        },
      }, `Adjusted ${template.bands[bandType]?.name || bandType} Height (${newHeight}px)`);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      bandResizeRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Helper for generating background grid style CSS
  const getGridOverlayStyle = () => {
    if (!gridSettings.enabled || gridSettings.style === 'off') {
      return {};
    }

    const sz = gridSettings.size;
    const op = gridSettings.opacity;

    if (gridSettings.style === 'dots') {
      return {
        backgroundImage: `radial-gradient(circle, rgba(14, 165, 233, ${op * 1.5}) 1px, transparent 1px)`,
        backgroundSize: `${sz}px ${sz}px`,
      };
    }

    if (gridSettings.style === 'lines') {
      const majorSz = sz * 4;
      return {
        backgroundImage: `
          linear-gradient(to right, rgba(14, 165, 233, ${op * 0.8}) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(14, 165, 233, ${op * 0.8}) 1px, transparent 1px),
          linear-gradient(to right, rgba(14, 165, 233, ${op * 1.5}) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(14, 165, 233, ${op * 1.5}) 1px, transparent 1px)
        `,
        backgroundSize: `${sz}px ${sz}px, ${sz}px ${sz}px, ${majorSz}px ${majorSz}px, ${majorSz}px ${majorSz}px`,
      };
    }

    if (gridSettings.style === 'crosshairs') {
      return {
        backgroundImage: `
          linear-gradient(to right, rgba(14, 165, 233, ${op}) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(14, 165, 233, ${op}) 1px, transparent 1px)
        `,
        backgroundSize: `${sz * 2}px ${sz * 2}px`,
      };
    }

    return {};
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col min-w-0 overflow-hidden select-none relative">
      {/* 1. TOP DESIGNER TOOLBAR: Undo/Redo, History Stack, Preview Options & Snapping */}
      <div className="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 z-30 shrink-0 shadow-sm">
        {/* Left: Spec info & Undo/Redo buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {/* Undo button */}
            <button
              id="designer-undo-btn"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo change (Ctrl+Z / ⌘Z)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                canUndo
                  ? 'text-slate-200 hover:bg-slate-800 hover:text-cyan-400 active:scale-95'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            {/* Redo button */}
            <button
              id="designer-redo-btn"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo change (Ctrl+Y / ⌘Y / ⌘Shift+Z)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                canRedo
                  ? 'text-slate-200 hover:bg-slate-800 hover:text-cyan-400 active:scale-95'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </button>
          </div>

          {/* History Stack Dropdown */}
          <div className="relative">
            <button
              id="designer-history-dropdown-btn"
              onClick={() => setIsHistoryDropdownOpen(!isHistoryDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition"
              title="View Undo/Redo Change Timeline"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[11px] text-cyan-300">
                Step {currentHistoryIndex + 1}/{history.length}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {/* Dropdown Menu */}
            {isHistoryDropdownOpen && (
              <div 
                className="absolute left-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Report History Stack</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {history.length} snapshots
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  {history.map((entry, idx) => {
                    const isCurrent = idx === currentHistoryIndex;
                    const isPast = idx < currentHistoryIndex;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => {
                          if (onJumpToHistoryIndex) {
                            onJumpToHistoryIndex(idx);
                            setIsHistoryDropdownOpen(false);
                          }
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                          isCurrent
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 font-semibold'
                            : isPast
                            ? 'text-slate-300 hover:bg-slate-800/80'
                            : 'text-slate-500 hover:bg-slate-800/50 italic'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isCurrent ? (
                            <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-700 shrink-0" />
                          )}
                          <span className="truncate">{entry.action}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                          #{idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="text-slate-400 hidden md:inline truncate max-w-xs font-medium">
            {lastAction}
          </span>
        </div>

        {/* Center: Auto-Arrange Band Elements with Constraint Algorithm Menu */}
        <div className="relative">
          <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 shadow-xs">
            <button
              id="designer-auto-arrange-btn"
              onClick={() => handleAutoArrange(activeBand, 'auto')}
              title={`Auto-Arrange & space out elements evenly in ${template.bands[activeBand]?.name || activeBand}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-300 hover:text-indigo-100 hover:bg-indigo-950/80 active:scale-95 transition group"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span>Auto-Arrange</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-mono hidden sm:inline">
                {template.bands[activeBand]?.name || activeBand} ({activeBandElementsCount})
              </span>
            </button>

            <button
              id="designer-auto-arrange-menu-btn"
              onClick={() => setIsAutoArrangeMenuOpen(!isAutoArrangeMenuOpen)}
              title="Auto-Arrange Constraint Layout Modes"
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Auto-Arrange Modes Dropdown Menu */}
          {isAutoArrangeMenuOpen && (
            <div 
              className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <span>Constraint Spacing</span>
                <span className="text-indigo-400 font-mono text-[9px]">{activeBand}</span>
              </div>

              <button
                onClick={() => {
                  handleAutoArrange(activeBand, 'auto');
                  setIsAutoArrangeMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-100">Smart Auto Spacing</div>
                  <div className="text-[10px] text-slate-400">Even horizontal spacing or wrapped rows</div>
                </div>
              </button>

              <button
                onClick={() => {
                  handleAutoArrange(activeBand, 'horizontal');
                  setIsAutoArrangeMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition"
              >
                <AlignJustify className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-100">Horizontal Single Row</div>
                  <div className="text-[10px] text-slate-400">Distribute equal gaps across canvas margins</div>
                </div>
              </button>

              <button
                onClick={() => {
                  handleAutoArrange(activeBand, 'grid');
                  setIsAutoArrangeMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-100">Multi-Row Grid Flow</div>
                  <div className="text-[10px] text-slate-400">Balanced wrapped grid with grid snapping</div>
                </div>
              </button>

              <button
                onClick={() => {
                  handleAutoArrange(activeBand, 'vertical');
                  setIsAutoArrangeMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition"
              >
                <Move className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-100">Vertical Column Stack</div>
                  <div className="text-[10px] text-slate-400">Even vertical spacing down the band</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Right: Preview Options, Grid Snapping, & Zoom controls */}
        <PreviewOptionsBar
          gridSettings={gridSettings}
          onUpdateGridSettings={setGridSettings}
          pageSettings={template.pageSettings}
          onUpdatePageSettings={onUpdatePageSettings}
          dataSources={template.dataSources}
          selectedDataSourceId={template.dataSources[0]?.id}
          zoom={zoom}
          onZoomChange={setZoom}
          onFitWidth={handleFitWidth}
          onFitWindow={handleFitWindow}
          onNavigateToPreview={onNavigateView ? () => onNavigateView('preview') : undefined}
          onOpenExportModal={onOpenExportModal}
        />
      </div>

      {/* 2. MAIN DESIGN & SPLIT PREVIEW WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Main: Visual Banded Designer Canvas */}
        <div 
          ref={canvasScrollRef}
          className="flex-1 overflow-auto p-12 flex justify-center items-start bg-slate-950/90 relative"
          onClick={() => {
            onSelectElement(null);
            setIsHistoryDropdownOpen(false);
            setIsAutoArrangeMenuOpen(false);
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        >
          {/* Canvas Wrapper with Rulers and Margins */}
          <div 
            ref={canvasElementRef}
            style={{ 
              width: `${canvasWidth}px`, 
              transform: `scale(${zoom / 100})`, 
              transformOrigin: 'top center',
              ...getGridOverlayStyle(),
            }}
            className="bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-300 flex flex-col relative transition-transform duration-75 min-h-[500px]"
          >
            {/* Watermark Overlay in Designer Canvas */}
            {((gridSettings.previewWatermark && gridSettings.previewWatermark !== 'none') || template.pageSettings.watermark?.enabled) && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
                <span
                  style={{
                    opacity: 0.08,
                    color: '#dc2626',
                    fontSize: '84px',
                    transform: 'rotate(-35deg)',
                  }}
                  className="font-extrabold tracking-widest uppercase border-4 border-red-600/20 px-8 py-4 rounded-3xl"
                >
                  {gridSettings.previewWatermark && gridSettings.previewWatermark !== 'none'
                    ? gridSettings.previewWatermark
                    : template.pageSettings.watermark?.text || 'DRAFT'}
                </span>
              </div>
            )}

            {/* Horizontal & Vertical Rulers */}
            {gridSettings.showRulers && (
              <CanvasRulers
                canvasWidth={canvasWidth}
                totalCanvasHeight={totalCanvasHeight}
                zoom={zoom}
                mousePos={mouseCanvasPos}
                selectedElement={selectedElement}
                gridSize={gridSettings.size}
              />
            )}

            {/* Printable Margins / Safe Area Outline */}
            {gridSettings.showMargins && (
              <div 
                style={{
                  top: `${template.pageSettings.margins.top * 3.78}px`,
                  left: `${template.pageSettings.margins.left * 3.78}px`,
                  right: `${template.pageSettings.margins.right * 3.78}px`,
                  bottom: `${template.pageSettings.margins.bottom * 3.78}px`,
                }}
                className="absolute border border-dashed border-amber-400/40 pointer-events-none z-10"
              >
                <span className="absolute top-1 left-1 text-[8px] font-mono text-amber-500 uppercase tracking-widest select-none opacity-60">
                  Print Margin ({template.pageSettings.margins.left}mm)
                </span>
              </div>
            )}

            {/* Active Magnetic Alignment Guide Lines (Snapped references) */}
            {activeGuides.map((g) => {
              if (g.type === 'vertical') {
                return (
                  <div
                    key={g.id}
                    style={{
                      left: `${g.position}px`,
                      top: 0,
                      bottom: 0,
                      backgroundColor: g.color || '#06b6d4',
                    }}
                    className="absolute w-px z-40 pointer-events-none shadow-sm"
                  >
                    {g.label && (
                      <span 
                        style={{ backgroundColor: g.color || '#06b6d4' }}
                        className="absolute top-2 left-1.5 text-[9px] font-bold text-slate-950 px-1.5 py-0.5 rounded shadow font-mono whitespace-nowrap"
                      >
                        {g.label}
                      </span>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={g.id}
                  style={{
                    top: `${g.position}px`,
                    left: 0,
                    right: 0,
                    backgroundColor: g.color || '#06b6d4',
                  }}
                  className="absolute h-px z-40 pointer-events-none shadow-sm"
                >
                  {g.label && (
                    <span 
                      style={{ backgroundColor: g.color || '#06b6d4' }}
                      className="absolute left-4 -top-3 text-[9px] font-bold text-slate-950 px-1.5 py-0.5 rounded shadow font-mono whitespace-nowrap"
                    >
                      {g.label}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Live Drag/Resize Floating HUD Badge */}
            {activeDragHud && (
              <div
                style={{
                  left: `${activeDragHud.x + activeDragHud.width / 2}px`,
                  top: `${Math.max(10, activeDragHud.y - 32)}px`,
                  transform: 'translateX(-50%)',
                }}
                className="absolute z-50 bg-slate-900/95 text-slate-100 border border-cyan-500 px-2.5 py-1 rounded-lg shadow-xl pointer-events-none flex items-center gap-2 font-mono text-[11px]"
              >
                <div className="flex items-center gap-1">
                  <span className="text-cyan-400 font-bold">X:{activeDragHud.x}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-cyan-400 font-bold">Y:{activeDragHud.y}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">{activeDragHud.width}×{activeDragHud.height}</span>
                </div>
                {activeDragHud.snapMessage && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold ${
                    activeDragHud.isSnapped
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {activeDragHud.snapMessage}
                  </span>
                )}
              </div>
            )}

            {/* Visual Watermark Preview on Canvas */}
            {template.pageSettings.watermark?.enabled && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
                <span
                  style={{
                    opacity: template.pageSettings.watermark.opacity,
                    color: template.pageSettings.watermark.color,
                    fontSize: `${template.pageSettings.watermark.fontSize}px`,
                    transform: `rotate(${template.pageSettings.watermark.rotation}deg)`,
                  }}
                  className="font-bold tracking-widest uppercase select-none"
                >
                  {template.pageSettings.watermark.text}
                </span>
              </div>
            )}

            {/* BAND SECTIONS (Crystal Reports Hierarchy Model) */}
            {BAND_ORDER.map((bandType) => {
              const band = template.bands[bandType];
              if (!band || !band.visible) return null;

              const bandMeta = BAND_COLORS[bandType];
              const isBandActive = activeBand === bandType;
              const isCollapsed = collapsedBands[bandType] || false;
              const bandElements = template.elements.filter((el) => el.band === bandType);

              return (
                <div
                  key={bandType}
                  id={`band-container-${bandType}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBand(bandType);
                  }}
                  style={{
                    height: isCollapsed ? '28px' : `${band.height}px`,
                    backgroundColor: band.backgroundColor || 'transparent',
                  }}
                  className={`relative border-b-2 ${bandMeta.border} transition-colors group/band ${
                    isBandActive ? 'ring-1 ring-cyan-500/50' : ''
                  }`}
                >
                  {/* Band Header Tag (Crystal Reports Section Label) */}
                  {gridSettings.showBandHeaders && (
                    <div className="absolute -top-3.5 left-2 z-20 flex items-center gap-1.5 pointer-events-auto">
                      <span
                        onClick={() => onSelectBand(bandType)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded shadow-sm border font-mono cursor-pointer uppercase flex items-center gap-1 ${bandMeta.badgeBg}`}
                      >
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCollapsedBands((prev) => ({ ...prev, [bandType]: !prev[bandType] }));
                          }}
                          className="hover:text-white cursor-pointer"
                          title={isCollapsed ? 'Expand Band' : 'Collapse Band'}
                        >
                          {isCollapsed ? '▶' : '▼'}
                        </span>
                        <span>{band.name || bandMeta.label} ({band.height}px)</span>
                      </span>

                      {/* Quick Auto-Arrange button for this band */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBand(bandType);
                          handleAutoArrange(bandType, 'auto');
                        }}
                        title={`Auto-arrange & evenly space all elements in ${band.name || bandMeta.label}`}
                        className="opacity-0 group-hover/band:opacity-100 transition-opacity ml-1 px-1.5 py-0.5 rounded bg-slate-950/90 hover:bg-indigo-950 text-indigo-300 hover:text-indigo-100 border border-indigo-700/60 flex items-center gap-1 font-sans text-[8px] font-bold shadow-xs cursor-pointer"
                      >
                        <LayoutGrid className="w-2.5 h-2.5 text-indigo-400" />
                        <span>Auto-Arrange</span>
                      </button>

                      {band.groupByField && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-mono">
                          Group By: {band.groupByField}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Elements inside this band */}
                  {!isCollapsed &&
                    bandElements.map((el) => {
                      const isSelected = selectedElementId === el.id;
                      const isLivePreview = gridSettings.dataPreviewMode === 'live';
                      const applyRules = gridSettings.showConditionalRulesPreview !== false;

                      // Evaluate conditional formatting rules dynamically
                      const ruleEval = applyRules
                        ? ConditionalFormattingEngine.evaluateElementRules(el, primaryRow, dataset)
                        : { style: {}, matchedRules: [], isHidden: false };

                      if (isLivePreview && ruleEval.isHidden) {
                        return null;
                      }

                      const mergedTextColor = ruleEval.style.color || el.style.textColor || '#0f172a';
                      const mergedBgColor = ruleEval.style.backgroundColor || el.style.backgroundColor || 'transparent';
                      const mergedFontWeight = (ruleEval.style.fontWeight as any) || el.style.fontWeight || 'normal';
                      const mergedFontStyle = (ruleEval.style.fontStyle as any) || el.style.fontStyle || 'normal';
                      const mergedBorderColor = ruleEval.style.borderColor || el.style.borderColor || 'transparent';
                      const mergedBorderWidth = ruleEval.style.borderWidth || `${el.style.borderWidth || 0}px`;

                      return (
                        <div
                          key={el.id}
                          id={`element-box-${el.id}`}
                          onMouseDown={(e) => handleMouseDownElement(e, el)}
                          style={{
                            left: `${el.x}px`,
                            top: `${el.y}px`,
                            width: `${el.width}px`,
                            height: `${el.height}px`,
                            fontSize: `${el.style.fontSize || 12}px`,
                            fontWeight: mergedFontWeight,
                            fontStyle: mergedFontStyle,
                            color: mergedTextColor,
                            backgroundColor: mergedBgColor,
                            borderColor: mergedBorderColor,
                            borderWidth: mergedBorderWidth,
                            borderRadius: `${el.style.borderRadius || 0}px`,
                            padding: `${el.style.padding || 0}px`,
                            textDecoration: ruleEval.style.textDecoration,
                          }}
                          className={`absolute z-10 cursor-move select-none transition-shadow overflow-hidden flex flex-col justify-center ${
                            isSelected
                              ? 'ring-2 ring-cyan-500 shadow-lg ring-offset-1 bg-cyan-50/20'
                              : gridSettings.showOutlines
                              ? 'hover:ring-1 hover:ring-slate-400 border border-dashed border-slate-200/80'
                              : ''
                          }`}
                        >
                          {/* Conditional Rules Indicator in Design Mode */}
                          {!isLivePreview && el.conditionalRules && el.conditionalRules.length > 0 && (
                            <div
                              className="absolute top-0.5 right-0.5 z-20 pointer-events-none flex items-center gap-0.5"
                              title={`${el.conditionalRules.length} Conditional Formatting Rules defined`}
                            >
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded shadow-xs flex items-center gap-0.5 font-mono ${
                                ruleEval.matchedRules.length > 0
                                  ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-600'
                                  : 'bg-slate-700 text-slate-200'
                              }`}>
                                <span>⚡</span>
                                <span>{ruleEval.matchedRules.length > 0 ? 'ACTIVE' : el.conditionalRules.length}</span>
                              </span>
                            </div>
                          )}

                          {/* Dynamic Element Renderers: Design vs Live Data Mode */}
                          {el.type === 'text' && (
                            <div className="w-full h-full flex items-center leading-tight whitespace-pre-wrap">
                              {ruleEval.icon === 'alert' && <span className="mr-1">⚠️</span>}
                              {ruleEval.icon === 'check' && <span className="mr-1 text-emerald-600">✓</span>}
                              {ruleEval.icon === 'trending-up' && <span className="mr-1 text-emerald-600">▲</span>}
                              {ruleEval.icon === 'trending-down' && <span className="mr-1 text-rose-600">▼</span>}
                              {ruleEval.icon === 'flame' && <span className="mr-1">🔥</span>}
                              {ruleEval.icon === 'zap' && <span className="mr-1">⚡</span>}
                              <span>{el.content}</span>
                            </div>
                          )}

                          {el.type === 'field' && (
                            <div className="w-full h-full flex items-center font-mono truncate">
                              {ruleEval.icon === 'alert' && <span className="mr-1">⚠️</span>}
                              {ruleEval.icon === 'check' && <span className="mr-1 text-emerald-600">✓</span>}
                              {ruleEval.icon === 'trending-up' && <span className="mr-1 text-emerald-600">▲</span>}
                              {ruleEval.icon === 'trending-down' && <span className="mr-1 text-rose-600">▼</span>}
                              {ruleEval.icon === 'zap' && <span className="mr-1">⚡</span>}
                              {isLivePreview ? (
                                <span className="font-semibold truncate">
                                  {FormulaEngine.formatValue(
                                    primaryRow[el.fieldBinding || ''] !== undefined
                                      ? primaryRow[el.fieldBinding || '']
                                      : `{${el.fieldBinding}}`,
                                    el.format,
                                    el.prefix,
                                    el.suffix
                                  )}
                                </span>
                              ) : (
                                <span className="text-cyan-800 font-medium">
                                  {'{' + (el.fieldBinding || 'field') + '}'}
                                </span>
                              )}
                            </div>
                          )}

                          {el.type === 'formula' && (
                            <div className="w-full h-full flex items-center font-mono truncate bg-purple-50/80 px-1 rounded border border-purple-200">
                              {ruleEval.icon === 'alert' && <span className="mr-1">⚠️</span>}
                              {isLivePreview ? (
                                <span className="font-bold text-purple-900">
                                  {FormulaEngine.formatValue(
                                    FormulaEngine.evaluate(el.formula || '', primaryRow, dataset),
                                    el.format,
                                    el.prefix,
                                    el.suffix
                                  )}
                                </span>
                              ) : (
                                <span className="text-purple-700 font-semibold">
                                  @fx: {el.formula || 'formula'}
                                </span>
                              )}
                            </div>
                          )}

                          {el.type === 'kpi' && (
                            <div className="w-full h-full p-2.5 flex flex-col justify-between">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-semibold">{el.kpiTitle || 'Metric'}</span>
                                {ruleEval.icon === 'alert' ? (
                                  <span className="text-rose-500 font-bold">⚠️ ALERT</span>
                                ) : (
                                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </div>
                              <div className="text-xl font-bold">
                                {el.formula
                                  ? FormulaEngine.formatValue(
                                      FormulaEngine.evaluate(el.formula, primaryRow, dataset),
                                      el.format,
                                      el.prefix,
                                      el.suffix
                                    )
                                  : isLivePreview
                                  ? FormulaEngine.formatValue(primaryRow[el.kpiValueField || 'gross_revenue'] || 825400, 'currency')
                                  : '$825,400'}
                              </div>
                              {el.kpiTrendField && (
                                <span className="text-[10px] text-emerald-600 font-medium">{el.kpiTrendField}</span>
                              )}
                            </div>
                          )}

                          {el.type === 'chart' && (
                            <div className="w-full h-full p-2 flex flex-col">
                              <span className="text-[10px] font-bold text-slate-700 mb-1">{el.chartTitle || 'Chart'}</span>
                              <div className="flex-1 w-full min-h-0 pointer-events-none">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={dataset.slice(0, 6)}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="region" tick={{ fontSize: 9 }} />
                                    <YAxis tick={{ fontSize: 9 }} />
                                    <Bar dataKey="gross_revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {el.type === 'table' && (
                            <div className="w-full h-full border border-slate-300 rounded overflow-hidden flex flex-col text-xs">
                              {/* Table Header */}
                              <div className="bg-slate-100 border-b border-slate-300 flex font-semibold text-slate-700 py-1.5 px-2">
                                {el.columns?.map((c) => (
                                  <div key={c.id} style={{ width: `${c.width}%` }} className={`text-${c.align || 'left'} truncate pr-1`}>
                                    {c.header}
                                  </div>
                                ))}
                              </div>
                              {/* Preview Sample Rows */}
                              {(isLivePreview ? dataset.slice(0, 3) : [primaryRow]).map((row, rIdx) => (
                                <div key={rIdx} className="flex py-1.5 px-2 text-slate-600 border-b border-slate-100 bg-white">
                                  {el.columns?.map((c) => {
                                    const rawVal = row[c.field];
                                    const colRuleEval = applyRules && c.conditionalRules
                                      ? ConditionalFormattingEngine.evaluateColumnRules(c, rawVal, row, dataset)
                                      : { style: {} };

                                    return (
                                      <div
                                        key={c.id}
                                        style={{
                                          width: `${c.width}%`,
                                          color: colRuleEval.style.color,
                                          backgroundColor: colRuleEval.style.backgroundColor,
                                          fontWeight: colRuleEval.style.fontWeight as any,
                                          fontStyle: colRuleEval.style.fontStyle as any,
                                        }}
                                        className={`text-${c.align || 'left'} font-mono truncate pr-1 px-1 rounded`}
                                      >
                                        {FormulaEngine.formatValue(rawVal, c.format)}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                              {/* Subtotal Row */}
                              {el.showTableFooter && (
                                <div className="mt-auto bg-slate-50 border-t border-slate-200 flex font-bold text-slate-800 py-1 px-2">
                                  <div style={{ width: '40%' }}>SUMMARY TOTAL</div>
                                  <div style={{ width: '60%' }} className="text-right font-mono text-cyan-700">$825,400.00</div>
                                </div>
                              )}
                            </div>
                          )}

                          {el.type === 'qrcode' && (
                            <div className="w-full h-full flex items-center justify-center p-1 bg-white border border-slate-200">
                              <QrIcon className="w-full h-full text-slate-900" />
                            </div>
                          )}

                          {/* Resize handle when selected */}
                          {isSelected && (
                            <div
                              onMouseDown={(e) => handleMouseDownResize(e, el)}
                              className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-cyan-600 cursor-se-resize rounded-tl z-30 shadow flex items-center justify-center"
                              title="Drag to resize element (snaps to grid)"
                            >
                              <div className="w-1 h-1 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Band Height Resize Handle (Drag to adjust band height) */}
                  <div
                    onMouseDown={(e) => handleMouseDownBandResize(e, bandType)}
                    className="absolute bottom-0 left-0 right-0 h-2 bg-transparent hover:bg-cyan-500/30 cursor-row-resize z-20 transition-colors"
                    title={`Drag to resize ${band.name || bandType} height`}
                  />
                </div>
              );
            })}
          </div>

          {/* Precision Alignment Bar (Floating at bottom-center when element is selected) */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <PrecisionAlignmentBar
              selectedElement={selectedElement}
              activeBand={selectedBandObj}
              canvasWidth={canvasWidth}
              gridSettings={gridSettings}
              onUpdateElement={onUpdateElement}
              onDeleteElement={onDeleteElement || (() => {})}
              onDuplicateElement={onDuplicateElement || (() => {})}
              onAutoArrangeBand={handleAutoArrange}
            />
          </div>
        </div>

        {/* Right Pane: SPLIT VIEW Live Report Synchronization */}
        {gridSettings.viewLayout === 'split' && (
          <div className="w-1/2 border-l border-slate-800 bg-slate-900/90 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Split View Header */}
            <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-xs text-slate-200">Real-Time Render Preview</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                  Sync Active
                </span>
                {gridSettings.previewWatermark && gridSettings.previewWatermark !== 'none' && (
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-mono">
                    {gridSettings.previewWatermark}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onNavigateView && (
                  <button
                    onClick={() => onNavigateView('preview')}
                    className="text-xs px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition flex items-center gap-1 font-semibold"
                  >
                    <span>Full Preview</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setGridSettings((prev) => ({ ...prev, viewLayout: 'single' }))}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded hover:bg-slate-800"
                >
                  Close Split View
                </button>
              </div>
            </div>

            {/* Split View Render Body */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-950">
              <div 
                style={{ width: `${canvasWidth * 0.85}px` }}
                className="bg-white text-slate-900 rounded-xl shadow-xl p-6 flex flex-col space-y-4 border border-slate-200 relative overflow-hidden"
              >
                {/* Watermark in Split View */}
                {((gridSettings.previewWatermark && gridSettings.previewWatermark !== 'none') || template.pageSettings.watermark?.enabled) && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
                    <span
                      style={{
                        opacity: 0.1,
                        color: '#dc2626',
                        fontSize: '64px',
                        transform: 'rotate(-35deg)',
                      }}
                      className="font-extrabold tracking-widest uppercase border-4 border-red-600/20 px-6 py-2 rounded-2xl"
                    >
                      {gridSettings.previewWatermark && gridSettings.previewWatermark !== 'none'
                        ? gridSettings.previewWatermark
                        : template.pageSettings.watermark?.text || 'DRAFT'}
                    </span>
                  </div>
                )}

                {/* Header preview */}
                <div className="border-b border-slate-200 pb-4 flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{template.name}</h2>
                    <p className="text-xs text-slate-500">{template.description}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400 font-mono">
                    <div>DATE: {new Date().toLocaleDateString()}</div>
                    <div>PAGE 1 OF 1</div>
                  </div>
                </div>

                {/* KPI Cards summary */}
                <div className="grid grid-cols-3 gap-3 relative z-10">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Gross Revenue</div>
                    <div className="text-lg font-bold text-slate-900 font-mono">
                      {FormulaEngine.formatValue(
                        dataset.reduce((sum, r) => sum + (Number(r.gross_revenue) || 0), 0) || 825400,
                        'currency'
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Net Profit</div>
                    <div className="text-lg font-bold text-emerald-600 font-mono">
                      {FormulaEngine.formatValue(
                        dataset.reduce((sum, r) => sum + (Number(r.net_profit) || 0), 0) || 312800,
                        'currency'
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Records</div>
                    <div className="text-lg font-bold text-slate-900 font-mono">{dataset.length} Rows</div>
                  </div>
                </div>

                {/* Live Chart Preview */}
                <div className="h-44 border border-slate-200 rounded-lg p-3 bg-white relative z-10">
                  <div className="text-xs font-bold text-slate-700 mb-2">Regional Performance Breakdown</div>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={dataset.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Bar dataKey="gross_revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table Data Preview */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs relative z-10">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Invoice / ID</th>
                        <th className="p-2">Customer / Entity</th>
                        <th className="p-2">Region</th>
                        <th className="p-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataset.slice(0, gridSettings.previewRecordLimit || 6).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-cyan-800">{row.order_number || `#INV-${1000 + i}`}</td>
                          <td className="p-2 font-medium text-slate-800">{row.customer_name || row.employee_name || 'Enterprise Client'}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-semibold">
                              {row.region || row.department || 'Global'}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono font-semibold text-slate-900">
                            {FormulaEngine.formatValue(row.gross_revenue || row.total_compensation || 12400, 'currency')}
                          </td>
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
