import { DataSourceField, ReportDataSource, ReportTemplate, TableColumn, ReportElement } from '../types/report';

export interface ApiEndpointConfig {
  id?: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'OPTIONS';
  headers?: { key: string; value: string; enabled: boolean }[];
  body?: string;
  jsonPath?: string;
  authType?: 'none' | 'bearer' | 'apiKey' | 'basic';
  authToken?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: 'header' | 'query';
}

export interface ApiFetchResult {
  success: boolean;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  data: Record<string, any>[];
  rawJson?: any;
  fields: DataSourceField[];
  rowCount: number;
  error?: string;
  headersReceived?: Record<string, string>;
  optionsAllowedMethods?: string[];
}

export const SAMPLE_API_PRESETS: ApiEndpointConfig[] = [
  {
    name: 'E-Commerce Sales & Orders API',
    url: '/api/sample/ecommerce-orders',
    method: 'GET',
    jsonPath: 'data',
    headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
  },
  {
    name: 'Financial Ledger & Transactions API',
    url: '/api/sample/financial-ledger',
    method: 'GET',
    jsonPath: 'data',
    headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
  },
  {
    name: 'Warehouse & Global Inventory API',
    url: '/api/sample/inventory-stock',
    method: 'GET',
    jsonPath: 'data',
    headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
  },
  {
    name: 'Options Catalog Discovery Endpoint (OPTIONS)',
    url: '/api/sample/options-catalog',
    method: 'OPTIONS',
    jsonPath: 'catalog',
    headers: [{ key: 'X-Requested-With', value: 'CrystalReportEngine', enabled: true }],
  },
  {
    name: 'Public API: Products Catalog (DummyJSON)',
    url: 'https://dummyjson.com/products?limit=30',
    method: 'GET',
    jsonPath: 'products',
    headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
  },
  {
    name: 'Public API: User Directory (JSONPlaceholder)',
    url: 'https://jsonplaceholder.typicode.com/users',
    method: 'GET',
    jsonPath: '.',
    headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
  },
];

export class ApiDataSourceService {
  /**
   * Infer data type for a field value
   */
  static inferType(value: any, key: string): 'string' | 'number' | 'boolean' | 'date' | 'currency' {
    if (value === null || value === undefined) return 'string';

    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('price') || 
      lowerKey.includes('revenue') || 
      lowerKey.includes('cost') || 
      lowerKey.includes('salary') || 
      lowerKey.includes('balance') || 
      lowerKey.includes('amount') ||
      lowerKey.includes('valuation')
    ) {
      if (typeof value === 'number' || (!isNaN(Number(value)) && String(value).trim() !== '')) {
        return 'currency';
      }
    }

    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';

    if (typeof value === 'string') {
      // Check date
      if (
        (lowerKey.includes('date') || lowerKey.includes('time') || lowerKey.includes('at')) &&
        !isNaN(Date.parse(value)) &&
        value.length > 5
      ) {
        return 'date';
      }
      // Check boolean strings
      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        return 'boolean';
      }
      // Check numeric strings
      if (!isNaN(Number(value)) && value.trim() !== '') {
        return 'number';
      }
    }

    return 'string';
  }

  /**
   * Extract fields definition from tabular array
   */
  static extractFields(dataRows: Record<string, any>[]): DataSourceField[] {
    if (!dataRows || dataRows.length === 0) return [];

    const fieldMap: Record<string, DataSourceField> = {};

    // Sample across up to 20 rows for accuracy
    const sampleSize = Math.min(20, dataRows.length);
    for (let i = 0; i < sampleSize; i++) {
      const row = dataRows[i];
      if (!row || typeof row !== 'object') continue;

      Object.keys(row).forEach((key) => {
        const val = row[key];
        // Flatten simple nested objects (e.g., user.address.city -> address_city)
        if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
          Object.keys(val).forEach((subKey) => {
            const compoundKey = `${key}_${subKey}`;
            if (!fieldMap[compoundKey]) {
              const inferred = this.inferType(val[subKey], compoundKey);
              fieldMap[compoundKey] = {
                name: compoundKey,
                type: inferred,
                displayName: compoundKey
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
              };
            }
          });
        } else if (!fieldMap[key]) {
          const inferred = this.inferType(val, key);
          fieldMap[key] = {
            name: key,
            type: inferred,
            displayName: key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          };
        }
      });
    }

    return Object.values(fieldMap);
  }

  /**
   * Flatten nested objects in rows for table/report consumption
   */
  static normalizeRows(rawRows: any[]): Record<string, any>[] {
    if (!Array.isArray(rawRows)) return [];

    return rawRows.map((item, idx) => {
      if (!item || typeof item !== 'object') {
        return { value: item, index: idx + 1 };
      }

      const flat: Record<string, any> = {};
      Object.keys(item).forEach((k) => {
        const v = item[k];
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
          Object.keys(v).forEach((subK) => {
            flat[`${k}_${subK}`] = v[subK];
          });
        } else {
          flat[k] = v;
        }
      });
      return flat;
    });
  }

  /**
   * Extract target array from response JSON by dot-path or auto-detection
   */
  static extractArrayFromResponse(json: any, jsonPath?: string): any[] {
    if (!json) return [];

    if (Array.isArray(json)) {
      return json;
    }

    if (jsonPath && jsonPath.trim() !== '' && jsonPath.trim() !== '.') {
      const parts = jsonPath.trim().split('.');
      let current = json;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      if (Array.isArray(current)) {
        return current;
      }
      if (current && typeof current === 'object') {
        return [current];
      }
    }

    // Auto-detect first array field
    if (typeof json === 'object') {
      // Check common array keys
      const commonKeys = ['data', 'items', 'products', 'results', 'records', 'rows', 'users', 'orders', 'list', 'catalog', 'payload'];
      for (const k of commonKeys) {
        if (Array.isArray(json[k])) {
          return json[k];
        }
      }

      // Check any array property
      for (const k of Object.keys(json)) {
        if (Array.isArray(json[k])) {
          return json[k];
        }
      }

      // If single object, wrap in array
      return [json];
    }

    return [];
  }

  /**
   * Fetch data from any API endpoint (using server proxy for CORS & headers)
   */
  static async fetchEndpoint(config: ApiEndpointConfig): Promise<ApiFetchResult> {
    const startTime = performance.now();

    // Prepare headers map
    const headersMap: Record<string, string> = {};
    if (config.headers) {
      config.headers.forEach((h) => {
        if (h.enabled && h.key.trim()) {
          headersMap[h.key.trim()] = h.value;
        }
      });
    }

    // Authentication headers
    if (config.authType === 'bearer' && config.authToken) {
      headersMap['Authorization'] = `Bearer ${config.authToken.trim()}`;
    } else if (config.authType === 'apiKey' && config.apiKeyName && config.apiKeyValue) {
      if (config.apiKeyLocation === 'header' || !config.apiKeyLocation) {
        headersMap[config.apiKeyName.trim()] = config.apiKeyValue.trim();
      }
    }

    let targetUrl = config.url.trim();
    if (config.authType === 'apiKey' && config.apiKeyLocation === 'query' && config.apiKeyName && config.apiKeyValue) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${separator}${encodeURIComponent(config.apiKeyName.trim())}=${encodeURIComponent(config.apiKeyValue.trim())}`;
    }

    try {
      // Use backend proxy endpoint to avoid CORS issues and support OPTIONS / custom verbs
      const proxyResponse = await fetch('/api/datasource/fetch-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: targetUrl,
          method: config.method || 'GET',
          headers: headersMap,
          body: config.body || undefined,
          jsonPath: config.jsonPath,
        }),
      });

      const proxyResult = await proxyResponse.json();
      const latencyMs = Math.round(performance.now() - startTime);

      if (!proxyResponse.ok || !proxyResult.success) {
        return {
          success: false,
          statusCode: proxyResult.statusCode || proxyResponse.status,
          statusText: proxyResult.statusText || 'Error fetching endpoint',
          latencyMs,
          data: [],
          fields: [],
          rowCount: 0,
          error: proxyResult.error || `HTTP ${proxyResponse.status}: ${proxyResponse.statusText}`,
          rawJson: proxyResult.rawJson,
        };
      }

      const rows = this.normalizeRows(proxyResult.dataset || []);
      const fields = proxyResult.fields?.length ? proxyResult.fields : this.extractFields(rows);

      return {
        success: true,
        statusCode: proxyResult.statusCode || 200,
        statusText: proxyResult.statusText || 'OK',
        latencyMs: proxyResult.latencyMs || latencyMs,
        data: rows,
        rawJson: proxyResult.rawJson,
        fields,
        rowCount: rows.length,
        headersReceived: proxyResult.headersReceived,
        optionsAllowedMethods: proxyResult.optionsAllowedMethods,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        statusCode: 0,
        statusText: 'Network Error',
        latencyMs,
        data: [],
        fields: [],
        rowCount: 0,
        error: err.message || 'Failed to connect to API endpoint',
      };
    }
  }

  /**
   * Convert an ApiFetchResult into a complete, professional ReportTemplate
   */
  static createReportTemplateFromApi(
    config: ApiEndpointConfig,
    result: ApiFetchResult
  ): ReportTemplate {
    const templateId = `api-report-${Date.now()}`;
    const cleanName = config.name || 'API Endpoint Dynamic Report';
    const fields = result.fields;

    // Detect numeric & currency fields for KPIs and charts
    const numericFields = fields.filter((f) => f.type === 'number' || f.type === 'currency');
    const primaryMetricField = numericFields[0]?.name || (fields[2]?.name || 'value');
    const secondaryMetricField = numericFields[1]?.name || numericFields[0]?.name || 'count';

    // Detect categorical fields for X-Axis and groupings
    const stringFields = fields.filter((f) => f.type === 'string' && f.name !== 'id' && !f.name.includes('_id'));
    const categoryField = stringFields[0]?.name || fields[0]?.name || 'name';

    // Build Table Columns from discovered fields (take up to 6 columns for clean fit)
    const displayCols = fields.slice(0, 6);
    const tableColumns: TableColumn[] = displayCols.map((col, idx) => {
      let format: TableColumn['format'] = 'text';
      let summaryType: TableColumn['summaryType'] = 'none';

      if (col.type === 'currency') {
        format = 'currency';
        summaryType = 'sum';
      } else if (col.type === 'number') {
        format = 'number';
        summaryType = 'sum';
      } else if (col.type === 'date') {
        format = 'date';
      }

      return {
        id: `col-${idx + 1}`,
        header: col.displayName,
        field: col.name,
        width: Math.floor(100 / displayCols.length),
        align: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
        format,
        summaryType,
      };
    });

    const elements: ReportElement[] = [
      // 1. Report Header
      {
        id: `el-header-${Date.now()}`,
        type: 'text',
        name: 'Report Title',
        band: 'reportHeader',
        x: 40,
        y: 20,
        width: 450,
        height: 38,
        content: cleanName,
        style: {
          fontSize: 22,
          fontWeight: 'bold',
          textColor: '#0f172a',
          fontFamily: 'Inter',
        },
      },
      {
        id: `el-subtitle-${Date.now()}`,
        type: 'text',
        name: 'Endpoint Badge',
        band: 'reportHeader',
        x: 40,
        y: 62,
        width: 500,
        height: 22,
        content: `Source: [${config.method || 'GET'}] ${config.url} • ${result.rowCount} Records Processed`,
        style: {
          fontSize: 11,
          textColor: '#0284c7',
          fontWeight: '500',
        },
      },
      {
        id: `el-qr-${Date.now()}`,
        type: 'qrcode',
        name: 'API Audit Code',
        band: 'reportHeader',
        x: 640,
        y: 15,
        width: 75,
        height: 75,
        qrValue: `API_AUDIT:${config.url}:${Date.now()}`,
        style: {},
      },

      // 2. Page Header / KPIs & Chart
      {
        id: `el-kpi-1-${Date.now()}`,
        type: 'kpi',
        name: 'Primary Metric KPI',
        band: 'pageHeader',
        x: 40,
        y: 15,
        width: 210,
        height: 85,
        kpiTitle: `Total ${numericFields[0]?.displayName || 'Records'}`,
        kpiValueField: primaryMetricField,
        kpiTrendField: '+12.4%',
        kpiTrendPeriod: 'Live Endpoint',
        style: {
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          borderWidth: 1,
          borderRadius: 8,
        },
      },
      {
        id: `el-kpi-2-${Date.now()}`,
        type: 'kpi',
        name: 'Record Volume KPI',
        band: 'pageHeader',
        x: 270,
        y: 15,
        width: 210,
        height: 85,
        kpiTitle: 'Payload Count',
        kpiValueField: 'count',
        kpiTrendField: `${result.rowCount} items`,
        kpiTrendPeriod: 'API Fetch',
        style: {
          backgroundColor: '#f0f9ff',
          borderColor: '#bae6fd',
          borderWidth: 1,
          borderRadius: 8,
        },
      },
      {
        id: `el-kpi-3-${Date.now()}`,
        type: 'kpi',
        name: 'Latency KPI',
        band: 'pageHeader',
        x: 500,
        y: 15,
        width: 215,
        height: 85,
        kpiTitle: 'API Latency',
        kpiValueField: 'latency',
        kpiTrendField: `${result.latencyMs}ms`,
        kpiTrendPeriod: 'Response Time',
        style: {
          backgroundColor: '#faf5ff',
          borderColor: '#e9d5ff',
          borderWidth: 1,
          borderRadius: 8,
        },
      },
      {
        id: `el-chart-${Date.now()}`,
        type: 'chart',
        name: 'Endpoint Data Distribution',
        band: 'pageHeader',
        x: 40,
        y: 115,
        width: 675,
        height: 190,
        chartType: 'bar',
        chartTitle: `${numericFields[0]?.displayName || 'Metric'} Distribution across ${categoryField}`,
        xAxisField: categoryField,
        yAxisFields: [primaryMetricField],
        showLegend: true,
        showGrid: true,
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          borderRadius: 8,
        },
      },

      // 3. Details Table
      {
        id: `el-table-${Date.now()}`,
        type: 'table',
        name: 'Endpoint Details Grid',
        band: 'details',
        x: 40,
        y: 15,
        width: 675,
        height: 240,
        columns: tableColumns,
        showTableFooter: true,
        stripedRows: true,
        denseRows: false,
        style: {
          fontSize: 12,
        },
      },

      // 4. Report Footer
      {
        id: `el-footer-text-${Date.now()}`,
        type: 'text',
        name: 'Footer Audit',
        band: 'reportFooter',
        x: 40,
        y: 20,
        width: 400,
        height: 25,
        content: `Generated dynamically via Crystal Reports REST Engine • Endpoint: ${config.url}`,
        style: {
          fontSize: 10,
          textColor: '#64748b',
          fontStyle: 'italic',
        },
      },
      {
        id: `el-footer-total-${Date.now()}`,
        type: 'formula',
        name: 'Grand Total Formula',
        band: 'reportFooter',
        x: 480,
        y: 18,
        width: 235,
        height: 30,
        formula: `SUM(${primaryMetricField})`,
        format: numericFields[0]?.type === 'currency' ? 'currency' : 'number',
        prefix: 'Total: ',
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          textColor: '#0f172a',
          textAlign: 'right',
        },
      },
    ];

    const dataSource: ReportDataSource = {
      id: `ds-${Date.now()}`,
      name: config.name,
      type: 'rest',
      endpoint: config.url,
      fields,
      data: result.data,
      parametersMap: {
        method: config.method,
        jsonPath: config.jsonPath || '.',
      },
    };

    return {
      id: templateId,
      name: cleanName,
      description: `Live REST API Report dynamically fed from ${config.method} ${config.url}`,
      category: 'Operations',
      version: '1.0.0',
      author: 'API Report Designer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pageSettings: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 15, right: 15, bottom: 15, left: 15 },
        backgroundColor: '#ffffff',
        watermark: {
          enabled: false,
          text: 'API LIVE',
          opacity: 0.1,
          color: '#0284c7',
          fontSize: 72,
          rotation: -30,
        },
      },
      dataSources: [dataSource],
      parameters: [
        {
          id: 'param-1',
          name: 'StatusFilter',
          label: 'Filter Keyword',
          type: 'string',
          defaultValue: '',
          description: 'Search & filter rows from API response',
        },
      ],
      bands: {
        reportHeader: { type: 'reportHeader', name: 'Report Header', height: 100, visible: true },
        pageHeader: { type: 'pageHeader', name: 'Page Header & KPIs', height: 320, visible: true },
        groupHeader: { type: 'groupHeader', name: 'Group Header', height: 40, visible: false },
        details: { type: 'details', name: 'Details (API Records)', height: 270, visible: true },
        groupFooter: { type: 'groupFooter', name: 'Group Footer', height: 40, visible: false },
        pageFooter: { type: 'pageFooter', name: 'Page Footer', height: 40, visible: true },
        reportFooter: { type: 'reportFooter', name: 'Report Footer', height: 60, visible: true },
      },
      elements,
      formulas: [
        {
          id: 'f-1',
          name: 'TotalMetric',
          expression: `SUM(${primaryMetricField})`,
          returnType: numericFields[0]?.type === 'currency' ? 'currency' : 'number',
          description: 'Sum of primary numeric field',
        },
      ],
    };
  }
}
