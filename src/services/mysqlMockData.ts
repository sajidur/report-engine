/**
 * Realistic MySQL Enterprise Analytics Database & Query Engine Simulator
 */

export interface MySqlTableSchema {
  name: string;
  comment: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    isPrimary?: boolean;
    isForeign?: boolean;
    comment: string;
  }[];
}

export const MYSQL_SCHEMAS: MySqlTableSchema[] = [
  {
    name: 'sales_transactions',
    comment: 'Core ERP sales order transactions with customer, product, and margin data',
    columns: [
      { name: 'id', type: 'INT AUTO_INCREMENT', nullable: false, isPrimary: true, comment: 'Primary key' },
      { name: 'order_number', type: 'VARCHAR(20)', nullable: false, comment: 'Invoice / Order # (e.g. INV-2025-001)' },
      { name: 'customer_id', type: 'INT', nullable: false, isForeign: true, comment: 'Customer reference' },
      { name: 'customer_name', type: 'VARCHAR(100)', nullable: false, comment: 'Customer enterprise title' },
      { name: 'region', type: 'ENUM(\'North America\',\'EMEA\',\'APAC\',\'LATAM\')', nullable: false, comment: 'Sales territory' },
      { name: 'product_category', type: 'VARCHAR(50)', nullable: false, comment: 'Hardware, SaaS, Cloud, Services' },
      { name: 'units', type: 'INT', nullable: false, comment: 'Quantity shipped' },
      { name: 'unit_price', type: 'DECIMAL(12,2)', nullable: false, comment: 'Base unit price' },
      { name: 'gross_revenue', type: 'DECIMAL(14,2)', nullable: false, comment: 'Gross revenue' },
      { name: 'cost_of_goods', type: 'DECIMAL(14,2)', nullable: false, comment: 'COGS' },
      { name: 'net_profit', type: 'DECIMAL(14,2)', nullable: false, comment: 'Gross revenue - COGS' },
      { name: 'tax_amount', type: 'DECIMAL(10,2)', nullable: false, comment: 'Applicable sales tax / VAT' },
      { name: 'status', type: 'ENUM(\'Completed\',\'Processing\',\'Shipped\',\'Pending Review\')', nullable: false, comment: 'Fulfillment status' },
      { name: 'order_date', type: 'DATETIME', nullable: false, comment: 'Timestamp of transaction' },
    ],
  },
  {
    name: 'financial_ledger',
    comment: 'General ledger account balances for P&L, balance sheet, and financial reporting',
    columns: [
      { name: 'account_code', type: 'VARCHAR(10)', nullable: false, isPrimary: true, comment: 'GAAP Account Code (e.g. 4000)' },
      { name: 'account_name', type: 'VARCHAR(100)', nullable: false, comment: 'Account Title' },
      { name: 'category', type: 'VARCHAR(50)', nullable: false, comment: 'Operating Revenue, Operating Expenses, COGS, Tax' },
      { name: 'q1_actual', type: 'DECIMAL(14,2)', nullable: false, comment: 'Q1 Balance' },
      { name: 'q2_actual', type: 'DECIMAL(14,2)', nullable: false, comment: 'Q2 Balance' },
      { name: 'q3_actual', type: 'DECIMAL(14,2)', nullable: false, comment: 'Q3 Balance' },
      { name: 'q4_forecast', type: 'DECIMAL(14,2)', nullable: false, comment: 'Q4 Projection' },
      { name: 'ytd_total', type: 'DECIMAL(14,2)', nullable: false, comment: 'YTD Total' },
      { name: 'budget_variance_pct', type: 'DECIMAL(5,2)', nullable: false, comment: '% Variance against budget' },
    ],
  },
  {
    name: 'inventory_items',
    comment: 'Warehouse supply chain items with SKU, stock levels, and replenishment status',
    columns: [
      { name: 'sku', type: 'VARCHAR(20)', nullable: false, isPrimary: true, comment: 'Stock Keeping Unit' },
      { name: 'item_name', type: 'VARCHAR(100)', nullable: false, comment: 'Product Name' },
      { name: 'warehouse_location', type: 'VARCHAR(50)', nullable: false, comment: 'Hub Location (e.g. Chicago Hub A)' },
      { name: 'stock_on_hand', type: 'INT', nullable: false, comment: 'Current quantity in warehouse' },
      { name: 'reorder_threshold', type: 'INT', nullable: false, comment: 'Minimum stock alert level' },
      { name: 'unit_cost', type: 'DECIMAL(10,2)', nullable: false, comment: 'Standard procurement cost' },
      { name: 'total_valuation', type: 'DECIMAL(14,2)', nullable: false, comment: 'stock_on_hand * unit_cost' },
      { name: 'stock_status', type: 'VARCHAR(20)', nullable: false, comment: 'Optimal, Low Stock, Critical, Overstocked' },
    ],
  },
  {
    name: 'hr_payroll_records',
    comment: 'Corporate employee compensation, salary grades, deductions, and tax withholdings',
    columns: [
      { name: 'emp_id', type: 'VARCHAR(12)', nullable: false, isPrimary: true, comment: 'Employee ID' },
      { name: 'employee_name', type: 'VARCHAR(80)', nullable: false, comment: 'Full Name' },
      { name: 'department', type: 'VARCHAR(50)', nullable: false, comment: 'Engineering, Product, Sales, Finance, Legal' },
      { name: 'role_title', type: 'VARCHAR(60)', nullable: false, comment: 'Job Title' },
      { name: 'base_salary', type: 'DECIMAL(12,2)', nullable: false, comment: 'Monthly Base' },
      { name: 'bonus', type: 'DECIMAL(10,2)', nullable: false, comment: 'Performance Incentive' },
      { name: 'tax_deductions', type: 'DECIMAL(10,2)', nullable: false, comment: 'Tax & Social Security' },
      { name: 'net_pay', type: 'DECIMAL(12,2)', nullable: false, comment: 'Net Take Home' },
      { name: 'pay_status', type: 'VARCHAR(20)', nullable: false, comment: 'Direct Deposit Approved' },
    ],
  },
  {
    name: 'saas_subscription_metrics',
    comment: 'SaaS recurring revenue, cohort churn rate, customer expansion, and LTV',
    columns: [
      { name: 'account_name', type: 'VARCHAR(80)', nullable: false, comment: 'Customer Name' },
      { name: 'plan_tier', type: 'VARCHAR(30)', nullable: false, comment: 'Enterprise, Business, Scale' },
      { name: 'mrr', type: 'DECIMAL(10,2)', nullable: false, comment: 'Monthly Recurring Revenue' },
      { name: 'arr', type: 'DECIMAL(12,2)', nullable: false, comment: 'Annual Recurring Revenue' },
      { name: 'expansion_rate', type: 'DECIMAL(5,2)', nullable: false, comment: 'Net Revenue Retention %' },
      { name: 'seats_active', type: 'INT', nullable: false, comment: 'Active Provisioned Seats' },
      { name: 'health_score', type: 'INT', nullable: false, comment: 'Product Engagement Score (0-100)' },
    ],
  },
];

export const INITIAL_SALES_DATA = [
  {
    id: 101,
    order_number: 'INV-2025-8812',
    customer_id: 401,
    customer_name: 'Apex Global Technologies',
    region: 'North America',
    product_category: 'Cloud Infrastructure',
    units: 45,
    unit_price: 1250.0,
    gross_revenue: 56250.0,
    cost_of_goods: 18400.0,
    net_profit: 37850.0,
    tax_amount: 4500.0,
    status: 'Completed',
    order_date: '2025-02-14 09:30:00',
  },
  {
    id: 102,
    order_number: 'INV-2025-8813',
    customer_id: 402,
    customer_name: 'Vanguard Health Systems',
    region: 'EMEA',
    product_category: 'Enterprise SaaS',
    units: 120,
    unit_price: 680.0,
    gross_revenue: 81600.0,
    cost_of_goods: 22840.0,
    net_profit: 58760.0,
    tax_amount: 6528.0,
    status: 'Completed',
    order_date: '2025-02-14 11:15:00',
  },
  {
    id: 103,
    order_number: 'INV-2025-8814',
    customer_id: 403,
    customer_name: 'Sovereign Capital Holdings',
    region: 'North America',
    product_category: 'Security & Compliance',
    units: 25,
    unit_price: 3400.0,
    gross_revenue: 85000.0,
    cost_of_goods: 24500.0,
    net_profit: 60500.0,
    tax_amount: 6800.0,
    status: 'Processing',
    order_date: '2025-02-15 14:45:00',
  },
  {
    id: 104,
    order_number: 'INV-2025-8815',
    customer_id: 404,
    customer_name: 'Nippon Data Logistics',
    region: 'APAC',
    product_category: 'Hardware Systems',
    units: 80,
    unit_price: 950.0,
    gross_revenue: 76000.0,
    cost_of_goods: 45600.0,
    net_profit: 30400.0,
    tax_amount: 6080.0,
    status: 'Completed',
    order_date: '2025-02-16 08:20:00',
  },
  {
    id: 105,
    order_number: 'INV-2025-8816',
    customer_id: 405,
    customer_name: 'Nordic Clean Energy AB',
    region: 'EMEA',
    product_category: 'Cloud Infrastructure',
    units: 60,
    unit_price: 1250.0,
    gross_revenue: 75000.0,
    cost_of_goods: 25500.0,
    net_profit: 49500.0,
    tax_amount: 6000.0,
    status: 'Completed',
    order_date: '2025-02-17 16:10:00',
  },
  {
    id: 106,
    order_number: 'INV-2025-8817',
    customer_id: 406,
    customer_name: 'Rio Plata Fintech S.A.',
    region: 'LATAM',
    product_category: 'Enterprise SaaS',
    units: 35,
    unit_price: 680.0,
    gross_revenue: 23800.0,
    cost_of_goods: 7140.0,
    net_profit: 16660.0,
    tax_amount: 1904.0,
    status: 'Shipped',
    order_date: '2025-02-18 10:05:00',
  },
  {
    id: 107,
    order_number: 'INV-2025-8818',
    customer_id: 407,
    customer_name: 'Quantum BioPharma Corp',
    region: 'North America',
    product_category: 'AI & Data Services',
    units: 15,
    unit_price: 5200.0,
    gross_revenue: 78000.0,
    cost_of_goods: 19500.0,
    net_profit: 58500.0,
    tax_amount: 6240.0,
    status: 'Completed',
    order_date: '2025-02-19 13:40:00',
  },
  {
    id: 108,
    order_number: 'INV-2025-8819',
    customer_id: 408,
    customer_name: 'Australis Mining Robotics',
    region: 'APAC',
    product_category: 'Hardware Systems',
    units: 50,
    unit_price: 950.0,
    gross_revenue: 47500.0,
    cost_of_goods: 28500.0,
    net_profit: 19000.0,
    tax_amount: 3800.0,
    status: 'Pending Review',
    order_date: '2025-02-20 15:55:00',
  },
  {
    id: 109,
    order_number: 'INV-2025-8820',
    customer_id: 409,
    customer_name: 'Helvetia Private Banking',
    region: 'EMEA',
    product_category: 'Security & Compliance',
    units: 40,
    unit_price: 3400.0,
    gross_revenue: 136000.0,
    cost_of_goods: 39200.0,
    net_profit: 96800.0,
    tax_amount: 10880.0,
    status: 'Completed',
    order_date: '2025-02-21 11:30:00',
  },
  {
    id: 110,
    order_number: 'INV-2025-8821',
    customer_id: 410,
    customer_name: 'SingaTrade Global Logistics',
    region: 'APAC',
    product_category: 'Cloud Infrastructure',
    units: 70,
    unit_price: 1250.0,
    gross_revenue: 87500.0,
    cost_of_goods: 29750.0,
    net_profit: 57750.0,
    tax_amount: 7000.0,
    status: 'Completed',
    order_date: '2025-02-22 09:15:00',
  },
];

export const INITIAL_LEDGER_DATA = [
  {
    account_code: '4100',
    account_name: 'Cloud & Infrastructure Subscriptions',
    category: 'Operating Revenue',
    q1_actual: 218750.0,
    q2_actual: 245600.0,
    q3_actual: 289400.0,
    q4_forecast: 320000.0,
    ytd_total: 753750.0,
    budget_variance_pct: 12.4,
  },
  {
    account_code: '4200',
    account_name: 'Enterprise Software Licenses',
    category: 'Operating Revenue',
    q1_actual: 105400.0,
    q2_actual: 118200.0,
    q3_actual: 134500.0,
    q4_forecast: 155000.0,
    ytd_total: 358100.0,
    budget_variance_pct: 8.6,
  },
  {
    account_code: '4300',
    account_name: 'Professional Consulting & Integration',
    category: 'Operating Revenue',
    q1_actual: 98000.0,
    q2_actual: 87500.0,
    q3_actual: 104000.0,
    q4_forecast: 110000.0,
    ytd_total: 289500.0,
    budget_variance_pct: -2.1,
  },
  {
    account_code: '5100',
    account_name: 'Cloud Datacenter Hosting & Bandwidth',
    category: 'Cost of Goods Sold',
    q1_actual: 73650.0,
    q2_actual: 79400.0,
    q3_actual: 88200.0,
    q4_forecast: 95000.0,
    ytd_total: 241250.0,
    budget_variance_pct: 4.2,
  },
  {
    account_code: '5200',
    account_name: 'Third-Party Software APIs & Licenses',
    category: 'Cost of Goods Sold',
    q1_actual: 31200.0,
    q2_actual: 33800.0,
    q3_actual: 36400.0,
    q4_forecast: 39000.0,
    ytd_total: 101400.0,
    budget_variance_pct: -1.5,
  },
  {
    account_code: '6100',
    account_name: 'Research & Engineering Payroll',
    category: 'Operating Expenses',
    q1_actual: 145000.0,
    q2_actual: 148000.0,
    q3_actual: 152000.0,
    q4_forecast: 160000.0,
    ytd_total: 445000.0,
    budget_variance_pct: 1.1,
  },
  {
    account_code: '6200',
    account_name: 'Sales & Go-To-Market Marketing',
    category: 'Operating Expenses',
    q1_actual: 62000.0,
    q2_actual: 71500.0,
    q3_actual: 84000.0,
    q4_forecast: 90000.0,
    ytd_total: 217500.0,
    budget_variance_pct: 6.8,
  },
];

export const INITIAL_INVENTORY_DATA = [
  {
    sku: 'SRV-R940-01',
    item_name: 'Enterprise Rack Server Node X12',
    warehouse_location: 'Chicago Hub A',
    stock_on_hand: 28,
    reorder_threshold: 15,
    unit_cost: 4200.0,
    total_valuation: 117600.0,
    stock_status: 'Optimal',
  },
  {
    sku: 'SW-100G-CORE',
    item_name: '100GbE Spine Core Switch 32-Port',
    warehouse_location: 'Frankfurt Hub B',
    stock_on_hand: 6,
    reorder_threshold: 10,
    unit_cost: 8900.0,
    total_valuation: 53400.0,
    stock_status: 'Low Stock',
  },
  {
    sku: 'NVME-4TB-ENT',
    item_name: 'Enterprise NVMe Gen5 4TB Flash Array',
    warehouse_location: 'Singapore Hub C',
    stock_on_hand: 142,
    reorder_threshold: 40,
    unit_cost: 650.0,
    total_valuation: 92300.0,
    stock_status: 'Optimal',
  },
  {
    sku: 'SFP-28-OPTIC',
    item_name: '25G SFP28 Optical Transceiver Module',
    warehouse_location: 'Chicago Hub A',
    stock_on_hand: 4,
    reorder_threshold: 25,
    unit_cost: 180.0,
    total_valuation: 720.0,
    stock_status: 'Critical',
  },
  {
    sku: 'UPS-10KW-PWR',
    item_name: '10kVA Modular Online UPS System',
    warehouse_location: 'Dallas Hub D',
    stock_on_hand: 19,
    reorder_threshold: 8,
    unit_cost: 3100.0,
    total_valuation: 58900.0,
    stock_status: 'Optimal',
  },
];

export const INITIAL_HR_PAYROLL_DATA = [
  { emp_id: 'EMP-1092', employee_name: 'Alexander Wright', department: 'Engineering', role_title: 'Staff Cloud Architect', base_salary: 16500.0, bonus: 2500.0, tax_deductions: 4200.0, net_pay: 14800.0, pay_status: 'Approved' },
  { emp_id: 'EMP-1093', employee_name: 'Elena Rostova', department: 'Product', role_title: 'Principal Designer', base_salary: 14200.0, bonus: 1800.0, tax_deductions: 3600.0, net_pay: 12400.0, pay_status: 'Approved' },
  { emp_id: 'EMP-1094', employee_name: 'Marcus Vance', department: 'Sales', role_title: 'Global Enterprise Director', base_salary: 15000.0, bonus: 8500.0, tax_deductions: 5400.0, net_pay: 18100.0, pay_status: 'Approved' },
  { emp_id: 'EMP-1095', employee_name: 'Samantha Lee', department: 'Engineering', role_title: 'Senior Backend Engineer', base_salary: 13500.0, bonus: 1500.0, tax_deductions: 3300.0, net_pay: 11700.0, pay_status: 'Approved' },
  { emp_id: 'EMP-1096', employee_name: 'David Chen', department: 'Finance', role_title: 'Lead FP&A Controller', base_salary: 12800.0, bonus: 2000.0, tax_deductions: 3100.0, net_pay: 11700.0, pay_status: 'Approved' },
  { emp_id: 'EMP-1097', employee_name: 'Priya Sharma', department: 'Legal', role_title: 'Senior Corporate Counsel', base_salary: 15800.0, bonus: 2200.0, tax_deductions: 4100.0, net_pay: 13900.0, pay_status: 'Approved' },
];

export const INITIAL_SAAS_DATA = [
  { account_name: 'Vertex Global Media', plan_tier: 'Enterprise', mrr: 18500.0, arr: 222000.0, expansion_rate: 132.5, seats_active: 450, health_score: 96 },
  { account_name: 'OmniStream Logistics', plan_tier: 'Enterprise', mrr: 14200.0, arr: 170400.0, expansion_rate: 118.0, seats_active: 280, health_score: 92 },
  { account_name: 'Apex Horizon Health', plan_tier: 'Business', mrr: 8400.0, arr: 100800.0, expansion_rate: 105.0, seats_active: 140, health_score: 88 },
  { account_name: 'Cobalt Robotics', plan_tier: 'Business', mrr: 9600.0, arr: 115200.0, expansion_rate: 124.0, seats_active: 190, health_score: 94 },
  { account_name: 'Pacific Clean Energy', plan_tier: 'Scale', mrr: 4500.0, arr: 54000.0, expansion_rate: 98.0, seats_active: 75, health_score: 82 },
];

/**
 * Executes a simulated MySQL SELECT query against internal datasets.
 */
export function executeMySqlQuery(query: string, parameters: Record<string, any> = {}): {
  success: boolean;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  sqlExecuted: string;
} {
  const start = performance.now();
  let sql = query.trim();

  // Substitute SQL parameters like @StartDate, :region, etc.
  for (const [key, val] of Object.entries(parameters)) {
    const regex = new RegExp(`[@:]${key}\\b`, 'g');
    const formatted = typeof val === 'string' ? `'${val}'` : val;
    sql = sql.replace(regex, String(formatted));
  }

  const lower = sql.toLowerCase();
  let targetData: Record<string, any>[] = [];

  if (lower.includes('financial_ledger')) {
    targetData = [...INITIAL_LEDGER_DATA];
  } else if (lower.includes('inventory_items')) {
    targetData = [...INITIAL_INVENTORY_DATA];
  } else {
    targetData = [...INITIAL_SALES_DATA];
  }

  // Filter based on region parameter if present in query
  if (lower.includes("region = '") || lower.includes('region = "')) {
    const regionMatch = sql.match(/region\s*=\s*['"]([^'"]+)['"]/i);
    if (regionMatch && regionMatch[1] && regionMatch[1] !== 'All') {
      targetData = targetData.filter((r) => r.region?.toLowerCase() === regionMatch[1].toLowerCase());
    }
  }

  // Filter based on status
  if (lower.includes("status = '") || lower.includes('status = "')) {
    const statusMatch = sql.match(/status\s*=\s*['"]([^'"]+)['"]/i);
    if (statusMatch && statusMatch[1] && statusMatch[1] !== 'All') {
      targetData = targetData.filter((r) => r.status?.toLowerCase() === statusMatch[1].toLowerCase());
    }
  }

  // Sorting
  if (lower.includes('order by')) {
    const orderMatch = sql.match(/order by\s+([a-zA-Z0-9_]+)(\s+desc|\s+asc)?/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const isDesc = orderMatch[2]?.trim().toLowerCase() === 'desc';
      targetData.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }
  }

  // Limit
  const limitMatch = sql.match(/limit\s+([0-9]+)/i);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1], 10);
    targetData = targetData.slice(0, limit);
  }

  const columns = targetData.length > 0 ? Object.keys(targetData[0]) : [];
  const end = performance.now();

  return {
    success: true,
    columns,
    rows: targetData,
    rowCount: targetData.length,
    executionTimeMs: Math.round(end - start + Math.random() * 8 + 4),
    sqlExecuted: sql,
  };
}

/**
 * Creates simulated live streaming data updates.
 */
export function generateLiveStreamPulse(currentData: Record<string, any>[]): Record<string, any>[] {
  const regions = ['North America', 'EMEA', 'APAC', 'LATAM'];
  const categories = ['Cloud Infrastructure', 'Enterprise SaaS', 'Security & Compliance', 'Hardware Systems', 'AI & Data Services'];
  const customers = [
    'HyperScale Quantum Systems',
    'Acrobat Logistics AG',
    'Solstice Financial Group',
    'CyberSentinel Defense Ltd',
    'BlueWave Telecommunications',
  ];
  const statuses = ['Completed', 'Processing', 'Shipped'];

  const randCustomer = customers[Math.floor(Math.random() * customers.length)];
  const randCategory = categories[Math.floor(Math.random() * categories.length)];
  const randRegion = regions[Math.floor(Math.random() * regions.length)];
  const units = Math.floor(Math.random() * 60) + 10;
  const unitPrice = [680, 950, 1250, 3400, 5200][Math.floor(Math.random() * 5)];
  const gross = units * unitPrice;
  const cost = Math.round(gross * (0.3 + Math.random() * 0.25));
  const profit = gross - cost;
  const tax = Math.round(gross * 0.08);
  const orderNum = `INV-2025-${Math.floor(1000 + Math.random() * 9000)}`;

  const newRecord = {
    id: Date.now() % 100000,
    order_number: orderNum,
    customer_id: Math.floor(400 + Math.random() * 50),
    customer_name: randCustomer,
    region: randRegion,
    product_category: randCategory,
    units,
    unit_price: unitPrice,
    gross_revenue: gross,
    cost_of_goods: cost,
    net_profit: profit,
    tax_amount: tax,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    order_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  // Prepend new record and keep last 15
  return [newRecord, ...currentData.slice(0, 14)];
}
