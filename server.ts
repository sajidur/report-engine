import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_REPORTS } from './src/data/sampleReports.ts';
import { executeMySqlQuery, INITIAL_SALES_DATA, INITIAL_LEDGER_DATA, INITIAL_INVENTORY_DATA } from './src/services/mysqlMockData.ts';
import { SdkCodeGenerator } from './src/services/sdkCodeGenerators.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'CrystalReport Enterprise Server', time: new Date().toISOString() });
  });

  // Sample API Endpoints for REST & OPTIONS Testing
  app.get('/api/sample/ecommerce-orders', (req, res) => {
    res.json({
      status: 'success',
      total: INITIAL_SALES_DATA.length,
      data: INITIAL_SALES_DATA,
    });
  });

  app.get('/api/sample/financial-ledger', (req, res) => {
    res.json({
      status: 'success',
      total: INITIAL_LEDGER_DATA.length,
      data: INITIAL_LEDGER_DATA,
    });
  });

  app.get('/api/sample/inventory-stock', (req, res) => {
    res.json({
      status: 'success',
      total: INITIAL_INVENTORY_DATA.length,
      data: INITIAL_INVENTORY_DATA,
    });
  });

  // OPTIONS endpoint for schema discovery & catalog
  app.options('/api/sample/options-catalog', (req, res) => {
    res.set({
      'Allow': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'X-Schema-Version': '2.4.0',
    });
    res.json({
      success: true,
      endpoint: '/api/sample/options-catalog',
      supportedMethods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
      schemaVersion: '2.4.0',
      description: 'Options API Endpoint for dynamic schema introspection & enterprise metrics',
      catalog: [
        { code: 'OPT-01', name: 'Standard Equity Option Call', strikePrice: 185.50, expiration: '2026-09-15', impliedVol: 0.28, openInterest: 14200, premium: 6.45, delta: 0.62 },
        { code: 'OPT-02', name: 'Tech ETF Bullish Spread', strikePrice: 420.00, expiration: '2026-10-20', impliedVol: 0.34, openInterest: 28900, premium: 12.80, delta: 0.48 },
        { code: 'OPT-03', name: 'Global Energy Hedge Put', strikePrice: 95.00, expiration: '2026-11-18', impliedVol: 0.42, openInterest: 8400, premium: 4.15, delta: -0.35 },
        { code: 'OPT-04', name: 'Treasury Index Straddle', strikePrice: 110.00, expiration: '2026-12-15', impliedVol: 0.19, openInterest: 35100, premium: 8.90, delta: 0.05 },
        { code: 'OPT-05', name: 'SaaS Sector Collar Put', strikePrice: 260.00, expiration: '2026-09-30', impliedVol: 0.38, openInterest: 11600, premium: 9.30, delta: -0.52 },
      ],
    });
  });

  app.get('/api/sample/options-catalog', (req, res) => {
    res.json({
      success: true,
      catalog: [
        { code: 'OPT-01', name: 'Standard Equity Option Call', strikePrice: 185.50, expiration: '2026-09-15', impliedVol: 0.28, openInterest: 14200, premium: 6.45, delta: 0.62 },
        { code: 'OPT-02', name: 'Tech ETF Bullish Spread', strikePrice: 420.00, expiration: '2026-10-20', impliedVol: 0.34, openInterest: 28900, premium: 12.80, delta: 0.48 },
        { code: 'OPT-03', name: 'Global Energy Hedge Put', strikePrice: 95.00, expiration: '2026-11-18', impliedVol: 0.42, openInterest: 8400, premium: 4.15, delta: -0.35 },
        { code: 'OPT-04', name: 'Treasury Index Straddle', strikePrice: 110.00, expiration: '2026-12-15', impliedVol: 0.19, openInterest: 35100, premium: 8.90, delta: 0.05 },
        { code: 'OPT-05', name: 'SaaS Sector Collar Put', strikePrice: 260.00, expiration: '2026-09-30', impliedVol: 0.38, openInterest: 11600, premium: 9.30, delta: -0.52 },
      ],
    });
  });

  // POST /api/datasource/fetch-endpoint - Server Proxy for any external or internal REST/OPTIONS API
  app.post('/api/datasource/fetch-endpoint', async (req, res) => {
    const { url, method = 'GET', headers = {}, body, jsonPath } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL endpoint parameter is required' });
    }

    const startTime = Date.now();
    try {
      // Handle local relative URLs vs absolute external URLs
      let fetchUrl = url;
      if (url.startsWith('/')) {
        fetchUrl = `http://127.0.0.1:${PORT}${url}`;
      }

      const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: {
          'User-Agent': 'CrystalReportEngine/2.4',
          ...headers,
        },
      };

      if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        if (!fetchOptions.headers['Content-Type' as keyof typeof fetchOptions.headers]) {
          (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(fetchUrl, fetchOptions);
      const latencyMs = Date.now() - startTime;

      // Extract response headers & options allowed methods
      const headersReceived: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        headersReceived[key] = val;
      });

      const allowHeader = response.headers.get('allow') || response.headers.get('access-control-allow-methods');
      const optionsAllowedMethods = allowHeader ? allowHeader.split(',').map((s) => s.trim()) : undefined;

      let rawText = '';
      try {
        rawText = await response.text();
      } catch (err: any) {
        rawText = '';
      }

      let parsedJson: any = null;
      try {
        parsedJson = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        parsedJson = { textResponse: rawText };
      }

      // Extract rows from jsonPath
      let rows: any[] = [];
      if (Array.isArray(parsedJson)) {
        rows = parsedJson;
      } else if (jsonPath && jsonPath.trim() !== '' && jsonPath.trim() !== '.') {
        const parts = jsonPath.trim().split('.');
        let cur = parsedJson;
        for (const p of parts) {
          if (cur && typeof cur === 'object' && p in cur) {
            cur = cur[p];
          } else {
            cur = null;
            break;
          }
        }
        if (Array.isArray(cur)) {
          rows = cur;
        } else if (cur && typeof cur === 'object') {
          rows = [cur];
        }
      } else if (parsedJson && typeof parsedJson === 'object') {
        const commonKeys = ['data', 'items', 'products', 'results', 'records', 'rows', 'users', 'orders', 'list', 'catalog', 'payload'];
        for (const k of commonKeys) {
          if (Array.isArray(parsedJson[k])) {
            rows = parsedJson[k];
            break;
          }
        }
        if (rows.length === 0) {
          for (const k of Object.keys(parsedJson)) {
            if (Array.isArray(parsedJson[k])) {
              rows = parsedJson[k];
              break;
            }
          }
        }
        if (rows.length === 0) {
          rows = [parsedJson];
        }
      }

      // Extract fields definitions
      const fieldMap: Record<string, { name: string; type: string; displayName: string }> = {};
      const sample = rows.slice(0, 10);
      sample.forEach((row) => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach((k) => {
            const v = row[k];
            let inferred = 'string';
            const lk = k.toLowerCase();
            if (lk.includes('price') || lk.includes('revenue') || lk.includes('cost') || lk.includes('amount') || lk.includes('balance') || lk.includes('premium')) {
              inferred = 'currency';
            } else if (typeof v === 'number') {
              inferred = 'number';
            } else if (typeof v === 'boolean') {
              inferred = 'boolean';
            } else if (typeof v === 'string' && (lk.includes('date') || lk.includes('time')) && !isNaN(Date.parse(v))) {
              inferred = 'date';
            }
            if (!fieldMap[k]) {
              fieldMap[k] = {
                name: k,
                type: inferred,
                displayName: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              };
            }
          });
        }
      });

      return res.json({
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        latencyMs,
        dataset: rows,
        fields: Object.values(fieldMap),
        rowCount: rows.length,
        headersReceived,
        optionsAllowedMethods,
        rawJson: parsedJson,
      });
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal proxy fetch error',
        latencyMs,
        dataset: [],
        fields: [],
        rowCount: 0,
      });
    }
  });

  // GET /api/reports - List all templates
  app.get('/api/reports', (req, res) => {
    res.json({
      success: true,
      count: SAMPLE_REPORTS.length,
      templates: SAMPLE_REPORTS.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        version: t.version,
        updatedAt: t.updatedAt,
      })),
    });
  });

  // GET /api/reports/:id - Get template definition
  app.get('/api/reports/:id', (req, res) => {
    const template = SAMPLE_REPORTS.find((t) => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Report template not found' });
    }
    res.json({ success: true, template });
  });

  // GET /api/reports/:id/data - Fetch MySQL dataset for report
  app.get('/api/reports/:id/data', (req, res) => {
    const template = SAMPLE_REPORTS.find((t) => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Report template not found' });
    }

    const query = template.dataSources[0]?.query || 'SELECT * FROM sales_transactions;';
    const params = req.query as Record<string, any>;
    const result = executeMySqlQuery(query, params);

    res.json({
      success: true,
      dataset: result.rows,
      rowCount: result.rowCount,
      executionTimeMs: result.executionTimeMs,
    });
  });

  // POST /api/datasource/query - Execute arbitrary SQL query
  app.post('/api/datasource/query', (req, res) => {
    const { sql, parameters } = req.body;
    if (!sql) {
      return res.status(400).json({ success: false, error: 'SQL query string required' });
    }
    const result = executeMySqlQuery(sql, parameters || {});
    res.json(result);
  });

  // GET /api/sdk/csharp/:id - Generate C# .NET Web API solution
  app.get('/api/sdk/csharp/:id', (req, res) => {
    const template = SAMPLE_REPORTS.find((t) => t.id === req.params.id) || SAMPLE_REPORTS[0];
    const code = SdkCodeGenerator.generateCSharpNetCode(template);
    res.type('text/plain').send(code);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Crystal Report Engine server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
