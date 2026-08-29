/**
 * Enterprise Report Formula Engine
 * Crystal Reports-style expression parser, evaluator, and aggregator.
 */

export class FormulaEngine {
  /**
   * Evaluates a formula expression within a specific row context and dataset context.
   */
  public static evaluate(
    expression: string,
    currentRow: Record<string, any> = {},
    dataset: Record<string, any>[] = [],
    parameters: Record<string, any> = {},
    namedFormulas: Record<string, string> = {}
  ): any {
    if (!expression || typeof expression !== 'string') return '';

    let expr = expression.trim();

    // Check if it's a simple named formula reference: @FormulaName
    if (expr.startsWith('@')) {
      const formulaName = expr.slice(1);
      if (namedFormulas[formulaName]) {
        return this.evaluate(namedFormulas[formulaName], currentRow, dataset, parameters, namedFormulas);
      }
    }

    // 1. Handle Aggregations over dataset: SUM(field), AVG(field), COUNT(field), MIN(field), MAX(field)
    expr = this.resolveAggregations(expr, dataset);

    // 2. Replace parameter placeholders: {?ParamName} or {param.name}
    expr = expr.replace(/\{\?([a-zA-Z0-9_]+)\}/g, (_, paramName) => {
      const val = parameters[paramName];
      return typeof val === 'string' ? `"${val}"` : (val ?? 0);
    });

    // 3. Replace field placeholders: {field_name} or {table.field_name}
    expr = expr.replace(/\{([a-zA-Z0-9_.]+)\}/g, (_, fieldPath) => {
      const val = this.getNestedValue(currentRow, fieldPath);
      if (typeof val === 'string') return `"${val}"`;
      if (typeof val === 'number') return val.toString();
      if (typeof val === 'boolean') return val.toString();
      return (val !== undefined && val !== null) ? `"${val}"` : '""';
    });

    // 4. Handle built-in helper functions
    // CURRENCY(val) or FORMAT_CURRENCY(val)
    expr = expr.replace(/CURRENCY\(([^)]+)\)/gi, (_, valExpr) => {
      const v = this.safeMathEval(valExpr);
      return `"${this.formatCurrency(v)}"`;
    });

    // ROUND(val, decimals)
    expr = expr.replace(/ROUND\(([^,]+),?\s*([^)]*)\)/gi, (_, valExpr, decExpr) => {
      const v = this.safeMathEval(valExpr);
      const dec = decExpr ? parseInt(decExpr, 10) : 2;
      return Number(v).toFixed(dec);
    });

    // IF(condition, trueVal, falseVal) / IIF
    const ifRegex = /(?:IF|IIF)\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi;
    let match;
    while ((match = ifRegex.exec(expr)) !== null) {
      const [fullMatch, cond, trueVal, falseVal] = match;
      try {
        const condResult = this.safeEvalBoolean(cond);
        const replacement = condResult ? trueVal.trim() : falseVal.trim();
        expr = expr.replace(fullMatch, replacement);
        ifRegex.lastIndex = 0; // reset regex
      } catch {
        break;
      }
    }

    // 5. If expression is purely mathematical or boolean, safely evaluate it
    try {
      if (/^[-+*/%0-9. ()<>=!&|?:]+$/.test(expr)) {
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict"; return (${expr});`)();
        return result;
      }
    } catch {
      // Return expression as string if math evaluation fails
    }

    // Remove wrapping quotes if it's a pure string
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    return expr;
  }

  /**
   * Resolves dataset-level aggregations e.g. SUM(revenue), AVG(margin)
   */
  private static resolveAggregations(expr: string, dataset: Record<string, any>[]): string {
    const aggRegex = /(SUM|AVG|COUNT|MIN|MAX)\(([a-zA-Z0-9_.]+)\)/gi;
    return expr.replace(aggRegex, (_, func, field) => {
      const fUpper = func.toUpperCase();
      if (!dataset || dataset.length === 0) return '0';

      const values = dataset
        .map((row) => Number(this.getNestedValue(row, field)))
        .filter((v) => !isNaN(v));

      if (fUpper === 'COUNT') return dataset.length.toString();
      if (values.length === 0) return '0';

      switch (fUpper) {
        case 'SUM': {
          const sum = values.reduce((a, b) => a + b, 0);
          return sum.toString();
        }
        case 'AVG': {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          return avg.toString();
        }
        case 'MIN':
          return Math.min(...values).toString();
        case 'MAX':
          return Math.max(...values).toString();
        default:
          return '0';
      }
    });
  }

  private static getNestedValue(obj: Record<string, any>, path: string): any {
    if (!obj) return undefined;
    if (path in obj) return obj[path];
    const parts = path.split('.');
    let cur: any = obj;
    for (const part of parts) {
      if (cur === undefined || cur === null) return undefined;
      cur = cur[part];
    }
    return cur;
  }

  private static safeMathEval(expr: string): number {
    try {
      const clean = expr.replace(/[^0-9.+\-*/%()]/g, '');
      if (!clean) return 0;
      // eslint-disable-next-line no-eval
      return Number(Function(`"use strict"; return (${clean});`)()) || 0;
    } catch {
      return 0;
    }
  }

  private static safeEvalBoolean(expr: string): boolean {
    try {
      // replace = with == if single = used for equality
      const sanitized = expr.replace(/(?<![!=><])=(?!=)/g, '==');
      // eslint-disable-next-line no-eval
      return Boolean(Function(`"use strict"; return (${sanitized});`)());
    } catch {
      return false;
    }
  }

  public static formatValue(val: any, format?: string, prefix = '', suffix = ''): string {
    if (val === undefined || val === null || val === '') return '—';

    let formatted = val;
    if (format === 'currency') {
      formatted = this.formatCurrency(val);
    } else if (format === 'number') {
      const num = Number(val);
      formatted = isNaN(num) ? val : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else if (format === 'percentage') {
      const num = Number(val);
      formatted = isNaN(num) ? val : `${(num > 1 ? num : num * 100).toFixed(1)}%`;
    } else if (format === 'date') {
      try {
        const d = new Date(val);
        formatted = isNaN(d.getTime()) ? val : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        formatted = val;
      }
    } else if (format === 'uppercase') {
      formatted = String(val).toUpperCase();
    } else if (format === 'lowercase') {
      formatted = String(val).toLowerCase();
    }

    return `${prefix}${formatted}${suffix}`;
  }

  public static formatCurrency(val: any, currency = 'USD'): string {
    const num = Number(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
}
