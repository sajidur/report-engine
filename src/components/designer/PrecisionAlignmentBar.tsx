import React, { useState, useRef, useEffect } from 'react';
import { 
  ReportElement, 
  ReportBand, 
  BandType,
  ReportDataSource,
  DataSourceField,
  TableColumn
} from '../../types/report';
import { AlignmentEngine, GridSettings, DEFAULT_GRID_SETTINGS } from '../../services/alignmentEngine';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignVerticalSpaceAround, 
  ArrowUpToLine, 
  ArrowDownToLine, 
  Maximize2, 
  Grid, 
  Copy, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid,
  Database,
  Globe,
  DollarSign,
  Hash,
  Calendar,
  CheckCircle2,
  Type,
  Sparkles,
  Table as TableIcon,
  Plus,
  Sliders,
  Check
} from 'lucide-react';

interface PrecisionAlignmentBarProps {
  selectedElement: ReportElement | null;
  allElements?: ReportElement[];
  activeBand: ReportBand | BandType | null;
  canvasWidth: number;
  bandHeight?: number;
  templateBands?: Record<BandType, ReportBand>;
  gridSettings?: GridSettings;
  dataSource?: ReportDataSource;
  onUpdateElement: (el: ReportElement, actionDesc?: string) => void;
  onUpdateMultipleElements?: (
    updatedElements: ReportElement[],
    actionLabel?: string,
    updatedBandHeight?: { bandType: BandType; height: number }
  ) => void;
  onDeleteElement?: (id: string) => void;
  onDuplicateElement?: (el: ReportElement) => void;
  onAutoArrangeBand?: (bandType: BandType) => void;
  onAutoArrange?: (bandType: BandType) => void;
  onOpenApiModal?: () => void;
}

export const PrecisionAlignmentBar: React.FC<PrecisionAlignmentBarProps> = ({
  selectedElement,
  allElements,
  activeBand,
  canvasWidth,
  bandHeight = 100,
  templateBands,
  gridSettings = DEFAULT_GRID_SETTINGS,
  dataSource,
  onUpdateElement,
  onUpdateMultipleElements,
  onDeleteElement,
  onDuplicateElement,
  onAutoArrangeBand,
  onAutoArrange,
  onOpenApiModal,
}) => {
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFieldDropdownOpen(false);
        setIsFormatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!selectedElement || !activeBand) return null;

  // Resolve active band object whether passed as a string or object
  const activeBandObj: ReportBand = 
    typeof activeBand === 'string'
      ? (templateBands ? templateBands[activeBand] : null) || {
          id: activeBand,
          type: activeBand,
          name: activeBand,
          height: bandHeight,
          visible: true,
        }
      : activeBand;

  const currentBandType: BandType = 
    typeof activeBand === 'string' ? activeBand : activeBand.type;

  const fields = dataSource?.fields || [];
  const isApi = dataSource?.type === 'rest';

  const handleAlign = (
    action:
      | 'align-left'
      | 'align-center'
      | 'align-right'
      | 'align-top'
      | 'align-middle'
      | 'align-bottom'
      | 'expand-width'
      | 'snap-to-grid'
  ) => {
    const updated = AlignmentEngine.alignElement(
      selectedElement,
      action,
      activeBandObj,
      canvasWidth,
      gridSettings.size || 8
    );
    const actionLabels: Record<string, string> = {
      'align-left': 'Align Left Margin',
      'align-center': 'Center Horizontally',
      'align-right': 'Align Right Margin',
      'align-top': 'Align Top of Band',
      'align-middle': 'Center Vertically in Band',
      'align-bottom': 'Align Bottom of Band',
      'expand-width': 'Expand to Band Width',
      'snap-to-grid': `Snapped to ${gridSettings.size || 8}px Grid`,
    };
    onUpdateElement(updated, actionLabels[action] || 'Aligned Element');
  };

  const handleNudge = (dx: number, dy: number) => {
    const step = gridSettings.enabled ? (gridSettings.size || 8) : 1;
    const updated: ReportElement = {
      ...selectedElement,
      x: Math.max(0, selectedElement.x + dx * step),
      y: Math.max(0, selectedElement.y + dy * step),
    };
    onUpdateElement(updated, `Nudged ${selectedElement.name || selectedElement.type}`);
  };

  const handleAssignField = (field: DataSourceField) => {
    setIsFieldDropdownOpen(false);

    if (selectedElement.type === 'field') {
      const updated: ReportElement = {
        ...selectedElement,
        name: field.displayName || field.name,
        fieldBinding: field.name,
        format: field.type === 'currency' ? 'currency' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'none',
      };
      onUpdateElement(updated, `Bound to API Field: ${field.name}`);
    } else if (selectedElement.type === 'text') {
      const updated: ReportElement = {
        ...selectedElement,
        content: field.displayName || field.name,
      };
      onUpdateElement(updated, `Set Label: ${field.name}`);
    } else if (selectedElement.type === 'table') {
      // Add column for this field
      const currentCols = selectedElement.columns || [];
      const newCol: TableColumn = {
        id: `col-${Date.now()}`,
        header: field.displayName || field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        field: field.name,
        width: Math.floor(100 / (currentCols.length + 1)),
        align: field.type === 'currency' || field.type === 'number' ? 'right' : 'left',
        format: field.type === 'currency' ? 'currency' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text',
        summaryType: field.type === 'currency' || field.type === 'number' ? 'sum' : 'none',
      };
      const updated: ReportElement = {
        ...selectedElement,
        columns: [...currentCols, newCol],
      };
      onUpdateElement(updated, `Added ${field.name} column to Table`);
    } else if (selectedElement.type === 'kpi') {
      const updated: ReportElement = {
        ...selectedElement,
        kpiTitle: field.displayName || field.name,
        formula: field.type === 'number' || field.type === 'currency' ? `SUM(${field.name})` : `COUNT(${field.name})`,
        format: field.type === 'currency' ? 'currency' : field.type === 'number' ? 'number' : 'none',
      };
      onUpdateElement(updated, `Updated KPI: ${field.name}`);
    } else if (selectedElement.type === 'chart') {
      const updated: ReportElement = {
        ...selectedElement,
        yAxisFields: [field.name],
        chartTitle: `${field.displayName || field.name} Distribution`,
      };
      onUpdateElement(updated, `Chart bound to ${field.name}`);
    }
  };

  const handleAutoPopulateTableColumns = () => {
    if (selectedElement.type !== 'table' || fields.length === 0) return;
    const newCols: TableColumn[] = fields.map((f, idx) => ({
      id: `col-${idx + 1}`,
      header: f.displayName || f.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      field: f.name,
      width: Math.floor(100 / Math.min(fields.length, 6)),
      align: f.type === 'currency' || f.type === 'number' ? 'right' : 'left',
      format: f.type === 'currency' ? 'currency' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text',
      summaryType: f.type === 'currency' || f.type === 'number' ? 'sum' : 'none',
    }));

    const updated: ReportElement = {
      ...selectedElement,
      columns: newCols,
      showTableFooter: true,
    };
    onUpdateElement(updated, `Populated Table with ${newCols.length} API Columns`);
    setIsFieldDropdownOpen(false);
  };

  const handleSetFormat = (fmt: string) => {
    setIsFormatDropdownOpen(false);
    const updated: ReportElement = {
      ...selectedElement,
      format: fmt,
    };
    onUpdateElement(updated, `Set Format: ${fmt}`);
  };

  const getFieldIcon = (type: DataSourceField['type']) => {
    switch (type) {
      case 'currency':
        return <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />;
      case 'number':
        return <Hash className="w-3 h-3 text-cyan-400 shrink-0" />;
      case 'date':
        return <Calendar className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'boolean':
        return <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />;
      default:
        return <Type className="w-3 h-3 text-slate-400 shrink-0" />;
    }
  };

  const arrangeFn = onAutoArrangeBand || onAutoArrange;

  return (
    <div 
      id="precision-alignment-bar"
      ref={dropdownRef}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-1.5 text-xs text-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[95vw] overflow-x-auto"
    >
      {/* Selected Element Pill & Coordinates */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${
          selectedElement.type === 'table' ? 'bg-amber-400' : 'bg-cyan-400'
        }`} />
        <span className="font-semibold text-cyan-300 truncate max-w-[100px]">
          {selectedElement.name || selectedElement.type.toUpperCase()}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">
          X:<strong className="text-slate-200">{selectedElement.x}</strong> Y:<strong className="text-slate-200">{selectedElement.y}</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">
          {selectedElement.width}×{selectedElement.height}
        </span>
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />

      {/* 1. ASSIGN API DATA FIELD (Direct Option in Visual Design) */}
      <div className="relative shrink-0">
        <button
          onClick={() => {
            setIsFieldDropdownOpen(!isFieldDropdownOpen);
            setIsFormatDropdownOpen(false);
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition ${
            selectedElement.fieldBinding || selectedElement.type === 'table'
              ? 'bg-cyan-950/80 border-cyan-700 text-cyan-200 shadow-xs'
              : 'bg-slate-950/70 border-slate-800 hover:border-cyan-600 text-slate-300 hover:text-cyan-300'
          }`}
          title="Assign or bind data field directly from API"
        >
          {isApi ? <Globe className="w-3.5 h-3.5 text-cyan-400" /> : <Database className="w-3.5 h-3.5 text-amber-400" />}
          <span className="font-semibold">
            {selectedElement.type === 'table'
              ? `Table (${selectedElement.columns?.length || 0} Cols)`
              : selectedElement.fieldBinding
              ? selectedElement.fieldBinding
              : 'Assign API Field'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Dropdown Menu for API Data Fields */}
        {isFieldDropdownOpen && (
          <div className="absolute bottom-full mb-2 left-0 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5">
              <span className="font-bold text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Assign from API / Schema</span>
              </span>
              {onOpenApiModal && (
                <button
                  onClick={() => {
                    setIsFieldDropdownOpen(false);
                    onOpenApiModal();
                  }}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Configure API
                </button>
              )}
            </div>

            {selectedElement.type === 'table' && (
              <div className="mb-2 p-1 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <button
                  onClick={handleAutoPopulateTableColumns}
                  className="w-full flex items-center justify-center gap-1.5 p-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-200 font-semibold border border-cyan-800 transition text-[11px]"
                >
                  <TableIcon className="w-3 h-3 text-cyan-400" />
                  <span>Auto-Fill All API Columns</span>
                </button>
                <div className="text-[10px] text-slate-400 px-1">
                  Or click any field below to append as a new column:
                </div>
              </div>
            )}

            <div className="max-h-56 overflow-y-auto space-y-1">
              {fields.length === 0 ? (
                <div className="p-2 text-center text-slate-500 italic">
                  No API schema fields available
                </div>
              ) : (
                fields.map((f) => {
                  const isCurrent = selectedElement.fieldBinding === f.name;
                  return (
                    <button
                      key={f.name}
                      onClick={() => handleAssignField(f)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition font-mono text-[11px] ${
                        isCurrent
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {getFieldIcon(f.type)}
                        <span className="truncate">{f.displayName || f.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase shrink-0">
                        {f.type}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. QUICK FORMAT SELECTOR (Currency, Number, Date, Text) */}
      <div className="relative shrink-0">
        <button
          onClick={() => {
            setIsFormatDropdownOpen(!isFormatDropdownOpen);
            setIsFieldDropdownOpen(false);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition text-xs"
          title="Format data value (Currency, Number, Date, etc.)"
        >
          <Sliders className="w-3 h-3 text-slate-400" />
          <span className="font-mono text-[11px]">
            {selectedElement.format || 'none'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isFormatDropdownOpen && (
          <div className="absolute bottom-full mb-2 left-0 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
            {[
              { id: 'none', label: 'Plain Text' },
              { id: 'currency', label: 'Currency ($1,234.56)' },
              { id: 'number', label: 'Number (1,234.56)' },
              { id: 'percentage', label: 'Percent (12.5%)' },
              { id: 'date', label: 'Date (YYYY-MM-DD)' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => handleSetFormat(fmt.id)}
                className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition text-[11px] ${
                  (selectedElement.format || 'none') === fmt.id
                    ? 'bg-cyan-950 text-cyan-300 font-bold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{fmt.label}</span>
                {(selectedElement.format || 'none') === fmt.id && (
                  <Check className="w-3 h-3 text-cyan-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />

      {/* 3. HORIZONTAL ALIGNMENT GROUP */}
      <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 shrink-0">
        <button
          onClick={() => handleAlign('align-left')}
          title="Align Left (16px canvas margin)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('align-center')}
          title="Center Horizontally on Canvas"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('align-right')}
          title="Align Right (16px canvas margin)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. VERTICAL ALIGNMENT GROUP */}
      <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 shrink-0">
        <button
          onClick={() => handleAlign('align-top')}
          title="Align to Top of Band"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition"
        >
          <ArrowUpToLine className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('align-middle')}
          title="Center Vertically inside Band"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition"
        >
          <AlignVerticalSpaceAround className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('align-bottom')}
          title="Align to Bottom of Band"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SNAP TO GRID BUTTON */}
      <button
        id="btn-bar-snap-to-grid"
        onClick={() => handleAlign('snap-to-grid')}
        title={`Snap position and dimensions to ${gridSettings.size}px grid`}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/70 text-cyan-200 transition text-[11px] font-semibold shrink-0 shadow-xs active:scale-95"
      >
        <Grid className="w-3.5 h-3.5 text-cyan-400" />
        <span>Snap to Grid</span>
        <span className="font-mono text-[9px] bg-cyan-900/90 text-cyan-300 px-1 py-0.2 rounded border border-cyan-700/50">
          {gridSettings.size}px
        </span>
      </button>

      <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />

      {/* 5. STRETCH & AUTO-ARRANGE */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => handleAlign('expand-width')}
          title="Expand Width to Band Margins (Full Width)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition text-[11px]"
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">Full Width</span>
        </button>

        {arrangeFn && (
          <button
            onClick={() => arrangeFn(currentBandType)}
            title={`Auto-arrange and evenly space all elements in ${activeBandObj.name || currentBandType}`}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition text-[11px] font-medium"
          >
            <LayoutGrid className="w-3 h-3 text-indigo-400" />
            <span className="hidden md:inline">Auto-Arrange</span>
          </button>
        )}
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />

      {/* 6. NUDGE ARROWS */}
      <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 shrink-0">
        <button
          onClick={() => handleNudge(-1, 0)}
          title="Nudge Left"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleNudge(0, -1)}
          title="Nudge Up"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleNudge(0, 1)}
          title="Nudge Down"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleNudge(1, 0)}
          title="Nudge Right"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />

      {/* 7. DUPLICATE & DELETE */}
      <div className="flex items-center gap-0.5 shrink-0">
        {onDuplicateElement && (
          <button
            onClick={() => onDuplicateElement(selectedElement)}
            title="Duplicate Element (Ctrl+D)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
        {onDeleteElement && (
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            title="Delete Element (Del / Backspace)"
            className="p-1.5 rounded-lg hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
