import React, { useMemo } from 'react';
import { 
  ReportTemplate, 
  ReportElement, 
  BandType, 
  TableColumn 
} from '../../types/report';
import { FormulaEngine } from '../../services/formulaEngine';
import { ConditionalFormattingEngine } from '../../services/conditionalFormattingEngine';
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
  TrendingUp, 
  DollarSign, 
  Package, 
  Layers, 
  QrCode as QrIcon,
  Sparkles,
  Activity,
  CheckCircle2,
  Calendar,
  Hash,
  Type
} from 'lucide-react';

interface LiveReportRendererProps {
  template: ReportTemplate;
  dataset?: Record<string, any>[];
  recordLimit?: number;
  watermark?: string;
  theme?: string;
  className?: string;
  compact?: boolean;
}

const THEME_COLORS: Record<string, { primary: string; secondary: string; accent: string; chart: string[] }> = {
  'corporate-blue': { primary: '#0284c7', secondary: '#0ea5e9', accent: '#0369a1', chart: ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#0369a1'] },
  'emerald': { primary: '#10b981', secondary: '#34d399', accent: '#047857', chart: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'] },
  'purple': { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#6d28d9', chart: ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9'] },
  'amber': { primary: '#f59e0b', secondary: '#fbbf24', accent: '#b45309', chart: ['#f59e0b', '#fbbf24', '#d97706', '#fde68a', '#b45309'] },
  'monochrome': { primary: '#334155', secondary: '#475569', accent: '#1e293b', chart: ['#334155', '#475569', '#64748b', '#94a3b8', '#1e293b'] },
};

export const LiveReportRenderer: React.FC<LiveReportRendererProps> = ({
  template,
  dataset: propDataset,
  recordLimit = 25,
  watermark = 'none',
  theme = 'corporate-blue',
  className = '',
  compact = false,
}) => {
  // Use template datasource data if not passed
  const dataset = useMemo(() => {
    const src = propDataset || template.dataSources[0]?.data || [];
    if (recordLimit > 0 && src.length > recordLimit) {
      return src.slice(0, recordLimit);
    }
    return src;
  }, [propDataset, template.dataSources, recordLimit]);

  const primaryRow = dataset[0] || {};
  const activeColors = THEME_COLORS[theme] || THEME_COLORS['corporate-blue'];

  // Group elements by band
  const elementsByBand = useMemo(() => {
    const map: Record<BandType, ReportElement[]> = {
      reportHeader: [],
      pageHeader: [],
      groupHeader: [],
      details: [],
      groupFooter: [],
      pageFooter: [],
      reportFooter: [],
    };
    template.elements.forEach((el) => {
      if (map[el.band]) {
        map[el.band].push(el);
      } else {
        map['details'].push(el);
      }
    });
    return map;
  }, [template.elements]);

  const activeWatermarkText = useMemo(() => {
    if (watermark && watermark !== 'none') return watermark;
    if (template.pageSettings.watermark?.enabled) return template.pageSettings.watermark.text || 'DRAFT';
    return null;
  }, [watermark, template.pageSettings.watermark]);

  // Helper to render an individual element in a static or row context
  const renderElementContent = (el: ReportElement, rowContext: Record<string, any> = primaryRow) => {
    const ruleEval = ConditionalFormattingEngine.evaluateElementRules(el, rowContext, dataset);
    if (ruleEval.isHidden) return null;

    const mergedColor = ruleEval.style.color || el.style.textColor || '#0f172a';
    const mergedBg = ruleEval.style.backgroundColor || el.style.backgroundColor || 'transparent';
    const mergedFontWeight = (ruleEval.style.fontWeight as any) || el.style.fontWeight || 'normal';
    const mergedFontStyle = (ruleEval.style.fontStyle as any) || el.style.fontStyle || 'normal';
    const mergedBorderColor = ruleEval.style.borderColor || el.style.borderColor || 'transparent';
    const mergedBorderWidth = ruleEval.style.borderWidth || (el.style.borderWidth ? `${el.style.borderWidth}px` : '0px');

    const styleObj: React.CSSProperties = {
      fontSize: `${el.style.fontSize || 12}px`,
      fontWeight: mergedFontWeight,
      fontStyle: mergedFontStyle,
      color: mergedColor,
      backgroundColor: mergedBg,
      borderColor: mergedBorderColor,
      borderWidth: mergedBorderWidth,
      borderStyle: el.style.borderWidth ? 'solid' : 'none',
      borderRadius: `${el.style.borderRadius || 0}px`,
      padding: `${el.style.padding || 0}px`,
      textAlign: el.style.textAlign || 'left',
      textDecoration: ruleEval.style.textDecoration,
    };

    switch (el.type) {
      case 'text':
        return (
          <div style={styleObj} className="leading-snug break-words">
            {el.content || 'Label'}
          </div>
        );

      case 'field': {
        const rawVal = el.fieldBinding ? rowContext[el.fieldBinding] : '';
        const formatted = FormulaEngine.formatValue(rawVal, el.format || 'none');
        return (
          <div style={styleObj} className="font-mono truncate">
            {formatted}
          </div>
        );
      }

      case 'formula': {
        let val: any = '';
        if (el.formula) {
          val = FormulaEngine.evaluate(el.formula, rowContext, dataset);
        }
        const formatted = FormulaEngine.formatValue(val, el.format || 'none');
        return (
          <div style={styleObj} className="font-mono font-semibold truncate">
            {formatted}
          </div>
        );
      }

      case 'kpi': {
        let kpiVal: any = '$0.00';
        if (el.formula) {
          const raw = FormulaEngine.evaluate(el.formula, rowContext, dataset);
          kpiVal = FormulaEngine.formatValue(raw, el.format || 'currency');
        }
        return (
          <div
            style={{
              ...styleObj,
              backgroundColor: mergedBg !== 'transparent' ? mergedBg : '#f8fafc',
              borderColor: mergedBorderColor !== 'transparent' ? mergedBorderColor : '#e2e8f0',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
            className="p-3 rounded-xl shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>{el.kpiTitle || 'KPI Metric'}</span>
              <Activity className="w-3.5 h-3.5" style={{ color: activeColors.primary }} />
            </div>
            <div className="text-lg font-black font-mono text-slate-900 mt-1">
              {kpiVal}
            </div>
            {el.kpiTrendField && (
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>{el.kpiTrendField}</span>
              </div>
            )}
          </div>
        );
      }

      case 'chart': {
        const xAxisKey = el.xAxisField || 'region';
        const yAxisKey = el.yAxisFields?.[0] || 'gross_revenue';
        const chartData = dataset.slice(0, 7);

        return (
          <div
            style={{
              ...styleObj,
              backgroundColor: mergedBg !== 'transparent' ? mergedBg : '#ffffff',
              borderColor: mergedBorderColor !== 'transparent' ? mergedBorderColor : '#e2e8f0',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
            className="p-3 rounded-xl shadow-xs flex flex-col"
          >
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>{el.chartTitle || 'Metric Breakdown'}</span>
              <span className="text-[9px] font-mono uppercase text-slate-400">
                {el.chartType || 'bar'}
              </span>
            </div>
            <div className="w-full flex-1 min-h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                {el.chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey={xAxisKey} tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey={yAxisKey} stroke={activeColors.primary} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                ) : el.chartType === 'area' ? (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey={xAxisKey} tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey={yAxisKey} stroke={activeColors.primary} fill={activeColors.primary} fillOpacity={0.2} />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey={xAxisKey} tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey={yAxisKey} fill={activeColors.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        );
      }

      case 'table': {
        const cols: TableColumn[] = el.columns || [
          { id: '1', header: 'Item / ID', field: 'order_number', width: 25, align: 'left' },
          { id: '2', header: 'Customer', field: 'customer_name', width: 40, align: 'left' },
          { id: '3', header: 'Category', field: 'product_category', width: 20, align: 'left' },
          { id: '4', header: 'Revenue', field: 'gross_revenue', width: 15, align: 'right', format: 'currency', summaryType: 'sum' },
        ];

        return (
          <div
            style={styleObj}
            className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white text-xs w-full"
          >
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c.id}
                      style={{ width: `${c.width}%`, textAlign: c.align || 'left' }}
                      className="p-2 text-[11px]"
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {dataset.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                    {cols.map((c) => {
                      const val = row[c.field];
                      const formatted = FormulaEngine.formatValue(val, c.format || 'none');
                      return (
                        <td
                          key={c.id}
                          style={{ textAlign: c.align || 'left' }}
                          className="p-2 text-slate-800 truncate"
                        >
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {cols.some((c) => c.summaryType && c.summaryType !== 'none') && (
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-[11px]">
                  <tr>
                    {cols.map((c) => {
                      if (!c.summaryType || c.summaryType === 'none') {
                        return <td key={c.id} className="p-2"></td>;
                      }
                      let sum = 0;
                      if (c.summaryType === 'sum') {
                        sum = dataset.reduce((acc, r) => acc + (Number(r[c.field]) || 0), 0);
                      } else if (c.summaryType === 'avg') {
                        sum = dataset.length > 0 ? dataset.reduce((acc, r) => acc + (Number(r[c.field]) || 0), 0) / dataset.length : 0;
                      } else if (c.summaryType === 'count') {
                        sum = dataset.length;
                      }
                      const formatted = FormulaEngine.formatValue(sum, c.format || 'none');
                      return (
                        <td
                          key={c.id}
                          style={{ textAlign: c.align || 'right' }}
                          className="p-2 font-mono text-slate-900"
                        >
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        );
      }

      case 'qrcode':
        return (
          <div
            style={styleObj}
            className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center"
          >
            <QrIcon className="w-12 h-12 text-slate-800" />
            <span className="text-[8px] font-mono text-slate-400 uppercase mt-0.5">
              {el.content || 'AUDIT-VERIFIED'}
            </span>
          </div>
        );

      case 'line':
        return (
          <hr
            style={{
              borderColor: mergedBorderColor !== 'transparent' ? mergedBorderColor : '#cbd5e1',
              borderTopWidth: `${el.style.borderWidth || 1}px`,
              borderTopStyle: 'solid',
            }}
            className="w-full my-1"
          />
        );

      case 'shape':
        return (
          <div
            style={{
              ...styleObj,
              backgroundColor: mergedBg !== 'transparent' ? mergedBg : '#f1f5f9',
              borderColor: mergedBorderColor !== 'transparent' ? mergedBorderColor : '#e2e8f0',
              borderWidth: `${el.style.borderWidth || 1}px`,
              borderStyle: 'solid',
            }}
            className="w-full h-full rounded-lg"
          />
        );

      default:
        return null;
    }
  };

  const isLandscape = template.pageSettings.orientation === 'landscape';

  return (
    <div className={`w-full bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-6 flex flex-col space-y-4 relative overflow-hidden ${className}`}>
      {/* Watermark */}
      {activeWatermarkText && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
          <span
            style={{
              opacity: 0.1,
              color: '#dc2626',
              fontSize: compact ? '48px' : '76px',
              transform: 'rotate(-32deg)',
            }}
            className="font-extrabold tracking-widest uppercase border-4 border-red-600/20 px-8 py-4 rounded-3xl"
          >
            {activeWatermarkText}
          </span>
        </div>
      )}

      {/* 1. REPORT HEADER */}
      {template.bands.reportHeader?.visible && (
        <div className="border-b border-slate-200 pb-3 relative z-10 space-y-2">
          {elementsByBand.reportHeader.length > 0 ? (
            <div className="relative min-h-[50px]">
              {elementsByBand.reportHeader.map((el) => (
                <div
                  key={el.id}
                  style={{
                    position: 'relative',
                    marginBottom: '8px',
                  }}
                >
                  {renderElementContent(el)}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded uppercase">
                  {template.category} • Crystal Engine
                </span>
                <h1 className="text-xl font-bold text-slate-900 mt-1">{template.name}</h1>
                <p className="text-xs text-slate-500">{template.description}</p>
              </div>
              <div className="text-right text-[11px] text-slate-400 font-mono">
                <div>DATE: {new Date().toLocaleDateString()}</div>
                <div>RECORDS: {dataset.length}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PAGE HEADER / KPIS / CHARTS */}
      {template.bands.pageHeader?.visible && elementsByBand.pageHeader.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
          {elementsByBand.pageHeader.map((el) => (
            <div key={el.id} className="min-w-0">
              {renderElementContent(el)}
            </div>
          ))}
        </div>
      )}

      {/* 3. GROUP HEADER */}
      {template.bands.groupHeader?.visible && elementsByBand.groupHeader.length > 0 && (
        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 relative z-10 flex flex-wrap items-center gap-3">
          {elementsByBand.groupHeader.map((el) => (
            <div key={el.id} className="min-w-0">
              {renderElementContent(el)}
            </div>
          ))}
        </div>
      )}

      {/* 4. DETAILS BAND */}
      {template.bands.details?.visible && (
        <div className="relative z-10 space-y-3">
          {elementsByBand.details.some((el) => el.type === 'table') ? (
            // If details has a table, render table elements directly
            elementsByBand.details
              .filter((el) => el.type === 'table')
              .map((el) => <div key={el.id}>{renderElementContent(el)}</div>)
          ) : elementsByBand.details.length > 0 ? (
            // If details has field elements, render rows iteration
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Details Data Grid ({dataset.length} Rows)</span>
                <span className="text-[10px] text-slate-400 font-mono">Live Inferred Schema</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {dataset.map((row, rIdx) => (
                  <div key={rIdx} className="p-2.5 hover:bg-slate-50 flex flex-wrap items-center gap-4 text-xs">
                    {elementsByBand.details.map((el) => (
                      <div key={el.id} className="min-w-0">
                        {renderElementContent(el, row)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Fallback table preview
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Record #</th>
                    <th className="p-2">Name / Field</th>
                    <th className="p-2 text-right">Value / Metric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {dataset.slice(0, 6).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 text-cyan-700">#{i + 1}</td>
                      <td className="p-2 font-sans font-medium text-slate-800">{r.customer_name || r.account_name || r.item_name || 'Record Item'}</td>
                      <td className="p-2 text-right text-slate-900">{FormulaEngine.formatValue(r.gross_revenue || r.amount || r.unit_cost || 1000, 'currency')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. GROUP FOOTER */}
      {template.bands.groupFooter?.visible && elementsByBand.groupFooter.length > 0 && (
        <div className="bg-slate-50/80 p-2.5 rounded-lg border-t-2 border-slate-300 relative z-10 flex flex-wrap items-center justify-between gap-3">
          {elementsByBand.groupFooter.map((el) => (
            <div key={el.id} className="min-w-0">
              {renderElementContent(el)}
            </div>
          ))}
        </div>
      )}

      {/* 6. REPORT FOOTER / GRAND TOTALS */}
      {template.bands.reportFooter?.visible && (
        <div className="border-t-2 border-slate-300 pt-3 relative z-10 flex flex-wrap items-center justify-between gap-3">
          {elementsByBand.reportFooter.length > 0 ? (
            elementsByBand.reportFooter.map((el) => (
              <div key={el.id} className="min-w-0">
                {renderElementContent(el)}
              </div>
            ))
          ) : (
            <div className="w-full flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Report Engine Grand Summary</span>
              <span>Total Processed: {dataset.length} Records</span>
            </div>
          )}
        </div>
      )}

      {/* 7. PAGE FOOTER */}
      {template.bands.pageFooter?.visible && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono relative z-10">
          <span>Crystal Dynamic Report Engine</span>
          <span>Page 1 of 1</span>
        </div>
      )}
    </div>
  );
};
