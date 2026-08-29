import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_REPORTS } from './src/data/sampleReports.ts';
import { executeMySqlQuery } from './src/services/mysqlMockData.ts';
import { SdkCodeGenerator } from './src/services/sdkCodeGenerators.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'CrystalReport Enterprise Server', time: new Date().toISOString() });
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
