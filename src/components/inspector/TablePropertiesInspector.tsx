import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Check, 
  Layers, 
  Table as TableIcon,
  DollarSign, 
  Hash, 
  Calendar, 
  Type, 
  Tag, 
  Sliders, 
  RefreshCw, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
  Palette
} from 'lucide-react';
import { 
  ReportElement, 
  ReportTemplate, 
  TableColumn, 
  ReportDataSource, 
  DataSourceField 
} from '../../types/report';
import { 
  ENTERPRISE_DATA_SOURCES, 
  resolveElementDataSource, 
  autoGenerateColumnsForDataSource, 
  createColumnForField 
} from '../../services/dataSourceCatalog';
import { FormulaEngine } from '../../services/formulaEngine';

interface TablePropertiesInspectorProps {
  element: ReportElement;
  template: ReportTemplate;
  onUpdateElement: (updated: ReportElement) => void;
  onAddDataSource?: (newDs: ReportDataSource) => void;
  onOpenApiModal?: () => void;
}

export const TablePropertiesInspector: React.FC<TablePropertiesInspectorProps> = ({
  element,
  template,
  onUpdateElement,
  onAddDataSource,
  onOpenApiModal,
}) => {
  const [expandedColId, setExpandedColId] = useState<string | null>(null);
  const [showDsSelector, setShowDsSelector] = useState(false);

  // Resolve current active data source for this table
  const activeDs = resolveElementDataSource(template, element.dataSourceId);
  const availableFields: DataSourceField[] = activeDs.fields || [];
  const columns = element.columns || [];

  // Helper to update element with new properties
  const update = (patch: Partial<ReportElement>) => {
    onUpdateElement({ ...element, ...patch });
  };

  // Helper to switch data source
  const handleSelectDataSource = (ds: ReportDataSource) => {
    // If not in template, register it
    if (!template.dataSources.some((d) => d.id === ds.id) && onAddDataSource) {
      onAddDataSource(ds);
    }

    // Auto-generate columns for this new data source to provide an immediate seamless experience
    const newColumns = autoGenerateColumnsForDataSource(ds, 5);

    update({
      dataSourceId: ds.id,
      name: `${ds.name} Grid`,
      columns: newColumns,
    });
    setShowDsSelector(false);
  };

  // Auto-map all fields from the active data source
  const handleAutoMapAllFields = () => {
    const newColumns = autoGenerateColumnsForDataSource(activeDs, availableFields.length);
    update({ columns: newColumns });
  };

  // Add a specific field as a column
  const handleAddFieldAsColumn = (field: DataSourceField) => {
    const newCol = createColumnForField(field, Math.max(15, Math.floor(100 / (columns.length + 1))));
    update({ columns: [...columns, newCol] });
    setExpandedColId(newCol.id);
  };

  // Move column up/left or down/right
  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const newCols = [...columns];
    const [moved] = newCols.splice(index, 1);
    newCols.splice(targetIndex, 0, moved);
    update({ columns: newCols });
  };

  // Remove column
  const handleRemoveColumn = (index: number) => {
    const newCols = columns.filter((_, idx) => idx !== index);
    update({ columns: newCols });
  };

  // Update specific column
  const handleUpdateColumn = (index: number, patch: Partial<TableColumn>) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], ...patch };
    update({ columns: newCols });
  };

  // Helper to render type icon
  const renderTypeIcon = (type?: string) => {
    switch (type) {
      case 'currency':
        return <DollarSign className="w-3 h-3 text-emerald-400" />;
      case 'number':
        return <Hash className="w-3 h-3 text-cyan-400" />;
      case 'date':
        return <Calendar className="w-3 h-3 text-purple-400" />;
      case 'badge':
        return <Tag className="w-3 h-3 text-amber-400" />;
      default:
        return <Type className="w-3 h-3 text-slate-400" />;
    }
  };

  // Preview data snippet from bound data source
  const previewRows = (activeDs.data || []).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* 1. DATA SOURCE SELECTION & STATUS */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Table Data Source</span>
              <span className="text-[10px] text-slate-400">Controls data records & field schema</span>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected
          </span>
        </div>

        {/* Current Data Source Card */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                {activeDs.type}
              </span>
              <span className="text-xs font-semibold text-slate-100 truncate max-w-[170px]" title={activeDs.name}>
                {activeDs.name}
              </span>
            </div>
            <button
              onClick={() => setShowDsSelector(!showDsSelector)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1 transition"
            >
              <span>Change</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showDsSelector ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
            <span>{activeDs.data?.length || 0} records loaded</span>
            <span>{availableFields.length} schema fields</span>
          </div>
        </div>

        {/* Data Source Selector Dropdown / Catalog */}
        {showDsSelector && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 space-y-1.5 animate-in fade-in duration-100 shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Select or Connect Data Source
            </span>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {/* Template Data Sources */}
              {template.dataSources.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => handleSelectDataSource(ds)}
                  className={`w-full text-left p-2 rounded-md flex items-center justify-between text-xs transition ${
                    activeDs.id === ds.id
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-800'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate">{ds.name}</div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase">{ds.type} • {ds.data?.length || 0} rows</div>
                  </div>
                  {activeDs.id === ds.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              ))}

              {/* Enterprise Catalog Presets (Not yet added to template) */}
              {ENTERPRISE_DATA_SOURCES.filter(
                (eds) => !template.dataSources.some((tds) => tds.id === eds.id)
              ).map((eds) => (
                <button
                  key={eds.id}
                  onClick={() => handleSelectDataSource(eds)}
                  className="w-full text-left p-2 rounded-md flex items-center justify-between text-xs bg-slate-950/40 hover:bg-slate-800/80 text-slate-300 border border-dashed border-slate-800 transition"
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{eds.name}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">Catalog Preset • {eds.fields.length} fields</div>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono">+ Connect</span>
                </button>
              ))}

              {/* Connect REST API Modal trigger */}
              {onOpenApiModal && (
                <button
                  onClick={() => {
                    setShowDsSelector(false);
                    onOpenApiModal();
                  }}
                  className="w-full text-center p-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Configure Custom REST / OPTIONS Endpoint</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Schema Field Auto-Map Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAutoMapAllFields}
            className="flex-1 bg-cyan-700/80 hover:bg-cyan-600 text-white text-[11px] font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
            title="Automatically generates table columns for all schema fields in this data source"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Auto-Map All Fields</span>
          </button>
          <button
            onClick={() => update({ columns: [] })}
            className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 text-[11px] transition"
            title="Clear all columns"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 2. AVAILABLE SCHEMA FIELDS TO MAP */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Available Data Fields ({availableFields.length})</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Click to map</span>
        </div>

        <p className="text-[10px] text-slate-400 leading-tight">
          Click any field to add it as a column in this table. Columns will dynamically display data from <span className="font-semibold text-cyan-300">{activeDs.name}</span>.
        </p>

        {/* Field Badges Grid */}
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 pt-1">
          {availableFields.map((field) => {
            const isMapped = columns.some((c) => c.field === field.name);
            return (
              <button
                key={field.name}
                onClick={() => handleAddFieldAsColumn(field)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono transition border ${
                  isMapped
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-cyan-950 hover:border-cyan-700 hover:text-cyan-200'
                }`}
                title={`Click to add column: ${field.displayName || field.name} (${field.type})`}
              >
                {renderTypeIcon(field.type)}
                <span className="font-sans">{field.displayName || field.name}</span>
                {isMapped ? (
                  <Check className="w-2.5 h-2.5 text-emerald-400 ml-0.5" />
                ) : (
                  <Plus className="w-2.5 h-2.5 text-cyan-400 ml-0.5 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TABLE COLUMNS & FIELD MAPPINGS */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Table Columns ({columns.length})</span>
          </div>
          <button
            onClick={() => {
              const defaultField = availableFields[0] || { name: 'field_1', type: 'string', displayName: 'Column' };
              handleAddFieldAsColumn(defaultField);
            }}
            className="text-[10px] bg-cyan-700 hover:bg-cyan-600 text-white px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition"
          >
            <Plus className="w-3 h-3" />
            <span>Add Column</span>
          </button>
        </div>

        {columns.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">No columns mapped to this table yet.</p>
            <button
              onClick={handleAutoMapAllFields}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline"
            >
              Auto-Map All Fields from {activeDs.name}
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {columns.map((col, idx) => {
              const isExpanded = expandedColId === col.id;
              const boundField = availableFields.find((f) => f.name === col.field);

              return (
                <div
                  key={col.id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-2 text-xs transition hover:border-slate-700"
                >
                  {/* Column Summary Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {renderTypeIcon(col.format || boundField?.type)}
                      <span className="font-semibold text-slate-200 truncate">{col.header}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-900/60">
                        {`{${col.field}}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up/Down */}
                      <button
                        onClick={() => handleMoveColumn(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-20 transition"
                        title="Move left/up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveColumn(idx, 'down')}
                        disabled={idx === columns.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-20 transition"
                        title="Move right/down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      {/* Expand / Collapse Details */}
                      <button
                        onClick={() => setExpandedColId(isExpanded ? null : col.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                        title="Edit Column Mapping & Formatting"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {/* Delete Column */}
                      <button
                        onClick={() => handleRemoveColumn(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition ml-0.5"
                        title="Delete column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Column Details: Field Mapping & Options */}
                  {isExpanded && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800 animate-in fade-in duration-100">
                      {/* Field Mapping Dropdown */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                          Mapped Data Source Field
                        </label>
                        <select
                          value={col.field}
                          onChange={(e) => {
                            const newFieldName = e.target.value;
                            const newField = availableFields.find((f) => f.name === newFieldName);
                            handleUpdateColumn(idx, {
                              field: newFieldName,
                              header: newField?.displayName || newFieldName.replace(/_/g, ' '),
                              format: newField?.type === 'currency' ? 'currency' : newField?.type === 'number' ? 'number' : 'text',
                              align: newField?.type === 'currency' || newField?.type === 'number' ? 'right' : 'left',
                              summaryType: newField?.type === 'currency' || newField?.type === 'number' ? 'sum' : 'none',
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono"
                        >
                          {availableFields.map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.displayName || f.name} ({f.name}) — [{f.type.toUpperCase()}]
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Header Title */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                          Column Header Label
                        </label>
                        <input
                          type="text"
                          value={col.header}
                          onChange={(e) => handleUpdateColumn(idx, { header: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                        />
                      </div>

                      {/* Format and Alignment */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-1">Format</label>
                          <select
                            value={col.format || 'text'}
                            onChange={(e) => handleUpdateColumn(idx, { format: e.target.value as any })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="text">Text / String</option>
                            <option value="currency">Currency ($1,234.56)</option>
                            <option value="number">Number (#,###)</option>
                            <option value="percentage">Percentage (15.5%)</option>
                            <option value="date">Date (YYYY-MM-DD)</option>
                            <option value="badge">Status Badge</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-1">Alignment</label>
                          <div className="flex rounded-lg border border-slate-700 overflow-hidden bg-slate-950">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => handleUpdateColumn(idx, { align })}
                                className={`flex-1 py-1 text-[10px] font-semibold capitalize transition ${
                                  col.align === align
                                    ? 'bg-cyan-700 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {align}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Summary Total & Width */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-1">Totals Summary</label>
                          <select
                            value={col.summaryType || 'none'}
                            onChange={(e) => handleUpdateColumn(idx, { summaryType: e.target.value as any })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="none">None</option>
                            <option value="sum">Sum (Σ)</option>
                            <option value="avg">Average (Avg)</option>
                            <option value="count">Count (Total Rows)</option>
                            <option value="min">Minimum</option>
                            <option value="max">Maximum</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-1">Width (%)</label>
                          <input
                            type="number"
                            min={5}
                            max={100}
                            value={col.width || 20}
                            onChange={(e) => handleUpdateColumn(idx, { width: parseInt(e.target.value, 10) || 15 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. TABLE STYLING & BEHAVIOR */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Table Appearance & Styling</span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Summary Row */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300">Show Summary Totals Footer</span>
            <input
              type="checkbox"
              checked={element.showTableFooter !== false}
              onChange={(e) => update({ showTableFooter: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
            />
          </label>

          {/* Striped Rows */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300">Striped Alternating Rows</span>
            <input
              type="checkbox"
              checked={element.stripedRows ?? true}
              onChange={(e) => update({ stripedRows: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
            />
          </label>

          {/* Dense Rows */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300">Compact / Dense Rows</span>
            <input
              type="checkbox"
              checked={element.denseRows ?? false}
              onChange={(e) => update({ denseRows: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* 5. LIVE DATA RECORDS PREVIEW */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">Live Dynamic Sample</span>
          <span className="text-[10px] text-cyan-400 font-mono">First {previewRows.length} Rows</span>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900 text-[10px]">
          <div className="bg-slate-950 px-2 py-1 text-slate-400 font-bold border-b border-slate-800 flex divide-x divide-slate-800">
            {columns.slice(0, 4).map((c) => (
              <div key={c.id} style={{ width: `${c.width || 25}%` }} className="px-1 truncate">
                {c.header}
              </div>
            ))}
          </div>
          <div className="divide-y divide-slate-800/60 font-mono">
            {previewRows.map((row, rIdx) => (
              <div key={rIdx} className="px-2 py-1 text-slate-300 flex divide-x divide-slate-800/40">
                {columns.slice(0, 4).map((c) => (
                  <div key={c.id} style={{ width: `${c.width || 25}%`, textAlign: c.align || 'left' }} className="px-1 truncate">
                    {FormulaEngine.formatValue(row[c.field], c.format || 'none')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
