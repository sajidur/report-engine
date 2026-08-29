import { ConditionalFormattingRule, ReportElement, TableColumn } from '../types/report';
import { FormulaEngine } from './formulaEngine';
import React from 'react';

export interface EvaluatedRuleResult {
  style: React.CSSProperties;
  matchedRules: ConditionalFormattingRule[];
  isHidden: boolean;
  badge?: boolean;
  badgeText?: string;
  icon?: string;
}

export interface PresetRuleDefinition {
  id: string;
  name: string;
  description: string;
  rule: Omit<ConditionalFormattingRule, 'id'>;
}

export class ConditionalFormattingEngine {
  /**
   * Evaluates a single rule against a given value and context.
   */
  public static evaluateRule(
    rule: ConditionalFormattingRule,
    value: any,
    rowContext: Record<string, any> = {},
    dataset: Record<string, any>[] = []
  ): boolean {
    if (rule.enabled === false) return false;

    // Determine target value to test
    let targetVal = value;
    if (rule.targetField && rule.targetField !== '__self__' && rule.targetField !== '') {
      targetVal = rowContext[rule.targetField];
    }

    // 1. Freeform or legacy condition expression (e.g., "value > 1000" or "{gross_revenue} > 50000")
    if (rule.operator === 'expression' || (!rule.operator && rule.condition)) {
      const expr = rule.condition || '';
      if (!expr.trim()) return false;

      try {
        // Substitute `value` keyword if present
        let parsedExpr = expr;
        if (typeof targetVal === 'number' || typeof targetVal === 'boolean') {
          parsedExpr = parsedExpr.replace(/\bvalue\b/gi, String(targetVal));
        } else if (typeof targetVal === 'string') {
          parsedExpr = parsedExpr.replace(/\bvalue\b/gi, `"${targetVal}"`);
        }

        const evalResult = FormulaEngine.evaluate(
          parsedExpr,
          { ...rowContext, value: targetVal },
          dataset
        );
        return Boolean(evalResult === true || evalResult === 'true' || Number(evalResult) > 0);
      } catch {
        return false;
      }
    }

    // 2. Structured Operator Evaluation
    const op = rule.operator || 'gt';
    const threshold = rule.value;
    const thresholdSec = rule.valueSecondary;

    const numVal = Number(targetVal);
    const numThreshold = Number(threshold);
    const numThresholdSec = Number(thresholdSec);

    switch (op) {
      case 'gt':
        if (!isNaN(numVal) && !isNaN(numThreshold)) {
          return numVal > numThreshold;
        }
        return String(targetVal || '') > String(threshold || '');

      case 'gte':
        if (!isNaN(numVal) && !isNaN(numThreshold)) {
          return numVal >= numThreshold;
        }
        return String(targetVal || '') >= String(threshold || '');

      case 'lt':
        if (!isNaN(numVal) && !isNaN(numThreshold)) {
          return numVal < numThreshold;
        }
        return String(targetVal || '') < String(threshold || '');

      case 'lte':
        if (!isNaN(numVal) && !isNaN(numThreshold)) {
          return numVal <= numThreshold;
        }
        return String(targetVal || '') <= String(threshold || '');

      case 'eq': {
        if (targetVal === undefined || targetVal === null) {
          return threshold === '' || threshold === undefined || threshold === null;
        }
        if (!isNaN(numVal) && !isNaN(numThreshold) && threshold !== '') {
          return numVal === numThreshold;
        }
        return String(targetVal).trim().toLowerCase() === String(threshold ?? '').trim().toLowerCase();
      }

      case 'neq': {
        if (!isNaN(numVal) && !isNaN(numThreshold) && threshold !== '') {
          return numVal !== numThreshold;
        }
        return String(targetVal ?? '').trim().toLowerCase() !== String(threshold ?? '').trim().toLowerCase();
      }

      case 'contains':
        return String(targetVal ?? '')
          .toLowerCase()
          .includes(String(threshold ?? '').toLowerCase());

      case 'notContains':
        return !String(targetVal ?? '')
          .toLowerCase()
          .includes(String(threshold ?? '').toLowerCase());

      case 'startsWith':
        return String(targetVal ?? '')
          .toLowerCase()
          .startsWith(String(threshold ?? '').toLowerCase());

      case 'endsWith':
        return String(targetVal ?? '')
          .toLowerCase()
          .endsWith(String(threshold ?? '').toLowerCase());

      case 'between':
        if (!isNaN(numVal) && !isNaN(numThreshold) && !isNaN(numThresholdSec)) {
          const min = Math.min(numThreshold, numThresholdSec);
          const max = Math.max(numThreshold, numThresholdSec);
          return numVal >= min && numVal <= max;
        }
        return false;

      case 'empty':
        return targetVal === undefined || targetVal === null || String(targetVal).trim() === '';

      case 'notEmpty':
        return targetVal !== undefined && targetVal !== null && String(targetVal).trim() !== '';

      default:
        return false;
    }
  }

  /**
   * Evaluates all conditional formatting rules for a report element and aggregates styles.
   */
  public static evaluateElementRules(
    element: ReportElement,
    rowContext: Record<string, any> = {},
    dataset: Record<string, any>[] = [],
    resolvedContentVal?: any
  ): EvaluatedRuleResult {
    const rules = element.conditionalRules || [];
    const matchedRules: ConditionalFormattingRule[] = [];
    const dynamicStyle: React.CSSProperties = {};
    let isHidden = false;
    let badge: boolean | undefined = undefined;
    let badgeText: string | undefined = undefined;
    let icon: string | undefined = undefined;

    if (rules.length === 0) {
      return {
        style: dynamicStyle,
        matchedRules,
        isHidden: false,
      };
    }

    // Determine the base value of the element
    let elementValue = resolvedContentVal;
    if (elementValue === undefined) {
      if (element.type === 'field' && element.fieldBinding) {
        elementValue = rowContext[element.fieldBinding];
      } else if (element.type === 'formula' && element.formula) {
        elementValue = FormulaEngine.evaluate(element.formula, rowContext, dataset);
      } else if (element.type === 'kpi' && element.kpiValueField) {
        elementValue = rowContext[element.kpiValueField];
      } else if (element.type === 'text') {
        elementValue = element.content;
      }
    }

    // Evaluate rules sequentially (higher priority rules can override lower priority)
    for (const rule of rules) {
      if (rule.enabled === false) continue;

      const isMatch = this.evaluateRule(rule, elementValue, rowContext, dataset);
      if (isMatch) {
        matchedRules.push(rule);

        if (rule.textColor) {
          dynamicStyle.color = rule.textColor;
        }
        if (rule.backgroundColor) {
          dynamicStyle.backgroundColor = rule.backgroundColor;
        }
        if (rule.fontWeight) {
          dynamicStyle.fontWeight = rule.fontWeight;
        }
        if (rule.fontStyle) {
          dynamicStyle.fontStyle = rule.fontStyle;
        }
        if (rule.textDecoration && rule.textDecoration !== 'none') {
          dynamicStyle.textDecoration = rule.textDecoration;
        }
        if (rule.borderColor) {
          dynamicStyle.borderColor = rule.borderColor;
          dynamicStyle.borderWidth = `${rule.borderWidth || 1}px`;
          dynamicStyle.borderStyle = rule.borderStyle || 'solid';
        }
        if (rule.badge !== undefined) {
          badge = rule.badge;
        }
        if (rule.badgeText) {
          badgeText = rule.badgeText;
        }
        if (rule.icon) {
          icon = rule.icon;
        }
        if (rule.hideElement) {
          isHidden = true;
        }
      }
    }

    return {
      style: dynamicStyle,
      matchedRules,
      isHidden,
      badge,
      badgeText,
      icon,
    };
  }

  /**
   * Evaluates rules for a table cell column.
   */
  public static evaluateColumnRules(
    column: TableColumn,
    cellValue: any,
    rowContext: Record<string, any> = {},
    dataset: Record<string, any>[] = []
  ): EvaluatedRuleResult {
    const rules = column.conditionalRules || [];
    const matchedRules: ConditionalFormattingRule[] = [];
    const dynamicStyle: React.CSSProperties = {};
    let isHidden = false;
    let badge: boolean | undefined = undefined;
    let badgeText: string | undefined = undefined;
    let icon: string | undefined = undefined;

    for (const rule of rules) {
      if (rule.enabled === false) continue;

      const isMatch = this.evaluateRule(rule, cellValue, rowContext, dataset);
      if (isMatch) {
        matchedRules.push(rule);

        if (rule.textColor) dynamicStyle.color = rule.textColor;
        if (rule.backgroundColor) dynamicStyle.backgroundColor = rule.backgroundColor;
        if (rule.fontWeight) dynamicStyle.fontWeight = rule.fontWeight;
        if (rule.fontStyle) dynamicStyle.fontStyle = rule.fontStyle;
        if (rule.textDecoration) dynamicStyle.textDecoration = rule.textDecoration;
        if (rule.borderColor) {
          dynamicStyle.borderColor = rule.borderColor;
          dynamicStyle.borderWidth = `${rule.borderWidth || 1}px`;
          dynamicStyle.borderStyle = rule.borderStyle || 'solid';
        }
        if (rule.badge !== undefined) badge = rule.badge;
        if (rule.badgeText) badgeText = rule.badgeText;
        if (rule.icon) icon = rule.icon;
        if (rule.hideElement) isHidden = true;
      }
    }

    return {
      style: dynamicStyle,
      matchedRules,
      isHidden,
      badge,
      badgeText,
      icon,
    };
  }

  /**
   * Generates a human-friendly summary for a conditional rule.
   */
  public static getRuleSummary(rule: ConditionalFormattingRule): string {
    if (rule.name) return rule.name;

    const fieldLabel = rule.targetField && rule.targetField !== '__self__' ? rule.targetField : 'value';

    if (rule.operator === 'expression') {
      return `If (${rule.condition || 'expression'}) ➔ styled`;
    }

    let condText = '';
    switch (rule.operator) {
      case 'gt':
        condText = `${fieldLabel} > ${rule.value ?? '?'}`;
        break;
      case 'gte':
        condText = `${fieldLabel} ≥ ${rule.value ?? '?'}`;
        break;
      case 'lt':
        condText = `${fieldLabel} < ${rule.value ?? '?'}`;
        break;
      case 'lte':
        condText = `${fieldLabel} ≤ ${rule.value ?? '?'}`;
        break;
      case 'eq':
        condText = `${fieldLabel} == "${rule.value ?? ''}"`;
        break;
      case 'neq':
        condText = `${fieldLabel} != "${rule.value ?? ''}"`;
        break;
      case 'contains':
        condText = `${fieldLabel} contains "${rule.value ?? ''}"`;
        break;
      case 'notContains':
        condText = `${fieldLabel} !contains "${rule.value ?? ''}"`;
        break;
      case 'between':
        condText = `${fieldLabel} between ${rule.value ?? 0} & ${rule.valueSecondary ?? 0}`;
        break;
      case 'empty':
        condText = `${fieldLabel} is empty`;
        break;
      case 'notEmpty':
        condText = `${fieldLabel} is not empty`;
        break;
      default:
        condText = rule.condition || `${fieldLabel} condition`;
    }

    const actions: string[] = [];
    if (rule.textColor) actions.push(rule.textColor === '#ef4444' || rule.textColor === '#dc2626' ? 'red text' : 'custom text color');
    if (rule.backgroundColor) actions.push('highlight bg');
    if (rule.fontWeight === 'bold' || rule.fontWeight === '800') actions.push('bold');
    if (rule.hideElement) actions.push('hide');

    return `If ${condText} ➔ ${actions.join(', ') || 'custom style'}`;
  }

  /**
   * Pre-configured enterprise rule presets.
   */
  public static readonly RULE_PRESETS: PresetRuleDefinition[] = [
    {
      id: 'high-value-red',
      name: 'High Threshold Alert (Value > 1,000 ➔ Red text)',
      description: 'Highlights values exceeding 1,000 in bold crimson alert text',
      rule: {
        name: 'High Value Threshold Alert',
        enabled: true,
        targetField: '__self__',
        operator: 'gt',
        value: 1000,
        textColor: '#dc2626',
        backgroundColor: '#fef2f2',
        fontWeight: 'bold',
        icon: 'alert',
      },
    },
    {
      id: 'negative-red',
      name: 'Negative Number Alert (Value < 0 ➔ Red text)',
      description: 'Detects losses or deficit figures below 0 and renders in red',
      rule: {
        name: 'Negative Balance Alert',
        enabled: true,
        targetField: '__self__',
        operator: 'lt',
        value: 0,
        textColor: '#ef4444',
        backgroundColor: '#fee2e2',
        fontWeight: 'bold',
        icon: 'alert',
      },
    },
    {
      id: 'top-performer-green',
      name: 'Top Tier / High Growth (Value ≥ 50,000 ➔ Emerald Green)',
      description: 'Applies celebratory emerald styling with bold text and soft green background',
      rule: {
        name: 'Top Performer Tier',
        enabled: true,
        targetField: '__self__',
        operator: 'gte',
        value: 50000,
        textColor: '#059669',
        backgroundColor: '#ecfdf5',
        fontWeight: 'bold',
        icon: 'trending-up',
      },
    },
    {
      id: 'status-pending-amber',
      name: 'Pending Status Warning (Status == "Pending" ➔ Amber)',
      description: 'Flags pending or unfulfilled items with amber warning background',
      rule: {
        name: 'Pending Status Highlight',
        enabled: true,
        targetField: 'status',
        operator: 'eq',
        value: 'Pending',
        textColor: '#d97706',
        backgroundColor: '#fffbeb',
        fontWeight: '600',
        icon: 'flag',
        badge: true,
      },
    },
    {
      id: 'status-completed-emerald',
      name: 'Completed Status (Status == "Completed" ➔ Green Badge)',
      description: 'Applies verified green styling for completed or delivered orders',
      rule: {
        name: 'Completed Status Badge',
        enabled: true,
        targetField: 'status',
        operator: 'eq',
        value: 'Completed',
        textColor: '#15803d',
        backgroundColor: '#dcfce7',
        fontWeight: '600',
        icon: 'check',
        badge: true,
      },
    },
    {
      id: 'low-margin-risk',
      name: 'Low Margin Risk (Margin < 0.15 ➔ Rose Alert)',
      description: 'Flags profit margins lower than 15% in soft rose highlight',
      rule: {
        name: 'Low Margin Risk',
        enabled: true,
        targetField: 'profit_margin',
        operator: 'lt',
        value: 0.15,
        textColor: '#e11d48',
        backgroundColor: '#ffe4e6',
        fontWeight: 'bold',
        icon: 'trending-down',
      },
    },
  ];
}
