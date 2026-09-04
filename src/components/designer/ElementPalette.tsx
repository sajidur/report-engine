import React, { useState } from 'react';
import { 
  Type, 
  Database, 
  Calculator, 
  Table, 
  BarChart3, 
  Activity, 
  QrCode, 
  Minus, 
  Square,
  Plus,
  Globe,
  DollarSign,
  Hash,
  Calendar,
  CheckCircle2,
  Sparkles,
  Search,
  Sliders,
  Columns
} from 'lucide-react';
import { ElementType, BandType, ReportDataSource, DataSourceField, ReportElement } from '../../types/report';

interface ElementPaletteProps {
  onAddElement: (type: ElementType, band: BandType, fieldBinding?: string) => void;
  activeBand: BandType;
  dataSource?: ReportDataSource;
  selectedElement?: ReportElement | null;
  onAddTableFromApi?: () => void;
  onAddColumnToSelectedTable?: (fieldName: string, fieldType: string) => void;
  onNavigateToDataSources?: () => void;
  onOpenApiModal?: () => void;
}

const TOOLBOX_ITEMS = [
  {
    type: 'table' as ElementType,
    label: 'Table Control',
    desc: 'Crystal Reports multi-column grid with subtotals',
    icon: Table,
    defaultBand: 'details' as BandType,
    badge: 'Table Type',
  },
  {
    type: 'field' as ElementType,
    label: 'Data Field',
    desc: 'Binds to API field or SQL column',
    icon: Database,
    defaultBand: 'details' as BandType,
    badge: 'API Bound',
  },
  {
    type: 'text' as ElementType,
    label: 'Text Label',
    desc: 'Static title, header, or annotation',
    icon: Type,
    defaultBand: 'reportHeader' as BandType,
  },
  {
    type: 'formula' as ElementType,
    label: 'Formula Field',
    desc: 'Crystal expression or calculated metric',
    icon: Calculator,
    defaultBand: 'groupFooter' as BandType,
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

export const ElementPalette: React.FC<ElementPaletteProps> = ({ 
  onAddElement, 
  activeBand,
  dataSource,
  selectedElement,
  onAddTableFromApi,
  onAddColumnToSelectedTable,
  onNavigateToDataSources,
  onOpenApiModal,
}) => {
  const [fieldSearch, setFieldSearch] = useState('');
  const fields = dataSource?.fields || [];
  const isApiDs = dataSource?.type === 'rest';

  const filteredFields = fields.filter((f) => {
    const q = fieldSearch.toLowerCase();
    const dName = f.displayName || (f as any).label || '';
    return f.name.toLowerCase().includes(q) || dName.toLowerCase().includes(q);
  });

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

  const isTableSelected = selectedElement?.type === 'table';

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 p-3.5 flex flex-col gap-3.5 select-none overflow-y-auto">
      <div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-0.5 flex items-center justify-between">
          <span>Component Palette</span>
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
            Toolbox
          </span>
        </h3>
        <p className="text-[11px] text-slate-400">
          Target Band: <span className="text-cyan-300 font-semibold">{activeBand}</span>
        </p>
      </div>

      {/* Components list */}
      <div className="space-y-1.5">
        {TOOLBOX_ITEMS.map((item) => {
          const Icon = item.icon;
          const isTable = item.type === 'table';
          return (
            <button
              key={item.type}
              id={`toolbox-btn-${item.type}`}
              onClick={() => onAddElement(item.type, activeBand || item.defaultBand)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition group shadow-xs border ${
                isTable
                  ? 'bg-gradient-to-r from-cyan-950/70 to-slate-950 border-cyan-700/60 hover:border-cyan-400'
                  : 'bg-slate-950/60 hover:bg-slate-800/90 border-slate-800/80 hover:border-cyan-500/40'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition shrink-0 ${
                isTable 
                  ? 'bg-cyan-950 border-cyan-600 text-cyan-300' 
                  : 'bg-slate-900 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 border-slate-800 group-hover:border-cyan-500/30 text-slate-400'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold truncate ${
                    isTable ? 'text-cyan-200' : 'text-slate-200 group-hover:text-cyan-200'
                  }`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Active Data Source & Available API Fields Section */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
            {isApiDs ? <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            <span className="truncate max-w-[110px]" title={dataSource?.name}>
              {dataSource?.name || 'Active Schema'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {onOpenApiModal && (
              <button
                onClick={onOpenApiModal}
                className="text-[10px] text-cyan-400 hover:text-cyan-200 font-semibold px-1 py-0.5 rounded hover:bg-slate-800 transition"
                title="Configure API Endpoint & Headers"
              >
                API
              </button>
            )}
            {onNavigateToDataSources && (
              <button
                onClick={onNavigateToDataSources}
                className="text-[10px] text-slate-400 hover:text-slate-200 font-semibold px-1 py-0.5 rounded hover:bg-slate-800 transition"
              >
                Schema
              </button>
            )}
          </div>
        </div>

        {/* 1-Click: Auto-Generate Table from API */}
        {onAddTableFromApi && (
          <button
            onClick={onAddTableFromApi}
            id="btn-auto-generate-table-api"
            title="Generate a multi-column banded Table Control containing all API schema fields"
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/80 transition text-xs font-semibold shadow-xs group"
          >
            <Table className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Generate Table from API</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </button>
        )}

        {/* Search / Filter API Fields */}
        {fields.length > 4 && (
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              placeholder="Search API fields..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* List of Available API Schema Fields */}
        <div className="text-[10px] text-slate-400 flex items-center justify-between">
          <span>Assign Field ({filteredFields.length}):</span>
          {isTableSelected && (
            <span className="text-[9px] text-cyan-400 font-semibold">Table Selected</span>
          )}
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {filteredFields.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic p-2 text-center">
              {fields.length === 0 ? 'No API schema fields bound' : 'No matching fields'}
            </div>
          ) : (
            filteredFields.map((f) => {
              const displayName = f.displayName || (f as any).label || f.name;
              return (
                <div
                  key={f.name}
                  className="flex items-center gap-1 group/row"
                >
                  <button
                    onClick={() => onAddElement('field', activeBand || 'details', f.name)}
                    title={`Click to add [${f.name}] as Field element to ${activeBand}`}
                    className="flex-1 min-w-0 flex items-center justify-between p-1.5 rounded-lg bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/50 text-left transition text-xs font-mono"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {getFieldIcon(f.type)}
                      <span className="text-slate-300 group-hover/row:text-cyan-200 truncate text-[11px]">
                        {displayName}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase shrink-0 group-hover/row:text-cyan-400">
                      {f.type.slice(0, 3)}
                    </span>
                  </button>

                  {/* If Table is selected, provide quick "+ Col" button */}
                  {isTableSelected && onAddColumnToSelectedTable && (
                    <button
                      onClick={() => onAddColumnToSelectedTable(f.name, f.type)}
                      title={`Add ${f.name} as a column in selected table`}
                      className="px-1.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-cyan-600 rounded-lg text-[10px] text-cyan-400 hover:text-cyan-200 font-mono shrink-0 transition"
                    >
                      +Col
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Band Quick Reference (Crystal Reports Band Guide) */}
      <div className="mt-auto pt-2.5 border-t border-slate-800/80">
        <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Crystal Bands</span>
          <span className="text-[9px] text-slate-500">Hierarchy</span>
        </div>
        <div className="text-[10px] text-slate-400 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
            <span className="truncate">Report Header (Title/Logo)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
            <span className="truncate">Page Header (KPIs/Cols)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
            <span className="truncate">Details (Rows & Tables)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
            <span className="truncate">Report Footer (Totals)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

