import React, { useState, useEffect } from 'react';
import { X, Check, Calculator, Play, HelpCircle, Code, Plus } from 'lucide-react';
import { FormulaEngine } from '../../services/formulaEngine';
import { ReportTemplate } from '../../types/report';

interface FormulaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formulaExpression: string) => void;
  initialFormula?: string;
  template: ReportTemplate;
  sampleRow?: Record<string, any>;
}

const BUILT_IN_FUNCTIONS = [
  { name: 'SUM(field)', desc: 'Sums all values of the field in current dataset', example: 'SUM(gross_revenue)' },
  { name: 'AVG(field)', desc: 'Calculates the arithmetic mean of the field', example: 'AVG(unit_price)' },
  { name: 'COUNT(field)', desc: 'Counts records in the dataset', example: 'COUNT(id)' },
  { name: 'MIN(field)', desc: 'Finds minimum value in the dataset', example: 'MIN(cost_of_goods)' },
  { name: 'MAX(field)', desc: 'Finds maximum value in the dataset', example: 'MAX(gross_revenue)' },
  { name: 'ROUND(val, dec)', desc: 'Rounds number to decimal places', example: 'ROUND(SUM(net_profit), 2)' },
  { name: 'CURRENCY(val)', desc: 'Formats value as standard USD/EUR currency', example: 'CURRENCY(SUM(gross_revenue))' },
  { name: 'IF(cond, then, else)', desc: 'Conditional logic expression', example: 'IF({units} > 50, "Bulk Tier", "Standard Tier")' },
];

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFormula = '',
  template,
  sampleRow,
}) => {
  const [expression, setExpression] = useState(initialFormula);
  const [testResult, setTestResult] = useState<any>('');
  const [testError, setTestError] = useState<string | null>(null);

  const dataset = template.dataSources[0]?.data || [];
  const fields = template.dataSources[0]?.fields || [];
  const parameters = template.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.defaultValue }), {});

  useEffect(() => {
    setExpression(initialFormula);
    runEvaluation(initialFormula);
  }, [initialFormula, isOpen]);

  const runEvaluation = (expr: string) => {
    try {
      const activeRow = sampleRow || dataset[0] || {};
      const res = FormulaEngine.evaluate(expr, activeRow, dataset, parameters);
      setTestResult(res);
      setTestError(null);
    } catch (err: any) {
      setTestError(err.message || 'Evaluation error');
      setTestResult('');
    }
  };

  const insertSnippet = (snippet: string) => {
    setExpression((prev) => prev + snippet);
    runEvaluation(expression + snippet);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Crystal Formula Expression Builder</h3>
              <p className="text-xs text-slate-400">Create computed fields, dataset aggregations, and business metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Main Formula Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Formula Expression
            </label>
            <textarea
              id="formula-expression-input"
              value={expression}
              onChange={(e) => {
                setExpression(e.target.value);
                runEvaluation(e.target.value);
              }}
              rows={4}
              placeholder="e.g. SUM(gross_revenue) * 1.05 or IF({units} > 50, {gross_revenue} * 0.9, {gross_revenue})"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>

          {/* Quick Helper Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database Fields */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
                <span>Available Database Fields</span>
                <span className="text-[10px] text-slate-500 font-mono">Click to insert</span>
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {fields.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => insertSnippet(`{${f.name}}`)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 transition"
                  >
                    +{f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Built-in Functions */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
                <span>Aggregation Functions</span>
                <span className="text-[10px] text-slate-500 font-mono">Crystal standard</span>
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {BUILT_IN_FUNCTIONS.map((fn) => (
                  <div
                    key={fn.name}
                    onClick={() => insertSnippet(fn.example)}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 cursor-pointer text-xs border border-slate-800/80 group transition"
                  >
                    <span className="font-mono text-cyan-400 font-medium group-hover:underline">{fn.name}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{fn.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Evaluation Result Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Live Test Result (First Record Sample)
                </span>
                {testError ? (
                  <span className="text-xs text-rose-400 font-mono">{testError}</span>
                ) : (
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {String(testResult !== undefined ? testResult : '—')}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">Dataset rows: {dataset.length}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(expression);
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition"
          >
            <Check className="w-4 h-4" />
            <span>Apply Formula</span>
          </button>
        </div>
      </div>
    </div>
  );
};
