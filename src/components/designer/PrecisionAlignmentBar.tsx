import React from 'react';
import { 
  ReportElement, 
  ReportBand, 
  BandType 
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
  Magnet, 
  Copy, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid
} from 'lucide-react';

interface PrecisionAlignmentBarProps {
  selectedElement: ReportElement | null;
  activeBand: ReportBand | null;
  canvasWidth: number;
  gridSettings?: GridSettings;
  onUpdateElement: (el: ReportElement, actionDesc?: string) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (el: ReportElement) => void;
  onAutoArrangeBand?: (bandType: BandType) => void;
}

export const PrecisionAlignmentBar: React.FC<PrecisionAlignmentBarProps> = ({
  selectedElement,
  activeBand,
  canvasWidth,
  gridSettings = DEFAULT_GRID_SETTINGS,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAutoArrangeBand,
}) => {
  if (!selectedElement || !activeBand) return null;

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
      activeBand,
      canvasWidth,
      gridSettings.size
    );
    const actionLabels: Record<string, string> = {
      'align-left': 'Align Left Margin',
      'align-center': 'Center Horizontally',
      'align-right': 'Align Right Margin',
      'align-top': 'Align Top of Band',
      'align-middle': 'Center Vertically in Band',
      'align-bottom': 'Align Bottom of Band',
      'expand-width': 'Expand to Band Width',
      'snap-to-grid': `Snapped to ${gridSettings.size}px Grid`,
    };
    onUpdateElement(updated, actionLabels[action] || 'Aligned Element');
  };

  const handleNudge = (dx: number, dy: number) => {
    const step = gridSettings.enabled ? gridSettings.size : 1;
    const updated: ReportElement = {
      ...selectedElement,
      x: Math.max(0, selectedElement.x + dx * step),
      y: Math.max(0, selectedElement.y + dy * step),
    };
    onUpdateElement(updated, `Nudged ${selectedElement.name || selectedElement.type}`);
  };

  return (
    <div 
      id="precision-alignment-bar"
      className="bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-1 text-xs text-slate-200 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {/* Selected Element Pill & Coordinates */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px]">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
        <span className="font-semibold text-cyan-300 truncate max-w-[90px]">
          {selectedElement.name || selectedElement.type}
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

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Horizontal Alignment Group */}
      <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80">
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

      {/* Vertical Alignment Group */}
      <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80">
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

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Stretch & Snap Actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handleAlign('expand-width')}
          title="Expand Width to Band Margins (Full Width)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition text-[11px]"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Full Width</span>
        </button>

        <button
          onClick={() => handleAlign('snap-to-grid')}
          title={`Snap element position & size to ${gridSettings.size}px grid`}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 transition text-[11px]"
        >
          <Grid className="w-3 h-3" />
          <span>Snap to {gridSettings.size}px</span>
        </button>

        {onAutoArrangeBand && (
          <button
            onClick={() => onAutoArrangeBand(activeBand.type)}
            title={`Auto-arrange and evenly space all elements in ${activeBand.name || activeBand.type}`}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition text-[11px] font-medium"
          >
            <LayoutGrid className="w-3 h-3 text-indigo-400" />
            <span>Auto-Arrange</span>
          </button>
        )}
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Arrow Nudge Pad */}
      <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80">
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

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Duplicate & Delete */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onDuplicateElement(selectedElement)}
          title="Duplicate Element (Ctrl+D)"
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDeleteElement(selectedElement.id)}
          title="Delete Element (Del / Backspace)"
          className="p-1.5 rounded-lg hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
