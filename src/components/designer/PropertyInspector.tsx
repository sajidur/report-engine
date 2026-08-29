import React from 'react';
import { 
  Trash2, 
  Copy, 
  Calculator, 
  Settings, 
  Type, 
  Layout, 
  Palette, 
  Database, 
  BarChart3, 
  Activity,
  Plus,
  Sliders
} from 'lucide-react';
import { ReportElement, ReportTemplate, TableColumn, ChartType, ConditionalFormattingRule } from '../../types/report';
import { ConditionalRulesInspector } from '../inspector/ConditionalRulesInspector';

interface PropertyInspectorProps {
  selectedElement: ReportElement | null;
  template: ReportTemplate;
  onUpdateElement: (updated: ReportElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (el: ReportElement) => void;
  onUpdatePageSettings: (settings: ReportTemplate['pageSettings']) => void;
  onOpenFormulaEditor: (initialExpr: string, callback: (expr: string) => void) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selectedElement,
  template,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onUpdatePageSettings,
  onOpenFormulaEditor,
}) => {
  const fields = template.dataSources[0]?.fields || [];

  // When no element is selected: Page & Document Settings
  if (!selectedElement) {
    const { pageSettings } = template;
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 select-none overflow-y-auto space-y-5">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Page & Report Settings</span>
          </h3>
          <p className="text-[11px] text-slate-400">Configure global report geometry and print export properties</p>
        </div>

        {/* Paper Size & Orientation */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-200">Paper Layout</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Paper Size</label>
              <select
                value={pageSettings.size}
                onChange={(e) => onUpdatePageSettings({ ...pageSettings, size: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">Letter (8.5 × 11 in)</option>
                <option value="Legal">Legal (8.5 × 14 in)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Orientation</label>
              <select
                value={pageSettings.orientation}
                onChange={(e) => onUpdatePageSettings({ ...pageSettings, orientation: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Margins (mm)</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                <div key={side}>
                  <span className="text-[9px] text-slate-500 uppercase">{side[0]}</span>
                  <input
                    type="number"
                    value={pageSettings.margins[side]}
                    onChange={(e) =>
                      onUpdatePageSettings({
                        ...pageSettings,
                        margins: { ...pageSettings.margins, [side]: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-mono text-cyan-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Watermark Settings */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-200">Security Watermark</h4>
            <input
              type="checkbox"
              checked={pageSettings.watermark?.enabled || false}
              onChange={(e) =>
                onUpdatePageSettings({
                  ...pageSettings,
                  watermark: {
                    enabled: e.target.checked,
                    text: pageSettings.watermark?.text || 'CONFIDENTIAL',
                    opacity: pageSettings.watermark?.opacity || 0.08,
                    color: '#0f172a',
                    fontSize: 48,
                    rotation: -45,
                  },
                })
              }
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
            />
          </div>

          {pageSettings.watermark?.enabled && (
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Watermark Text</label>
                <input
                  type="text"
                  value={pageSettings.watermark.text}
                  onChange={(e) =>
                    onUpdatePageSettings({
                      ...pageSettings,
                      watermark: { ...pageSettings.watermark!, text: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  placeholder="e.g. CONFIDENTIAL"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Opacity ({(pageSettings.watermark.opacity * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.02"
                  max="0.30"
                  step="0.01"
                  value={pageSettings.watermark.opacity}
                  onChange={(e) =>
                    onUpdatePageSettings({
                      ...pageSettings,
                      watermark: { ...pageSettings.watermark!, opacity: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Selected Band Info */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <h4 className="text-xs font-semibold text-slate-200">Active Bands (Crystal Model)</h4>
          <p className="text-[11px] text-slate-400">Click any element on canvas to modify its properties, formula bindings, or data fields.</p>
        </div>
      </div>
    );
  }

  // When an element is selected
  const el = selectedElement;

  const update = (partial: Partial<ReportElement>) => {
    onUpdateElement({ ...el, ...partial });
  };

  const updateStyle = (partialStyle: Partial<ReportElement['style']>) => {
    onUpdateElement({ ...el, style: { ...el.style, ...partialStyle } });
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 select-none overflow-y-auto space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider block">
            {el.type} Component
          </span>
          <input
            type="text"
            value={el.name}
            onChange={(e) => update({ name: e.target.value })}
            className="text-xs font-bold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDuplicateElement(el)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Duplicate element"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteElement(el.id)}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition"
            title="Delete element"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Geometry / Positioning */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Layout className="w-3.5 h-3.5 text-cyan-400" />
          <span>Geometry & Band</span>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Assigned Section Band</label>
          <select
            value={el.band}
            onChange={(e) => update({ band: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
          >
            <option value="reportHeader">Report Header</option>
            <option value="pageHeader">Page Header (KPIs/Charts)</option>
            <option value="groupHeader">Group Header</option>
            <option value="details">Details (Data Rows)</option>
            <option value="groupFooter">Group Footer (Subtotals)</option>
            <option value="pageFooter">Page Footer</option>
            <option value="reportFooter">Report Footer (Grand Total)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-500">X (px)</span>
            <input
              type="number"
              value={el.x}
              onChange={(e) => update({ x: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500">Y (px)</span>
            <input
              type="number"
              value={el.y}
              onChange={(e) => update({ y: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500">Width (px)</span>
            <input
              type="number"
              value={el.width}
              onChange={(e) => update({ width: parseInt(e.target.value, 10) || 10 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500">Height (px)</span>
            <input
              type="number"
              value={el.height}
              onChange={(e) => update({ height: parseInt(e.target.value, 10) || 10 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Content & Data Binding */}
      {(el.type === 'text' || el.type === 'field' || el.type === 'formula') && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Content & Formula Binding</span>
          </div>

          {el.type === 'text' && (
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Text Content</label>
              <textarea
                value={el.content || ''}
                onChange={(e) => update({ content: e.target.value })}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
          )}

          {el.type === 'field' && (
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Database Column Binding</label>
              <select
                value={el.fieldBinding || ''}
                onChange={(e) => update({ fieldBinding: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono"
              >
                <option value="">-- Select Field --</option>
                {fields.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.displayName} ({f.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Formula field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-400">Formula Expression</label>
              <button
                type="button"
                onClick={() =>
                  onOpenFormulaEditor(el.formula || '', (newExpr) => update({ formula: newExpr }))
                }
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <Calculator className="w-3 h-3" />
                <span>Open Builder</span>
              </button>
            </div>
            <input
              type="text"
              value={el.formula || ''}
              onChange={(e) => update({ formula: e.target.value })}
              placeholder="e.g. SUM(gross_revenue)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono"
            />
          </div>

          {/* Format */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Value Formatting</label>
            <select
              value={el.format || 'none'}
              onChange={(e) => update({ format: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            >
              <option value="none">Standard Text / Raw</option>
              <option value="currency">Currency ($1,234.56)</option>
              <option value="number">Number with Commas</option>
              <option value="percentage">Percentage (18.4%)</option>
              <option value="date">Date (MMM DD, YYYY)</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
            </select>
          </div>
        </div>
      )}

      {/* Table Columns Editor */}
      {el.type === 'table' && el.columns && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Table Columns ({el.columns.length})</span>
            <button
              onClick={() => {
                const newCol: TableColumn = {
                  id: `col-${Date.now()}`,
                  header: 'New Column',
                  field: fields[0]?.name || 'id',
                  width: 15,
                  align: 'left',
                };
                update({ columns: [...el.columns!, newCol] });
              }}
              className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-0.5 rounded font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {el.columns.map((col, idx) => (
              <div key={col.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={col.header}
                    onChange={(e) => {
                      const copy = [...el.columns!];
                      copy[idx].header = e.target.value;
                      update({ columns: copy });
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-200 border-b border-slate-700 w-24"
                  />
                  <button
                    onClick={() => {
                      const copy = el.columns!.filter((_, i) => i !== idx);
                      update({ columns: copy });
                    }}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <select
                    value={col.field}
                    onChange={(e) => {
                      const copy = [...el.columns!];
                      copy[idx].field = e.target.value;
                      update({ columns: copy });
                    }}
                    className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 font-mono"
                  >
                    {fields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.displayName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={col.format || 'text'}
                    onChange={(e) => {
                      const copy = [...el.columns!];
                      copy[idx].format = e.target.value as any;
                      update({ columns: copy });
                    }}
                    className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300"
                  >
                    <option value="text">Text</option>
                    <option value="currency">Currency</option>
                    <option value="number">Number</option>
                    <option value="badge">Badge</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] text-slate-400">Show Totals Summary Row</label>
            <input
              type="checkbox"
              checked={el.showTableFooter !== false}
              onChange={(e) => update({ showTableFooter: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600"
            />
          </div>
        </div>
      )}

      {/* Chart Specific Properties */}
      {el.type === 'chart' && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chart Configuration</span>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Chart Type</label>
            <select
              value={el.chartType || 'bar'}
              onChange={(e) => update({ chartType: e.target.value as ChartType })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="donut">Donut Chart</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Chart Title</label>
            <input
              type="text"
              value={el.chartTitle || ''}
              onChange={(e) => update({ chartTitle: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">X-Axis Category Field</label>
            <select
              value={el.xAxisField || ''}
              onChange={(e) => update({ xAxisField: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono"
            >
              {fields.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* KPI Card Properties */}
      {el.type === 'kpi' && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>KPI Metric Card</span>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">KPI Title</label>
            <input
              type="text"
              value={el.kpiTitle || ''}
              onChange={(e) => update({ kpiTitle: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Trend Subtext</label>
            <input
              type="text"
              value={el.kpiTrendField || ''}
              onChange={(e) => update({ kpiTrendField: e.target.value })}
              placeholder="e.g. +18.4% vs Last Quarter"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400"
            />
          </div>
        </div>
      )}

      {/* Typography & Appearance */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Styling & Colors</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Font Size</label>
            <input
              type="number"
              value={el.style.fontSize || 12}
              onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value, 10) || 12 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Font Weight</label>
            <select
              value={el.style.fontWeight || 'normal'}
              onChange={(e) => updateStyle({ fontWeight: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            >
              <option value="normal">Normal</option>
              <option value="600">Semi-Bold</option>
              <option value="bold">Bold</option>
              <option value="800">Extra-Bold</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Text Color</label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={el.style.textColor || '#0f172a'}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400">{el.style.textColor || '#0f172a'}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Background</label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={el.style.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400">{el.style.backgroundColor || 'none'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Formatting Rules Engine */}
      <ConditionalRulesInspector
        element={el}
        fields={fields}
        sampleDataRow={template.dataSources[0]?.data?.[0] || {}}
        dataset={template.dataSources[0]?.data || []}
        onUpdateRules={(rules: ConditionalFormattingRule[]) => update({ conditionalRules: rules })}
      />
    </div>
  );
};
