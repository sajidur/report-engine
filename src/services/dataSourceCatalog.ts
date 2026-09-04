import { ReportDataSource, DataSourceField, TableColumn, ReportTemplate } from '../types/report';
import { 
  INITIAL_SALES_DATA, 
  INITIAL_LEDGER_DATA, 
  INITIAL_INVENTORY_DATA, 
  INITIAL_HR_PAYROLL_DATA, 
  INITIAL_SAAS_DATA 
} from './mysqlMockData';

export const ENTERPRISE_DATA_SOURCES: ReportDataSource[] = [
  {
    id: 'ds-sales-mysql',
    name: 'MySQL Sales Transactions',
    type: 'mysql',
    query: `SELECT id, order_number, customer_name, region, product_category, units, unit_price, gross_revenue, cost_of_goods, net_profit, tax_amount, status, order_date \nFROM sales_transactions \nORDER BY order_date DESC;`,
    fields: [
      { name: 'id', type: 'number', displayName: 'ID' },
      { name: 'order_number', type: 'string', displayName: 'Order Number' },
      { name: 'customer_name', type: 'string', displayName: 'Customer Name' },
      { name: 'region', type: 'string', displayName: 'Region' },
      { name: 'product_category', type: 'string', displayName: 'Category' },
      { name: 'units', type: 'number', displayName: 'Units' },
      { name: 'unit_price', type: 'currency', displayName: 'Unit Price' },
      { name: 'gross_revenue', type: 'currency', displayName: 'Gross Revenue' },
      { name: 'cost_of_goods', type: 'currency', displayName: 'Cost of Goods' },
      { name: 'net_profit', type: 'currency', displayName: 'Net Profit' },
      { name: 'tax_amount', type: 'currency', displayName: 'Tax Amount' },
      { name: 'status', type: 'string', displayName: 'Status' },
      { name: 'order_date', type: 'date', displayName: 'Order Date' },
    ],
    data: INITIAL_SALES_DATA,
    liveStreamInterval: 2500,
  },
  {
    id: 'ds-financial-ledger',
    name: 'General Financial Ledger',
    type: 'mysql',
    query: `SELECT account_code, account_name, category, q1_actual, q2_actual, q3_actual, q4_forecast, ytd_total, budget_variance_pct \nFROM financial_ledger \nORDER BY account_code ASC;`,
    fields: [
      { name: 'account_code', type: 'string', displayName: 'Account Code' },
      { name: 'account_name', type: 'string', displayName: 'Account Title' },
      { name: 'category', type: 'string', displayName: 'Category' },
      { name: 'q1_actual', type: 'currency', displayName: 'Q1 Actual' },
      { name: 'q2_actual', type: 'currency', displayName: 'Q2 Actual' },
      { name: 'q3_actual', type: 'currency', displayName: 'Q3 Actual' },
      { name: 'q4_forecast', type: 'currency', displayName: 'Q4 Forecast' },
      { name: 'ytd_total', type: 'currency', displayName: 'YTD Total' },
      { name: 'budget_variance_pct', type: 'number', displayName: 'Variance %' },
    ],
    data: INITIAL_LEDGER_DATA,
    liveStreamInterval: 3000,
  },
  {
    id: 'ds-inventory-stock',
    name: 'Warehouse & Inventory Stock',
    type: 'mysql',
    query: `SELECT sku, item_name, warehouse_location, stock_on_hand, reorder_threshold, unit_cost, total_valuation, stock_status \nFROM inventory_items \nORDER BY sku ASC;`,
    fields: [
      { name: 'sku', type: 'string', displayName: 'SKU' },
      { name: 'item_name', type: 'string', displayName: 'Item Name' },
      { name: 'warehouse_location', type: 'string', displayName: 'Warehouse Hub' },
      { name: 'stock_on_hand', type: 'number', displayName: 'Stock On Hand' },
      { name: 'reorder_threshold', type: 'number', displayName: 'Reorder Point' },
      { name: 'unit_cost', type: 'currency', displayName: 'Unit Cost' },
      { name: 'total_valuation', type: 'currency', displayName: 'Total Valuation' },
      { name: 'stock_status', type: 'string', displayName: 'Stock Status' },
    ],
    data: INITIAL_INVENTORY_DATA,
    liveStreamInterval: 3500,
  },
  {
    id: 'ds-hr-payroll',
    name: 'HR & Employee Payroll',
    type: 'mysql',
    query: `SELECT emp_id, employee_name, department, role_title, base_salary, bonus, tax_deductions, net_pay, pay_status \nFROM hr_payroll \nORDER BY emp_id ASC;`,
    fields: [
      { name: 'emp_id', type: 'string', displayName: 'Employee ID' },
      { name: 'employee_name', type: 'string', displayName: 'Employee Name' },
      { name: 'department', type: 'string', displayName: 'Department' },
      { name: 'role_title', type: 'string', displayName: 'Role' },
      { name: 'base_salary', type: 'currency', displayName: 'Base Salary' },
      { name: 'bonus', type: 'currency', displayName: 'Bonus' },
      { name: 'tax_deductions', type: 'currency', displayName: 'Tax Deductions' },
      { name: 'net_pay', type: 'currency', displayName: 'Net Pay' },
      { name: 'pay_status', type: 'string', displayName: 'Status' },
    ],
    data: INITIAL_HR_PAYROLL_DATA,
    liveStreamInterval: 4000,
  },
  {
    id: 'ds-saas-metrics',
    name: 'SaaS Subscription Metrics',
    type: 'mysql',
    query: `SELECT account_name, plan_tier, mrr, arr, expansion_rate, seats_active, health_score \nFROM saas_subscriptions \nORDER BY mrr DESC;`,
    fields: [
      { name: 'account_name', type: 'string', displayName: 'Account Name' },
      { name: 'plan_tier', type: 'string', displayName: 'Plan Tier' },
      { name: 'mrr', type: 'currency', displayName: 'Monthly Recurring Revenue' },
      { name: 'arr', type: 'currency', displayName: 'Annual Recurring Revenue' },
      { name: 'expansion_rate', type: 'number', displayName: 'Expansion Rate %' },
      { name: 'seats_active', type: 'number', displayName: 'Active Seats' },
      { name: 'health_score', type: 'number', displayName: 'Health Score' },
    ],
    data: INITIAL_SAAS_DATA,
    liveStreamInterval: 3000,
  },
];

/**
 * Resolves the active data source for an element or template
 */
export function resolveElementDataSource(
  template: ReportTemplate,
  dataSourceId?: string
): ReportDataSource {
  if (dataSourceId) {
    // Check in template dataSources
    const foundInTemplate = template.dataSources.find((ds) => ds.id === dataSourceId);
    if (foundInTemplate) return foundInTemplate;

    // Check in catalog
    const foundInCatalog = ENTERPRISE_DATA_SOURCES.find((ds) => ds.id === dataSourceId);
    if (foundInCatalog) return foundInCatalog;
  }

  // Fallback to first in template, or first in catalog
  return template.dataSources[0] || ENTERPRISE_DATA_SOURCES[0];
}

/**
 * Auto-generates clean TableColumns from a DataSource
 */
export function autoGenerateColumnsForDataSource(
  dataSource: ReportDataSource,
  maxColumns: number = 6
): TableColumn[] {
  const fieldsToUse = (dataSource.fields || []).slice(0, maxColumns);
  if (fieldsToUse.length === 0) {
    return [
      { id: 'col-1', header: 'Item / ID', field: 'id', width: 25, align: 'left', format: 'text' },
      { id: 'col-2', header: 'Description', field: 'name', width: 50, align: 'left', format: 'text' },
      { id: 'col-3', header: 'Total Value', field: 'value', width: 25, align: 'right', format: 'currency', summaryType: 'sum' },
    ];
  }

  const equalWidth = Math.max(12, Math.floor(100 / fieldsToUse.length));

  return fieldsToUse.map((f, idx) => {
    let format: TableColumn['format'] = 'text';
    let align: 'left' | 'center' | 'right' = 'left';
    let summaryType: TableColumn['summaryType'] = 'none';

    if (f.type === 'currency') {
      format = 'currency';
      align = 'right';
      summaryType = 'sum';
    } else if (f.type === 'number') {
      format = 'number';
      align = 'right';
      summaryType = f.name.includes('pct') || f.name.includes('score') || f.name.includes('rate') ? 'avg' : 'sum';
    } else if (f.type === 'date') {
      format = 'date';
      align = 'center';
    } else if (f.name.toLowerCase().includes('status') || f.name.toLowerCase().includes('code')) {
      align = 'center';
      if (f.name.toLowerCase().includes('status')) format = 'badge';
    }

    return {
      id: `col-${idx + 1}-${f.name}`,
      header: f.displayName || f.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      field: f.name,
      width: equalWidth,
      align,
      format,
      summaryType,
    };
  });
}

/**
 * Creates a single TableColumn mapped to a DataSourceField
 */
export function createColumnForField(field: DataSourceField, width: number = 20): TableColumn {
  let format: TableColumn['format'] = 'text';
  let align: 'left' | 'center' | 'right' = 'left';
  let summaryType: TableColumn['summaryType'] = 'none';

  if (field.type === 'currency') {
    format = 'currency';
    align = 'right';
    summaryType = 'sum';
  } else if (field.type === 'number') {
    format = 'number';
    align = 'right';
    summaryType = field.name.includes('pct') || field.name.includes('score') || field.name.includes('rate') ? 'avg' : 'sum';
  } else if (field.type === 'date') {
    format = 'date';
    align = 'center';
  } else if (field.name.toLowerCase().includes('status')) {
    format = 'badge';
    align = 'center';
  }

  return {
    id: `col-${Date.now()}-${field.name}`,
    header: field.displayName || field.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    field: field.name,
    width,
    align,
    format,
    summaryType,
  };
}
