export type BandType =
  | 'reportHeader'
  | 'pageHeader'
  | 'groupHeader'
  | 'details'
  | 'groupFooter'
  | 'pageFooter'
  | 'reportFooter';

export type ElementType =
  | 'text'
  | 'field'
  | 'formula'
  | 'table'
  | 'chart'
  | 'kpi'
  | 'image'
  | 'barcode'
  | 'qrcode'
  | 'line'
  | 'shape';

export type ChartType = 'bar' | 'stackedBar' | 'line' | 'area' | 'donut' | 'pie' | 'radar';

export interface StyleProperties {
  fontFamily?: string;
  fontSize?: number; // in px
  fontWeight?: 'normal' | '500' | '600' | 'bold' | '800';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  padding?: number;
  opacity?: number;
  shadow?: boolean;
}

export type RuleOperator =
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'eq'
  | 'neq'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'between'
  | 'empty'
  | 'notEmpty'
  | 'expression';

export interface DataSourceField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'currency';
  displayName?: string;
  label?: string;
}

export interface ConditionalFormattingRule {
  id: string;
  name?: string;
  enabled?: boolean;
  field?: string; // alias for targetField
  targetField?: string; // e.g. '__self__' for bound value, or field name like 'gross_revenue', 'status'
  operator?: RuleOperator;
  value?: string | number; // Threshold or target match string/number
  valueSecondary?: string | number; // For 'between' operator
  condition?: string; // Custom formula or legacy expression (e.g. "value > 1000")
  
  // Style overrides when condition matches:
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  fontWeight?: 'normal' | '500' | '600' | 'bold' | '800';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  badge?: boolean;
  badgeText?: string;
  icon?: string; // e.g. 'alert', 'check', 'trending-up', 'trending-down', 'flame', 'sparkle', 'flag'
  hideElement?: boolean;
}

export interface TableColumn {
  id: string;
  header: string;
  field: string;
  width: number; // percentage or px
  align: 'left' | 'center' | 'right';
  format?: 'text' | 'currency' | 'number' | 'percentage' | 'date' | 'badge';
  formula?: string;
  summaryType?: 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max';
  conditionalRules?: ConditionalFormattingRule[];
}

export interface ReportElement {
  id: string;
  type: ElementType;
  name: string;
  band: BandType;
  x: number; // in px
  y: number; // in px
  width: number; // in px
  height: number; // in px
  style: StyleProperties;
  
  // Content & Bindings
  content?: string; // for text, markdown, or static label
  fieldBinding?: string; // e.g. "sales.revenue", "customer.name"
  formula?: string; // e.g. "SUM(sales.amount) * 1.05"
  format?: 'none' | 'currency' | 'number' | 'percentage' | 'date' | 'uppercase' | 'lowercase';
  prefix?: string;
  suffix?: string;

  // Data source binding
  dataSourceId?: string; // ID of the bound DataSource (e.g. 'ds-sales-mysql', 'ds-financial-ledger')

  // Table specific
  columns?: TableColumn[];
  showTableFooter?: boolean;
  stripedRows?: boolean;
  denseRows?: boolean;
  headerBackgroundColor?: string;
  headerTextColor?: string;

  // Chart specific
  chartType?: ChartType;
  chartTitle?: string;
  xAxisField?: string;
  yAxisFields?: string[];
  chartColors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;

  // KPI specific
  kpiTitle?: string;
  kpiValueField?: string;
  kpiTrendField?: string;
  kpiTrendPeriod?: string;
  kpiIcon?: string;

  // Image / Barcode / QR specific
  imageUrl?: string;
  barcodeValue?: string;
  qrValue?: string;

  // Line / Shape specific
  shapeType?: 'rectangle' | 'circle' | 'divider' | 'callout';
  lineOrientation?: 'horizontal' | 'vertical';

  // Conditional formatting
  conditionalRules?: ConditionalFormattingRule[];
}

export interface ReportBand {
  type: BandType;
  name: string;
  height: number; // in px
  backgroundColor?: string;
  visible: boolean;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  groupByField?: string; // for groupHeader and groupFooter
}

export interface ReportPageSettings {
  size: 'A4' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number; // mm
    right: number; // mm
    bottom: number; // mm
    left: number; // mm
  };
  customWidth?: number; // mm
  customHeight?: number; // mm
  backgroundColor: string;
  watermark?: {
    enabled: boolean;
    text: string;
    opacity: number;
    color: string;
    fontSize: number;
    rotation: number;
  };
}

export interface ReportParameter {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'dateRange' | 'select' | 'boolean';
  defaultValue: any;
  options?: { label: string; value: any }[];
  required?: boolean;
  description?: string;
}

export interface ReportDataSource {
  id: string;
  name: string;
  type: 'mysql' | 'rest' | 'stream' | 'static';
  query?: string; // SQL SELECT query
  endpoint?: string;
  endpointUrl?: string;
  httpMethod?: string;
  jsonPath?: string;
  headers?: Record<string, string>;
  authHeader?: string;
  parametersMap?: Record<string, string>;
  fields: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'currency';
    displayName?: string;
    label?: string;
  }[];
  data: Record<string, any>[];
  liveStreamInterval?: number; // ms for simulation
}

export interface ReportFormula {
  id: string;
  name: string;
  expression: string;
  description?: string;
  returnType: 'number' | 'string' | 'boolean' | 'currency';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Financial' | 'Sales' | 'Executive' | 'Operations' | 'Invoicing' | 'HR' | 'Healthcare' | 'SaaS' | 'Custom' | string;
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  pageSettings: ReportPageSettings;
  dataSources: ReportDataSource[];
  parameters: ReportParameter[];
  bands: Record<BandType, ReportBand>;
  elements: ReportElement[];
  formulas: ReportFormula[];
}

export interface RenderedReportPage {
  pageNumber: number;
  totalPages: number;
  pageSettings: ReportPageSettings;
  renderedBands: {
    band: ReportBand;
    elements: ReportElement[];
    recordIndex?: number;
    dataRow?: Record<string, any>;
    groupKey?: string;
  }[];
}

export type ActiveAppView = 'designer' | 'preview' | 'templates' | 'sdk' | 'datasources' | 'export';
