import React, { useState } from 'react';
import {
  ConditionalFormattingRule,
  RuleOperator,
  ReportElement,
  DataSourceField,
} from '../../types/report';
import {
  ConditionalFormattingEngine,
} from '../../services/conditionalFormattingEngine';
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Check,
  TrendingUp,
  TrendingDown,
  Zap,
  Flag,
  Palette,
  Eye,
  EyeOff,
  Tag,
  TestTube,
} from 'lucide-react';

interface ConditionalRulesInspectorProps {
  element: ReportElement;
  fields: DataSourceField[];
  sampleDataRow?: Record<string, any>;
  dataset?: Record<string, any>[];
  onUpdateRules: (rules: ConditionalFormattingRule[]) => void;
}

const COLOR_PRESETS = [
  { name: 'Red Alert', text: '#dc2626', bg: '#fee2e2' },
  { name: 'Rose Caution', text: '#e11d48', bg: '#ffe4e6' },
  { name: 'Amber Warning', text: '#d97706', bg: '#fef3c7' },
  { name: 'Emerald Success', text: '#16a34a', bg: '#dcfce7' },
  { name: 'Teal Positive', text: '#0d9488', bg: '#ccfbf1' },
  { name: 'Sky Blue', text: '#0284c7', bg: '#e0f2fe' },
  { name: 'Indigo Accent', text: '#4f46e5', bg: '#e0e7ff' },
  { name: 'Purple Highlight', text: '#9333ea', bg: '#f3e8ff' },
  { name: 'Dark Neutral', text: '#0f172a', bg: '#f1f5f9' },
];

const ICONS_MAP: Record<string, React.ReactNode> = {
  alert: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
  check: <Check className="w-3.5 h-3.5 text-emerald-500" />,
  'trending-up': <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />,
  'trending-down': <TrendingDown className="w-3.5 h-3.5 text-rose-500" />,
  flame: <Flame className="w-3.5 h-3.5 text-amber-500" />,
  zap: <Zap className="w-3.5 h-3.5 text-yellow-500" />,
  flag: <Flag className="w-3.5 h-3.5 text-cyan-500" />,
};

export const ConditionalRulesInspector: React.FC<ConditionalRulesInspectorProps> = ({
  element,
  fields,
  sampleDataRow = {},
  dataset = [],
  onUpdateRules,
}) => {
  const rules = element.conditionalRules || [];
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(
    rules.length > 0 ? rules[0].id : null
  );
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [testValueInput, setTestValueInput] = useState<string>('');

  const handleAddRule = (preset?: typeof ConditionalFormattingEngine.RULE_PRESETS[0]['rule']) => {
    const newRule: ConditionalFormattingRule = {
      id: `rule-${Date.now()}`,
      name: preset?.name || `Rule ${rules.length + 1}`,
      enabled: true,
      targetField: preset?.targetField || '__self__',
      operator: preset?.operator || 'gt',
      value: preset?.value !== undefined ? preset.value : 1000,
      valueSecondary: preset?.valueSecondary,
      condition: preset?.condition || '',
      textColor: preset?.textColor || '#dc2626',
      backgroundColor: preset?.backgroundColor || '#fee2e2',
      fontWeight: preset?.fontWeight || 'bold',
      fontStyle: preset?.fontStyle || 'normal',
      icon: preset?.icon || 'alert',
      badge: preset?.badge || false,
    };

    const nextRules = [...rules, newRule];
    onUpdateRules(nextRules);
    setExpandedRuleId(newRule.id);
    setShowPresetsMenu(false);
  };

  const handleUpdateRule = (id: string, partial: Partial<ConditionalFormattingRule>) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, ...partial } : r));
    onUpdateRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    onUpdateRules(updated);
    if (expandedRuleId === id) {
      setExpandedRuleId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleDuplicateRule = (rule: ConditionalFormattingRule) => {
    const dupe: ConditionalFormattingRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name || 'Rule'} (Copy)`,
    };
    onUpdateRules([...rules, dupe]);
    setExpandedRuleId(dupe.id);
  };

  // Determine the primary bound value for sample testing
  let currentBoundValue = '';
  if (element.type === 'field' && element.fieldBinding) {
    currentBoundValue = sampleDataRow[element.fieldBinding];
  } else if (element.type === 'kpi' && element.kpiValueField) {
    currentBoundValue = sampleDataRow[element.kpiValueField];
  } else if (element.type === 'text') {
    currentBoundValue = element.content || '';
  }

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Conditional Formatting ({rules.length})</span>
        </div>

        <div className="relative">
          <button
            id="add-conditional-rule-btn"
            type="button"
            onClick={() => setShowPresetsMenu(!showPresetsMenu)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>Add Rule</span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
          </button>

          {/* Quick Presets Dropdown */}
          {showPresetsMenu && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800">
                Rule Templates & Presets
              </div>

              {ConditionalFormattingEngine.RULE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAddRule(preset.rule)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition flex flex-col gap-0.5 group"
                >
                  <span className="font-semibold text-xs text-cyan-300 group-hover:text-cyan-200">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{preset.description}</span>
                </button>
              ))}

              <div className="border-t border-slate-800 pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => handleAddRule()}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cyan-950 text-cyan-400 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Custom Rule from Scratch</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-4 px-2 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
          <p className="text-[11px] text-slate-400 mb-2">
            No dynamic formatting rules defined.
          </p>
          <p className="text-[10px] text-slate-500">
            Define logic (e.g. <em>if value &gt; 1000 then red text</em>) to style this element automatically based on real-time data values.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
          {rules.map((rule, idx) => {
            const isExpanded = expandedRuleId === rule.id;
            const targetValToTest =
              testValueInput.trim() !== ''
                ? testValueInput
                : rule.targetField && rule.targetField !== '__self__'
                ? sampleDataRow[rule.targetField]
                : currentBoundValue;

            const isMatching = ConditionalFormattingEngine.evaluateRule(
              rule,
              targetValToTest,
              sampleDataRow,
              dataset
            );

            return (
              <div
                key={rule.id}
                id={`rule-card-${rule.id}`}
                className={`rounded-lg border transition-colors ${
                  isExpanded
                    ? 'bg-slate-900 border-cyan-700/80 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Rule Card Summary Header */}
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={rule.enabled !== false}
                      onChange={(e) => handleUpdateRule(rule.id, { enabled: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                      title={rule.enabled !== false ? 'Disable Rule' : 'Enable Rule'}
                    />

                    <div
                      onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {rule.name || `Rule #${idx + 1}`}
                        </span>
                        {/* Live Match Badge */}
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5 ${
                            isMatching
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                          title={`Real-time Evaluation: ${isMatching ? 'MATCHES (Active)' : 'NO MATCH'}`}
                        >
                          {isMatching ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <XCircle className="w-2.5 h-2.5 text-slate-500" />}
                          <span>{isMatching ? 'MATCH' : 'OFF'}</span>
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <span>{ConditionalFormattingEngine.getRuleSummary(rule)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Style Preview Swatch */}
                  <div
                    style={{
                      color: rule.textColor || '#0f172a',
                      backgroundColor: rule.backgroundColor || '#ffffff',
                      fontWeight: rule.fontWeight || 'normal',
                      borderColor: rule.borderColor || 'transparent',
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] border shadow-xs flex items-center gap-1 shrink-0 max-w-[80px] truncate"
                  >
                    {rule.icon && ICONS_MAP[rule.icon]}
                    <span className="truncate">Sample</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDuplicateRule(rule)}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded"
                      title="Duplicate rule"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Rule Configuration Form */}
                {isExpanded && (
                  <div className="p-3 border-t border-slate-800 bg-slate-950/90 rounded-b-lg space-y-3 text-xs">
                    {/* 1. Rule Name */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Rule Description / Name</label>
                      <input
                        type="text"
                        value={rule.name || ''}
                        onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                        placeholder="e.g. High Revenue Alert"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                      />
                    </div>

                    {/* 2. Condition Logic Target & Operator */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Target Data Field</label>
                        <select
                          value={rule.targetField || '__self__'}
                          onChange={(e) => handleUpdateRule(rule.id, { targetField: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono"
                        >
                          <option value="__self__">Bound Value / Current Element</option>
                          {fields.map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.displayName} ({f.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Condition Operator</label>
                        <select
                          value={rule.operator || 'gt'}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, {
                              operator: e.target.value as RuleOperator,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="gt">&gt; Greater than</option>
                          <option value="gte">≥ Greater or equal</option>
                          <option value="lt">&lt; Less than</option>
                          <option value="lte">≤ Less or equal</option>
                          <option value="eq">== Equals to</option>
                          <option value="neq">!= Not equal to</option>
                          <option value="between">Between (min ... max)</option>
                          <option value="contains">Contains text</option>
                          <option value="notContains">Does not contain</option>
                          <option value="startsWith">Starts with</option>
                          <option value="endsWith">Ends with</option>
                          <option value="empty">Is Empty / Null</option>
                          <option value="notEmpty">Is Not Empty</option>
                          <option value="expression">Custom Expression (Formula)</option>
                        </select>
                      </div>
                    </div>

                    {/* 3. Threshold Value / Expression */}
                    {rule.operator === 'expression' ? (
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Formula Expression</label>
                        <input
                          type="text"
                          value={rule.condition || ''}
                          onChange={(e) => handleUpdateRule(rule.id, { condition: e.target.value })}
                          placeholder="e.g. value > 1000 or {gross_revenue} < 50000"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300"
                        />
                      </div>
                    ) : rule.operator === 'between' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Min Threshold</label>
                          <input
                            type="number"
                            value={rule.value ?? 0}
                            onChange={(e) => handleUpdateRule(rule.id, { value: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Max Threshold</label>
                          <input
                            type="number"
                            value={rule.valueSecondary ?? 1000}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { valueSecondary: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200"
                          />
                        </div>
                      </div>
                    ) : rule.operator !== 'empty' && rule.operator !== 'notEmpty' ? (
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Compare Threshold Value</label>
                        <input
                          type="text"
                          value={rule.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            // auto parse numbers if numeric
                            const num = Number(val);
                            handleUpdateRule(rule.id, { value: !isNaN(num) && val.trim() !== '' ? num : val });
                          }}
                          placeholder="e.g. 1000 or 'Pending'"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200"
                        />
                      </div>
                    ) : null}

                    {/* 4. Action Styles (Colors & Typography) */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                        <Palette className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Style Overrides when Condition is True</span>
                      </div>

                      {/* Quick Color Palette Presets */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Preset Palette</span>
                        <div className="flex flex-wrap gap-1">
                          {COLOR_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() =>
                                handleUpdateRule(rule.id, {
                                  textColor: preset.text,
                                  backgroundColor: preset.bg,
                                })
                              }
                              style={{ color: preset.text, backgroundColor: preset.bg }}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold border border-black/10 hover:scale-105 transition"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Text & Background Color Custom Pickers */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Text Color</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={rule.textColor || '#dc2626'}
                              onChange={(e) => handleUpdateRule(rule.id, { textColor: e.target.value })}
                              className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-slate-300">
                              {rule.textColor || '#dc2626'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Background Highlight</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={rule.backgroundColor || '#fee2e2'}
                              onChange={(e) => handleUpdateRule(rule.id, { backgroundColor: e.target.value })}
                              className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-slate-300">
                              {rule.backgroundColor || '#fee2e2'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Font Weight & Style */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Font Weight</label>
                          <select
                            value={rule.fontWeight || 'bold'}
                            onChange={(e) => handleUpdateRule(rule.id, { fontWeight: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="normal">Normal</option>
                            <option value="600">Semi-Bold</option>
                            <option value="bold">Bold</option>
                            <option value="800">Extra-Bold</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Status Icon / Indicator</label>
                          <select
                            value={rule.icon || 'alert'}
                            onChange={(e) => handleUpdateRule(rule.id, { icon: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="">None</option>
                            <option value="alert">⚠️ Alert Warning</option>
                            <option value="check">🟢 Check / Completed</option>
                            <option value="trending-up">⬆️ Trending High</option>
                            <option value="trending-down">⬇️ Trending Low</option>
                            <option value="flame">🔥 Urgent / Hot</option>
                            <option value="zap">⚡ Priority</option>
                            <option value="flag">🚩 Flagged</option>
                          </select>
                        </div>
                      </div>

                      {/* Dynamic Visibility */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="text-[11px] text-slate-400 flex items-center gap-1">
                          {rule.hideElement ? <EyeOff className="w-3 h-3 text-rose-400" /> : <Eye className="w-3 h-3 text-slate-500" />}
                          <span>Hide Element when matched</span>
                        </label>
                        <input
                          type="checkbox"
                          checked={rule.hideElement || false}
                          onChange={(e) => handleUpdateRule(rule.id, { hideElement: e.target.checked })}
                          className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* 5. Real-Time Interactive Test Sandbox */}
                    <div className="pt-2 border-t border-slate-800 bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-300 flex items-center gap-1">
                          <TestTube className="w-3 h-3 text-cyan-400" />
                          <span>Real-Time Rule Evaluator</span>
                        </span>
                        <span className="text-slate-400">
                          Live Data: <strong className="text-cyan-300">{String(targetValToTest ?? '—')}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={testValueInput}
                          onChange={(e) => setTestValueInput(e.target.value)}
                          placeholder="Test value (e.g. 1500, 500, -20)..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] font-mono text-slate-200"
                        />
                        {testValueInput && (
                          <button
                            type="button"
                            onClick={() => setTestValueInput('')}
                            className="text-[10px] text-slate-400 hover:text-slate-200 px-1"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-slate-400">Evaluated Output:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            isMatching
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-900'
                          }`}
                        >
                          {isMatching ? '✅ RULE ACTIVE (Styled in Red/Highlight)' : '❌ NO MATCH (Default Style)'}
                        </span>
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
  );
};
