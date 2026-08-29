import { ReportTemplate } from '../types/report';

export class SdkCodeGenerator {
  /**
   * Generates React SDK integration code.
   */
  public static generateReactCode(template: ReportTemplate): string {
    return `// ============================================================================
// React Enterprise Report Integration Component
// Package: @crystal-engine/react
// Template: ${template.name} (v${template.version})
// ============================================================================

import React, { useState, useEffect } from 'react';
import { ReportViewer, useReportEngine } from '@crystal-engine/react';
import '@crystal-engine/react/dist/index.css';

// 1. Import or fetch your report template definition (.rpt.json)
import reportTemplate from './templates/${template.id}.rpt.json';

export interface AnalyticsReportDashboardProps {
  apiBaseUrl?: string;
  initialTerritory?: string;
}

export const AnalyticsReportDashboard: React.FC<AnalyticsReportDashboardProps> = ({
  apiBaseUrl = 'https://api.enterprise.internal',
  initialTerritory = 'All',
}) => {
  const [territory, setTerritory] = useState<string>(initialTerritory);
  const [fiscalQuarter, setFiscalQuarter] = useState<string>('Q1-2025');
  const [liveStreaming, setLiveStreaming] = useState<boolean>(true);
  
  // Real-time report hook with automatic parameter binding & live polling
  const { data, loading, error, refresh, exportPdf, exportExcel } = useReportEngine({
    template: reportTemplate,
    endpoint: \`\${apiBaseUrl}/api/reports/${template.id}/data\`,
    parameters: {
      Region: territory,
      FiscalQuarter: fiscalQuarter,
    },
    livePollIntervalMs: liveStreaming ? 3000 : 0, // 3s real-time streaming
  });

  return (
    <div className="report-container flex flex-col gap-4 p-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Enterprise Filter Toolbar */}
      <div className="flex items-center justify-between bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-300">Territory Filter:</label>
          <select 
            value={territory} 
            onChange={(e) => setTerritory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-cyan-300"
          >
            <option value="All">All Global Territories</option>
            <option value="North America">North America</option>
            <option value="EMEA">EMEA</option>
            <option value="APAC">APAC</option>
            <option value="LATAM">LATAM</option>
          </select>

          <label className="text-sm font-medium text-slate-300 ml-2">Period:</label>
          <select 
            value={fiscalQuarter} 
            onChange={(e) => setFiscalQuarter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="Q1-2025">Q1-2025</option>
            <option value="Q4-2024">Q4-2024</option>
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiveStreaming(!liveStreaming)}
            className={\`px-3 py-1.5 rounded-lg text-xs font-semibold border \${
              liveStreaming 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }\`}
          >
            {liveStreaming ? '● Live Stream Active' : '○ Static Mode'}
          </button>

          <button
            onClick={() => exportPdf({ watermark: 'CONFIDENTIAL' })}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition"
          >
            Export PDF
          </button>

          <button
            onClick={() => exportExcel()}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Main Crystal Reports Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl">
        <ReportViewer
          template={reportTemplate}
          data={data}
          parameters={{ Region: territory, FiscalQuarter: fiscalQuarter }}
          loading={loading}
          error={error}
          theme="light" // 'light' | 'dark' | 'auto'
          showPagination={true}
          interactiveCharts={true}
        />
      </div>
    </div>
  );
};

export default AnalyticsReportDashboard;
`;
  }

  /**
   * Generates Node.js Express backend integration code.
   */
  public static generateNodeJsCode(template: ReportTemplate): string {
    return `// ============================================================================
// Node.js / Express Enterprise Report Service
// Package: @crystal-engine/node
// MySQL Driver: mysql2/promise
// ============================================================================

const express = require('express');
const mysql = require('mysql2/promise');
const { CrystalReportEngine } = require('@crystal-engine/node');
const reportTemplate = require('./templates/${template.id}.rpt.json');

const app = express();
app.use(express.json());

// MySQL Database Connection Pool
const dbPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'report_app',
  password: process.env.MYSQL_PASSWORD || 'SecretP@ssword123',
  database: process.env.MYSQL_DATABASE || 'enterprise_analytics',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 20,
});

// Initialize Crystal Engine
const reportEngine = new CrystalReportEngine();

/**
 * GET /api/reports/${template.id}/data
 * Executes MySQL parameterized query and returns live dataset for React client.
 */
app.get('/api/reports/${template.id}/data', async (req, res) => {
  try {
    const region = req.query.Region || 'All';
    const fiscalQuarter = req.query.FiscalQuarter || 'Q1-2025';

    // Parameterized MySQL query
    const sql = \`
      SELECT id, order_number, customer_name, region, product_category, units, 
             unit_price, gross_revenue, cost_of_goods, net_profit, tax_amount, status, order_date
      FROM sales_transactions
      WHERE (? = 'All' OR region = ?)
      ORDER BY order_date DESC;
    \`;

    const [rows] = await dbPool.execute(sql, [region, region]);

    res.json({
      success: true,
      data: rows,
      rowCount: rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Report query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reports/${template.id}/render-pdf
 * Server-side PDF generation from template + MySQL data with direct stream download.
 */
app.post('/api/reports/${template.id}/render-pdf', async (req, res) => {
  try {
    const parameters = req.body.parameters || { Region: 'All' };
    const customWatermark = req.body.watermark || '';

    // 1. Fetch data from MySQL
    const region = parameters.Region || 'All';
    const [rows] = await dbPool.execute(
      \`SELECT * FROM sales_transactions WHERE (? = 'All' OR region = ?) ORDER BY order_date DESC\`,
      [region, region]
    );

    // 2. Render PDF using Crystal Engine
    const pdfBuffer = await reportEngine.renderToPdf({
      template: reportTemplate,
      dataset: rows,
      parameters,
      options: {
        paperSize: 'A4',
        orientation: '${template.pageSettings.orientation}',
        watermark: customWatermark ? { enabled: true, text: customWatermark } : undefined,
        printTimestamp: true,
      },
    });

    // 3. Send PDF binary response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', \`attachment; filename="${template.id}-\${Date.now()}.pdf"\`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF rendering failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(\`Report Engine Node.js Service running on port \${PORT}\`);
});
`;
  }

  /**
   * Generates complete C# .NET 8 / 9 Web API + MySQL Architecture.
   */
  public static generateCSharpNetCode(template: ReportTemplate): string {
    return `// ============================================================================
// .NET 8 / 9 ASP.NET Core Web API + MySQL Backend Architecture
// Namespace: Enterprise.Reporting.Api
// Template: ${template.name}
// Nuget: Dapper, MySqlConnector, CrystalReport.Net
// ============================================================================

using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using Dapper;

namespace Enterprise.Reporting.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportEngineService _reportEngine;
        private readonly IMySqlDataProvider _dbProvider;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(
            IReportEngineService reportEngine,
            IMySqlDataProvider dbProvider,
            ILogger<ReportsController> logger)
        {
            _reportEngine = reportEngine;
            _dbProvider = dbProvider;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves template metadata and schema definition.
        /// </summary>
        [HttpGet("${template.id}/schema")]
        public async Task<IActionResult> GetReportSchema()
        {
            var template = await _reportEngine.GetTemplateAsync("${template.id}");
            if (template == null) return NotFound(new { message = "Report template not found" });
            return Ok(template);
        }

        /// <summary>
        /// Queries MySQL database with parameters and returns dataset for client rendering.
        /// </summary>
        [HttpGet("${template.id}/data")]
        public async Task<IActionResult> GetReportData([FromQuery] ReportQueryParams parameters)
        {
            try
            {
                var sql = @"
                    SELECT id AS Id, 
                           order_number AS OrderNumber, 
                           customer_name AS CustomerName, 
                           region AS Region, 
                           product_category AS ProductCategory, 
                           units AS Units, 
                           unit_price AS UnitPrice, 
                           gross_revenue AS GrossRevenue, 
                           cost_of_goods AS CostOfGoods, 
                           net_profit AS NetProfit, 
                           tax_amount AS TaxAmount, 
                           status AS Status, 
                           order_date AS OrderDate
                    FROM sales_transactions
                    WHERE (@Region = 'All' OR region = @Region)
                    ORDER BY order_date DESC;";

                var data = await _dbProvider.QueryAsync<SalesTransactionDto>(sql, new { Region = parameters.Region ?? "All" });
                return Ok(new { success = true, count = data.Count, data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching MySQL report dataset");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Generates multi-page PDF on server using .NET Engine and streams to caller.
        /// </summary>
        [HttpPost("${template.id}/render-pdf")]
        public async Task<IActionResult> RenderPdf([FromBody] RenderPdfRequest request)
        {
            try
            {
                // 1. Fetch live MySQL data
                var sql = @"SELECT * FROM sales_transactions WHERE (@Region = 'All' OR region = @Region)";
                var rows = await _dbProvider.QueryAsync<SalesTransactionDto>(sql, new { Region = request.Region ?? "All" });

                // 2. Render PDF bytes
                byte[] pdfBytes = await _reportEngine.GeneratePdfAsync(
                    templateId: "${template.id}",
                    data: rows,
                    watermark: request.WatermarkText,
                    pageOrientation: "${template.pageSettings.orientation}"
                );

                return File(pdfBytes, "application/pdf", $"Report_${template.id}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PDF generation failure");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // ============================================================================
    // DTO & Request Contracts
    // ============================================================================

    public class ReportQueryParams
    {
        public string Region { get; set; } = "All";
        public string FiscalQuarter { get; set; } = "Q1-2025";
    }

    public class RenderPdfRequest
    {
        public string Region { get; set; } = "All";
        public string? WatermarkText { get; set; }
    }

    public class SalesTransactionDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string ProductCategory { get; set; } = string.Empty;
        public int Units { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal GrossRevenue { get; set; }
        public decimal CostOfGoods { get; set; }
        public decimal NetProfit { get; set; }
        public decimal TaxAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
    }

    // ============================================================================
    // MySQL Data Access Layer using Dapper & MySqlConnector
    // ============================================================================

    public interface IMySqlDataProvider
    {
        Task<List<T>> QueryAsync<T>(string sql, object? parameters = null);
        Task<int> ExecuteAsync(string sql, object? parameters = null);
    }

    public class MySqlDataProvider : IMySqlDataProvider
    {
        private readonly string _connectionString;

        public MySqlDataProvider(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("MySqlReportingDatabase")
                ?? throw new InvalidOperationException("MySQL connection string not configured");
        }

        private IDbConnection CreateConnection() => new MySqlConnection(_connectionString);

        public async Task<List<T>> QueryAsync<T>(string sql, object? parameters = null)
        {
            using var connection = CreateConnection();
            var results = await connection.QueryAsync<T>(sql, parameters);
            return results.AsList();
        }

        public async Task<int> ExecuteAsync(string sql, object? parameters = null)
        {
            using var connection = CreateConnection();
            return await connection.ExecuteAsync(sql, parameters);
        }
    }

    // ============================================================================
    // Report Engine Service Interface
    // ============================================================================

    public interface IReportEngineService
    {
        Task<string?> GetTemplateAsync(string templateId);
        Task<byte[]> GeneratePdfAsync<T>(string templateId, IEnumerable<T> data, string? watermark, string pageOrientation);
    }
}
`;
  }

  /**
   * Generates appsettings.json for .NET Web API
   */
  public static generateAppSettingsJson(): string {
    return `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "MySqlReportingDatabase": "Server=localhost;Port=3306;Database=enterprise_analytics;Uid=report_app;Pwd=SecretP@ssword123;Pooling=true;MinPoolSize=5;MaxPoolSize=50;"
  },
  "ReportEngine": {
    "TemplatesDirectory": "./ReportTemplates",
    "CacheDurationMinutes": 30,
    "EnableLiveStreamWebSocket": true
  }
}`;
  }

  /**
   * Generates MySQL DDL Schema script
   */
  public static generateMySqlDdl(): string {
    return `-- ============================================================================
-- Enterprise Analytics & Reporting MySQL Schema
-- Database: enterprise_analytics
-- ============================================================================

CREATE DATABASE IF NOT EXISTS \`enterprise_analytics\` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE \`enterprise_analytics\`;

-- 1. Sales Transactions Table
CREATE TABLE IF NOT EXISTS \`sales_transactions\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_number\` VARCHAR(20) NOT NULL UNIQUE,
  \`customer_id\` INT NOT NULL,
  \`customer_name\` VARCHAR(100) NOT NULL,
  \`region\` ENUM('North America', 'EMEA', 'APAC', 'LATAM') NOT NULL,
  \`product_category\` VARCHAR(50) NOT NULL,
  \`units\` INT NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`gross_revenue\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`cost_of_goods\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`net_profit\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`tax_amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('Completed', 'Processing', 'Shipped', 'Pending Review') NOT NULL DEFAULT 'Completed',
  \`order_date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_region_date\` (\`region\`, \`order_date\`),
  INDEX \`idx_customer\` (\`customer_id\`)
) ENGINE=InnoDB;

-- 2. General Ledger Accounts Table
CREATE TABLE IF NOT EXISTS \`financial_ledger\` (
  \`account_code\` VARCHAR(10) PRIMARY KEY,
  \`account_name\` VARCHAR(100) NOT NULL,
  \`category\` VARCHAR(50) NOT NULL,
  \`q1_actual\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`q2_actual\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`q3_actual\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`q4_forecast\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`ytd_total\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`budget_variance_pct\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB;

-- 3. Warehouse Inventory Items Table
CREATE TABLE IF NOT EXISTS \`inventory_items\` (
  \`sku\` VARCHAR(20) PRIMARY KEY,
  \`item_name\` VARCHAR(100) NOT NULL,
  \`warehouse_location\` VARCHAR(50) NOT NULL,
  \`stock_on_hand\` INT NOT NULL DEFAULT 0,
  \`reorder_threshold\` INT NOT NULL DEFAULT 10,
  \`unit_cost\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  \`total_valuation\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`stock_status\` VARCHAR(20) NOT NULL DEFAULT 'Optimal',
  INDEX \`idx_warehouse\` (\`warehouse_location\`)
) ENGINE=InnoDB;
`;
  }
}
