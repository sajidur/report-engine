import React from 'react';
import { 
  Type, 
  Database, 
  Calculator, 
  Table, 
  BarChart3, 
  Activity, 
  QrCode, 
  Image as ImageIcon, 
  Minus, 
  Square,
  Plus
} from 'lucide-react';
import { ElementType, BandType } from '../../types/report';

interface ElementPaletteProps {
  onAddElement: (type: ElementType, band: BandType) => void;
  activeBand: BandType;
}

const TOOLBOX_ITEMS = [
  {
    type: 'text' as ElementType,
    label: 'Text Label',
    desc: 'Static title, header, or annotation',
    icon: Type,
    defaultBand: 'reportHeader' as BandType,
  },
  {
    type: 'field' as ElementType,
    label: 'Database Field',
    desc: 'Binds to MySQL schema column',
    icon: Database,
    defaultBand: 'details' as BandType,
  },
  {
    type: 'formula' as ElementType,
    label: 'Formula Field',
    desc: 'Crystal expression or calculated metric',
    icon: Calculator,
    defaultBand: 'groupFooter' as BandType,
  },
  {
    type: 'table' as ElementType,
    label: 'Banded Data Grid',
    desc: 'Multi-column tabular data with subtotals',
    icon: Table,
    defaultBand: 'details' as BandType,
  },
  {
    type: 'chart' as ElementType,
    label: 'Real-time Chart',
    desc: 'Bar, line, area, or donut visualizer',
    icon: BarChart3,
    defaultBand: 'pageHeader' as BandType,
  },
  {
    type: 'kpi' as ElementType,
    label: 'KPI Metric Card',
    desc: 'Executive card with trend & icon',
    icon: Activity,
    defaultBand: 'pageHeader' as BandType,
  },
  {
    type: 'qrcode' as ElementType,
    label: 'QR / Barcode',
    desc: 'Dynamic invoice or audit verification code',
    icon: QrCode,
    defaultBand: 'reportHeader' as BandType,
  },
  {
    type: 'line' as ElementType,
    label: 'Divider Rule',
    desc: 'Horizontal section separator line',
    icon: Minus,
    defaultBand: 'details' as BandType,
  },
  {
    type: 'shape' as ElementType,
    label: 'Callout Container',
    desc: 'Card or highlight background shape',
    icon: Square,
    defaultBand: 'pageHeader' as BandType,
  },
];

export const ElementPalette: React.FC<ElementPaletteProps> = ({ onAddElement, activeBand }) => {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4 select-none overflow-y-auto">
      <div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Component Palette</span>
          <span className="text-[10px] text-cyan-400 font-mono">Toolbox</span>
        </h3>
        <p className="text-[11px] text-slate-400">
          Insert report items into <span className="text-cyan-300 font-semibold">{activeBand}</span>
        </p>
      </div>

      <div className="space-y-1.5">
        {TOOLBOX_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              id={`toolbox-btn-${item.type}`}
              onClick={() => onAddElement(item.type, activeBand || item.defaultBand)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/90 border border-slate-800/80 hover:border-cyan-500/40 text-left transition group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 border border-slate-800 group-hover:border-cyan-500/30 flex items-center justify-center text-slate-400 transition">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-200 truncate">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
            </button>
          );
        })}
      </div>

      {/* Band Quick Navigator */}
      <div className="mt-auto pt-3 border-t border-slate-800/80">
        <div className="text-[10px] uppercase font-semibold text-slate-500 mb-2">
          Crystal Report Bands
        </div>
        <div className="text-[11px] text-slate-400 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Report Header</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Page Header (KPIs)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Group Header (Subtotals)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Details (MySQL Rows)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Report Footer (Totals)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
