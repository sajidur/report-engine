import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  Table, 
  CheckCircle2, 
  Clock, 
  Code2, 
  Layers, 
  Plus, 
  RefreshCw, 
  Sliders, 
  Info,
  Server
} from 'lucide-react';
import { ReportTemplate, ReportDataSource } from '../../types/report';
import { MYSQL_SCHEMAS, executeMySqlQuery } from '../../services/mysqlMockData';

interface DataSourceManagerProps {
  template: ReportTemplate;
  onUpdateDataSource: (updatedDs: ReportDataSource) => void;
  liveStreaming: boolean;
  onToggleLiveStream: () => void;
}

export const DataSourceManager: React.FC<DataSourceManagerProps> = ({
  template,
  onUpdateDataSource,
  liveStreaming,
  onToggleLiveStream,
}) => {
  const activeDs = template.dataSources[0];
  const [queryText, setQueryText] = useState(activeDs?.query || 'SELECT * FROM sales_transactions LIMIT 20;');
  const [selectedTable, setSelectedTable] = useState<string>('sales_transactions');
  const [queryResult, setQueryResult] = useState<any>(() => executeMySqlQuery(queryText));
  const [executing, setExecuting] = useState(false);

  const handleRunQuery = () => {
    setExecuting(true);
    setTimeout(() => {
      const res = executeMySqlQuery(queryText);
      setQueryResult(res);
      setExecuting(false);

      if (activeDs) {
        onUpdateDataSource({
          ...activeDs,
          query: queryText,
          data: res.rows,
        });
      }
    }, 150);
  };

  const handleSelectTablePreset = (tableName: string) => {
    setSelectedTable(tableName);
    const newSql = `SELECT * FROM ${tableName} ORDER BY 1 DESC LIMIT 25;`;
    setQueryText(newSql);
    const res = executeMySqlQuery(newSql);
    setQueryResult(res);

    if (activeDs) {
      onUpdateDataSource({
        ...activeDs,
        query: newSql,
        data: res.rows,
      });
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col min-w-0 overflow-y-auto select-none">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
                Relational MySQL Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Port: <span className="text-slate-200">3306</span> • Database: <span className="text-cyan-300">enterprise_analytics</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <span>MySQL Database & Live Stream Engine</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Execute parameterized SQL statements against production MySQL tables, inspect schema definitions, and simulate high-frequency real-time event streams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleLiveStream}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                liveStreaming
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveStreaming ? 'animate-spin' : ''}`} />
              <span>{liveStreaming ? 'Real-time Streaming ACTIVE' : 'Start Real-time Stream'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="p-6 max-w-6xl mx-auto w-full flex-1 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Schema Tree Explorer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Database Tables</span>
                <span className="text-[10px] text-amber-400 font-mono">InnoDB</span>
              </h3>
              <p className="text-[11px] text-slate-400">Click a table to inspect columns & load query</p>
            </div>

            <div className="space-y-2">
              {MYSQL_SCHEMAS.map((table) => {
                const isSelected = selectedTable === table.name;
                return (
                  <div
                    key={table.name}
                    onClick={() => handleSelectTablePreset(table.name)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono text-xs font-bold mb-1">
                      <Table className="w-3.5 h-3.5 text-amber-400" />
                      <span>{table.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{table.comment}</p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                      {table.columns.slice(0, 4).map((col) => (
                        <div key={col.name} className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className={col.isPrimary ? 'text-cyan-400 font-bold' : ''}>
                            {col.name} {col.isPrimary && '★'}
                          </span>
                          <span className="text-slate-500">{col.type.split(' ')[0]}</span>
                        </div>
                      ))}
                      {table.columns.length > 4 && (
                        <div className="text-[9px] text-slate-500 italic">
                          +{table.columns.length - 4} more columns
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: SQL Editor & Results Grid */}
          <div className="lg:col-span-3 space-y-5">
            {/* SQL Editor Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    SQL Query Editor (Parameterized)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunQuery}
                    disabled={executing}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{executing ? 'Executing...' : 'Execute SQL'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-inner"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Supports parameter placeholders like <code className="text-cyan-300">@Region</code> and <code className="text-cyan-300">@StartDate</code></span>
                </div>
                {queryResult && (
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {queryResult.executionTimeMs}ms
                    </span>
                    <span className="text-slate-300">{queryResult.rowCount} rows fetched</span>
                  </div>
                )}
              </div>
            </div>

            {/* Results Grid Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Query Output Dataset
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Schema: {queryResult.columns.length} columns
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead className="bg-slate-950 sticky top-0 border-b border-slate-800">
                    <tr>
                      {queryResult.columns.map((col: string) => (
                        <th key={col} className="p-2.5 text-cyan-400 font-semibold text-[11px] whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                    {queryResult.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-800/60 transition">
                        {queryResult.columns.map((col: string) => (
                          <td key={col} className="p-2.5 text-slate-300 whitespace-nowrap text-[11px]">
                            {typeof row[col] === 'number'
                              ? row[col].toLocaleString()
                              : String(row[col] ?? 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
