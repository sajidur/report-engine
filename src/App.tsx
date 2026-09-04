/**
 * Enterprise Report Engine & SDK Studio
 * Crystal Reports-style visual designer, real-time analytics engine,
 * customizable PDF exporter, undo/redo history stack, template library catalog,
 * and multi-platform SDK (React, Node.js, .NET Web API + MySQL).
 */

import React, { useState, useEffect } from 'react';
import { 
  ReportTemplate, 
  ActiveAppView, 
  ReportElement, 
  ElementType, 
  BandType,
  ReportBand,
  ReportDataSource,
  TableColumn
} from './types/report';
import { SAMPLE_REPORTS } from './data/sampleReports';
import { generateLiveStreamPulse } from './services/mysqlMockData';
import { PdfExporter } from './services/pdfExporter';
import { autoGenerateColumnsForDataSource } from './services/dataSourceCatalog';
import { useUndoRedo } from './hooks/useUndoRedo';
import { Navbar } from './components/Navbar';
import { ElementPalette } from './components/designer/ElementPalette';
import { ReportDesigner } from './components/designer/ReportDesigner';
import { PropertyInspector } from './components/designer/PropertyInspector';
import { FormulaEditorModal } from './components/designer/FormulaEditorModal';
import { ReportViewer } from './components/viewer/ReportViewer';
import { TemplateLibrary } from './components/templates/TemplateLibrary';
import { SaveTemplateModal } from './components/templates/SaveTemplateModal';
import { SdkHub } from './components/sdk/SdkHub';
import { DataSourceManager } from './components/datasources/DataSourceManager';
import { ExportPdfModal } from './components/export/ExportPdfModal';

export default function App() {
  const [templates, setTemplates] = useState<ReportTemplate[]>(SAMPLE_REPORTS);
  const [currentView, setCurrentView] = useState<ActiveAppView>('designer');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeBand, setActiveBand] = useState<BandType>('details');
  const [liveStreaming, setLiveStreaming] = useState<boolean>(true);
  const [parameters, setParameters] = useState<Record<string, any>>({
    Region: 'All',
    FiscalQuarter: 'Q1-2025',
  });

  // Undo / Redo History Stack Engine
  const {
    template: activeTemplate,
    canUndo,
    canRedo,
    history,
    currentIndex: currentHistoryIndex,
    undo,
    redo,
    setTemplate,
    resetHistory,
    jumpToHistoryIndex,
    lastAction,
  } = useUndoRedo(SAMPLE_REPORTS[0]);

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [formulaModalState, setFormulaModalState] = useState<{
    isOpen: boolean;
    initialFormula: string;
    callback: ((expr: string) => void) | null;
  }>({
    isOpen: false,
    initialFormula: '',
    callback: null,
  });

  // Active dataset from primary data source
  const dataset = activeTemplate.dataSources[0]?.data || [];

  // Real-time Live Stream Pulse loop
  useEffect(() => {
    if (!liveStreaming) return;
    const interval = setInterval(() => {
      // In-place live pulse update without dirtying undo history stack
      setTemplate((prev) => {
        const dsList = prev.dataSources;
        if (!dsList || dsList.length === 0) return prev;
        const currentDs = dsList[0];
        const updatedData = generateLiveStreamPulse(currentDs.data);
        return {
          ...prev,
          dataSources: [
            {
              ...currentDs,
              data: updatedData,
            },
            ...dsList.slice(1),
          ],
        };
      }, 'Live Stream Data Pulse');
    }, 3000);

    return () => clearInterval(interval);
  }, [liveStreaming, setTemplate]);

  // Selected element helper
  const selectedElement = activeTemplate.elements.find((el) => el.id === selectedElementId) || null;

  // Add element from palette with history tracking
  const handleAddElement = (type: ElementType, band: BandType, fieldBinding?: string) => {
    const newId = `el-${type}-${Date.now()}`;
    const fields = activeTemplate.dataSources[0]?.fields || [];
    
    // Find numeric fields for metrics/charts
    const numericFields = fields.filter((f) => f.type === 'number' || f.type === 'currency');
    const firstNumeric = numericFields[0]?.name || (fields[2]?.name || 'gross_revenue');
    const stringFields = fields.filter((f) => f.type === 'string');
    const firstString = stringFields[0]?.name || fields[0]?.name || 'customer_name';

    let newElement: ReportElement = {
      id: newId,
      type,
      name: fieldBinding ? `${fieldBinding} Field` : `${type.toUpperCase()} Component`,
      band,
      x: 24,
      y: 12,
      width: type === 'table' || type === 'chart' ? 700 : type === 'kpi' ? 220 : 260,
      height: type === 'table' ? 240 : type === 'chart' ? 80 : type === 'kpi' ? 75 : 32,
      style: {
        fontSize: type === 'text' ? 14 : 12,
        fontWeight: 'normal',
        textColor: '#0f172a',
        backgroundColor: type === 'kpi' ? '#f0fdf4' : 'transparent',
      },
    };

    if (type === 'text') {
      newElement.content = 'New Report Label';
    } else if (type === 'field') {
      newElement.fieldBinding = fieldBinding || fields[0]?.name || 'customer_name';
    } else if (type === 'formula') {
      newElement.formula = `SUM(${firstNumeric})`;
      newElement.format = 'currency';
    } else if (type === 'kpi') {
      newElement.kpiTitle = `${firstNumeric.replace(/_/g, ' ')} Metric`;
      newElement.formula = `SUM(${firstNumeric})`;
      newElement.format = 'currency';
      newElement.kpiTrendField = '+12.5% Live';
    } else if (type === 'chart') {
      newElement.chartType = 'bar';
      newElement.chartTitle = 'Metric Distribution';
      newElement.xAxisField = firstString;
      newElement.yAxisFields = [firstNumeric];
    } else if (type === 'table') {
      const activeDs = activeTemplate.dataSources[0];
      newElement.dataSourceId = activeDs?.id;
      newElement.name = `${activeDs?.name || 'Data'} Table`;
      newElement.columns = autoGenerateColumnsForDataSource(activeDs, 5);
      newElement.showTableFooter = true;
      newElement.stripedRows = true;
      newElement.denseRows = false;
    } else if (type === 'qrcode') {
      newElement.qrValue = 'https://enterprise.internal/reports/' + activeTemplate.id;
      newElement.width = 64;
      newElement.height = 64;
    }

    setTemplate((prev) => {
      let updatedBands = prev.bands;
      if (type === 'table' && prev.bands[band] && prev.bands[band].height < 250) {
        updatedBands = {
          ...prev.bands,
          [band]: {
            ...prev.bands[band],
            height: 260,
          },
        };
      }
      return {
        ...prev,
        bands: updatedBands,
        elements: [...prev.elements, newElement],
      };
    }, `Added ${fieldBinding || type.toUpperCase()} to ${band}`);

    setSelectedElementId(newId);
  };

  // Add full table generated directly from all API / Data Source fields
  const handleAddTableFromApi = () => {
    const ds = activeTemplate.dataSources[0];
    const dsFields = ds?.fields || [];
    const band: BandType = activeBand || 'details';
    const newId = `el-table-api-${Date.now()}`;

    const cols: TableColumn[] = dsFields.length > 0
      ? dsFields.map((f, idx) => ({
          id: `col-${idx + 1}`,
          header: f.displayName || (f as any).label || f.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          field: f.name,
          width: Math.floor(100 / Math.min(dsFields.length, 6)),
          align: f.type === 'currency' || f.type === 'number' ? 'right' : 'left',
          format: f.type === 'currency' ? 'currency' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text',
          summaryType: f.type === 'currency' || f.type === 'number' ? 'sum' : 'none',
        }))
      : [
          { id: '1', header: 'ID', field: 'id', width: 20, align: 'left' },
          { id: '2', header: 'Title', field: 'name', width: 40, align: 'left' },
          { id: '3', header: 'Amount', field: 'amount', width: 40, align: 'right', format: 'currency', summaryType: 'sum' },
        ];

    const tableEl: ReportElement = {
      id: newId,
      type: 'table',
      name: `Table (${ds?.name || 'API Data'})`,
      dataSourceId: ds?.id,
      band,
      x: 16,
      y: 12,
      width: 720,
      height: 240,
      style: {
        fontSize: 11,
        textColor: '#0f172a',
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        borderRadius: 8,
      },
      columns: cols,
      showTableFooter: true,
      stripedRows: true,
      denseRows: false,
    };

    setTemplate((prev) => {
      let nextBands = prev.bands;
      if (prev.bands[band] && prev.bands[band].height < 260) {
        nextBands = {
          ...prev.bands,
          [band]: {
            ...prev.bands[band],
            height: 270,
          },
        };
      }
      return {
        ...prev,
        bands: nextBands,
        elements: [...prev.elements, tableEl],
      };
    }, `Added API Table (${cols.length} cols) to ${band}`);

    setSelectedElementId(newId);
  };

  // Add column to selected table element
  const handleAddColumnToSelectedTable = (fieldName: string, fieldType: string) => {
    if (!selectedElement || selectedElement.type !== 'table') return;
    const existingCols = selectedElement.columns || [];
    const newCol: TableColumn = {
      id: `col-${Date.now()}`,
      header: fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      field: fieldName,
      width: Math.floor(100 / (existingCols.length + 1)),
      align: fieldType === 'currency' || fieldType === 'number' ? 'right' : 'left',
      format: fieldType === 'currency' ? 'currency' : fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text',
      summaryType: fieldType === 'currency' || fieldType === 'number' ? 'sum' : 'none',
    };
    const updated: ReportElement = {
      ...selectedElement,
      columns: [...existingCols, newCol],
    };
    handleUpdateElement(updated, `Added ${fieldName} column to Table`);
  };

  // Update single element
  const handleUpdateElement = (updated: ReportElement, actionLabel?: string) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === updated.id ? updated : el)),
    }), actionLabel || `Updated ${updated.name || updated.type}`);
  };

  // Batch update multiple elements (e.g. for Auto-Arrange)
  const handleUpdateMultipleElements = (
    updatedElements: ReportElement[],
    actionLabel?: string,
    updatedBandHeight?: { bandType: BandType; height: number }
  ) => {
    setTemplate((prev) => {
      const updatedMap = new Map(updatedElements.map((el) => [el.id, el]));
      const newElements = prev.elements.map((el) => updatedMap.get(el.id) || el);

      let nextBands = prev.bands;
      if (updatedBandHeight && prev.bands[updatedBandHeight.bandType]) {
        nextBands = {
          ...prev.bands,
          [updatedBandHeight.bandType]: {
            ...prev.bands[updatedBandHeight.bandType],
            height: Math.max(prev.bands[updatedBandHeight.bandType].height, updatedBandHeight.height),
          },
        };
      }

      return {
        ...prev,
        elements: newElements,
        bands: nextBands,
      };
    }, actionLabel || 'Auto-Arranged Elements');
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const elToDelete = activeTemplate.elements.find((el) => el.id === id);
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }), `Deleted ${elToDelete?.name || 'Element'}`);
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Duplicate element
  const handleDuplicateElement = (el: ReportElement) => {
    const dup: ReportElement = {
      ...el,
      id: `el-${el.type}-${Date.now()}`,
      name: `${el.name} (Copy)`,
      x: el.x + 16,
      y: el.y + 16,
    };
    setTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, dup],
    }), `Duplicated ${el.name || el.type}`);
    setSelectedElementId(dup.id);
  };

  // Update Bands
  const handleUpdateBands = (bands: Record<BandType, ReportBand>, actionLabel?: string) => {
    setTemplate((prev) => ({ ...prev, bands }), actionLabel || 'Updated Band Configuration');
  };

  // Update Page Settings
  const handleUpdatePageSettings = (pageSettings: ReportTemplate['pageSettings']) => {
    setTemplate((prev) => ({ ...prev, pageSettings }), 'Updated Page Settings');
  };

  // Update Data Source
  const handleUpdateDataSource = (updatedDs: ReportDataSource) => {
    setTemplate((prev) => ({
      ...prev,
      dataSources: prev.dataSources.map((ds) => (ds.id === updatedDs.id ? updatedDs : ds)),
    }), `Updated Data Source: ${updatedDs.name}`);
  };

  // Apply new or configured API / Database data source as primary
  const handleApplyDataSource = (newDs: ReportDataSource) => {
    setTemplate((prev) => {
      const existingIdx = prev.dataSources.findIndex((d) => d.id === newDs.id);
      let updatedList = [...prev.dataSources];
      if (existingIdx >= 0) {
        updatedList[existingIdx] = newDs;
      } else {
        updatedList = [newDs, ...updatedList];
      }
      return {
        ...prev,
        dataSources: updatedList,
      };
    }, `Connected API Data Source: ${newDs.name}`);
  };

  // Switch template
  const handleSelectTemplate = (selected: ReportTemplate) => {
    resetHistory(selected, `Loaded "${selected.name}"`);
    setSelectedElementId(null);
  };

  // Create new blank template
  const handleNewTemplate = () => {
    const newTemplate: ReportTemplate = {
      id: `rpt-custom-${Date.now()}`,
      name: 'Untitled Custom Report',
      description: 'Custom crystal-banded analytics report',
      category: 'Custom',
      version: '1.0.0',
      author: 'Enterprise Developer',
      createdAt: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10),
      pageSettings: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 12, right: 12, bottom: 12, left: 12 },
        backgroundColor: '#ffffff',
      },
      dataSources: activeTemplate.dataSources,
      parameters: [
        {
          id: 'param-1',
          name: 'Region',
          label: 'Region',
          type: 'select',
          defaultValue: 'All',
          options: [
            { label: 'All', value: 'All' },
            { label: 'North America', value: 'North America' },
            { label: 'EMEA', value: 'EMEA' },
            { label: 'APAC', value: 'APAC' },
          ],
        },
      ],
      bands: {
        reportHeader: { type: 'reportHeader', name: 'Report Header', height: 80, visible: true },
        pageHeader: { type: 'pageHeader', name: 'Page Header', height: 100, visible: true },
        groupHeader: { type: 'groupHeader', name: 'Group Header', height: 32, visible: false },
        details: { type: 'details', name: 'Details Band', height: 260, visible: true },
        groupFooter: { type: 'groupFooter', name: 'Group Footer', height: 32, visible: false },
        pageFooter: { type: 'pageFooter', name: 'Page Footer', height: 30, visible: true },
        reportFooter: { type: 'reportFooter', name: 'Report Footer', height: 60, visible: true },
      },
      elements: [
        {
          id: 'el-title',
          type: 'text',
          name: 'Title',
          band: 'reportHeader',
          x: 16,
          y: 16,
          width: 400,
          height: 32,
          content: 'New Business Analytics Report',
          style: { fontSize: 18, fontWeight: 'bold', textColor: '#0f172a' },
        },
      ],
      formulas: [],
    };

    setTemplates((prev) => [newTemplate, ...prev]);
    resetHistory(newTemplate, 'Created New Blank Report');
    setSelectedElementId(null);
  };

  // Save active design as a new reusable template in the library
  const handleSaveAsTemplate = (newTemplate: ReportTemplate) => {
    setTemplates((prev) => [newTemplate, ...prev]);
    resetHistory(newTemplate, `Saved Template: "${newTemplate.name}"`);
  };

  // Duplicate template
  const handleDuplicateTemplate = (tpl: ReportTemplate) => {
    const duplicated: ReportTemplate = {
      ...tpl,
      id: `rpt-${tpl.category.toLowerCase()}-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      category: 'Custom',
      author: 'Customized Copy',
      createdAt: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10),
    };
    setTemplates((prev) => [duplicated, ...prev]);
    resetHistory(duplicated, `Duplicated "${tpl.name}"`);
  };

  // Delete custom template
  const handleDeleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    if (activeTemplate.id === templateId && templates.length > 1) {
      const fallback = templates.find((t) => t.id !== templateId) || templates[0];
      handleSelectTemplate(fallback);
    }
  };

  // Import external .rpt.json
  const handleImportTemplate = (imported: ReportTemplate) => {
    setTemplates((prev) => {
      const filtered = prev.filter((t) => t.id !== imported.id);
      return [imported, ...filtered];
    });
    resetHistory(imported, `Imported .rpt.json: "${imported.name}"`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Global Navigation Bar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        templates={templates}
        activeTemplate={activeTemplate}
        onSelectTemplate={handleSelectTemplate}
        onNewTemplate={handleNewTemplate}
        onImportTemplate={handleImportTemplate}
        liveStreaming={liveStreaming}
        onToggleLiveStream={() => setLiveStreaming(!liveStreaming)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onShareRpt={() => PdfExporter.exportTemplateJson(activeTemplate)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onOpenSaveTemplateModal={() => setIsSaveTemplateModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* 1. TEMPLATE LIBRARY CATALOG VIEW */}
        {currentView === 'templates' && (
          <TemplateLibrary
            templates={templates}
            activeTemplate={activeTemplate}
            onSelectTemplate={handleSelectTemplate}
            onNewTemplate={handleNewTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onOpenSaveModal={() => setIsSaveTemplateModalOpen(true)}
            onNavigateView={setCurrentView}
          />
        )}

        {/* 2. VISUAL REPORT DESIGNER VIEW */}
        {currentView === 'designer' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Component Toolbox */}
            <ElementPalette
              onAddElement={handleAddElement}
              activeBand={activeBand}
              dataSource={activeTemplate.dataSources[0]}
              selectedElement={selectedElement}
              onAddTableFromApi={handleAddTableFromApi}
              onAddColumnToSelectedTable={handleAddColumnToSelectedTable}
              onNavigateToDataSources={() => setCurrentView('datasources')}
            />

            {/* Center: Banded Visual Canvas */}
            <ReportDesigner
              template={activeTemplate}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onUpdateMultipleElements={handleUpdateMultipleElements}
              onUpdateBands={handleUpdateBands}
              activeBand={activeBand}
              onSelectBand={setActiveBand}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              history={history}
              currentHistoryIndex={currentHistoryIndex}
              onJumpToHistoryIndex={jumpToHistoryIndex}
              lastAction={lastAction}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onNavigateView={setCurrentView}
              onUpdatePageSettings={handleUpdatePageSettings}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />

            {/* Right: Property Inspector */}
            <PropertyInspector
              selectedElement={selectedElement}
              template={activeTemplate}
              onUpdateElement={(el) => handleUpdateElement(el, `Styled ${el.name || el.type}`)}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onUpdatePageSettings={handleUpdatePageSettings}
              onOpenFormulaEditor={(initialExpr, callback) => {
                setFormulaModalState({
                  isOpen: true,
                  initialFormula: initialExpr,
                  callback,
                });
              }}
              onAddDataSource={(newDs) => {
                setTemplate((prev) => {
                  if (prev.dataSources.some((d) => d.id === newDs.id)) return prev;
                  return {
                    ...prev,
                    dataSources: [...prev.dataSources, newDs],
                  };
                }, `Added Data Source: ${newDs.name}`);
              }}
            />
          </div>
        )}

        {/* 3. LIVE REPORT VIEWER */}
        {currentView === 'preview' && (
          <ReportViewer
            template={activeTemplate}
            dataset={dataset}
            parameters={parameters}
            onUpdateParameter={(name, val) =>
              setParameters((prev) => ({ ...prev, [name]: val }))
            }
            liveStreaming={liveStreaming}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onNavigateView={setCurrentView}
          />
        )}

        {/* 4. DATA SOURCES & API STUDIO */}
        {currentView === 'datasources' && (
          <DataSourceManager
            template={activeTemplate}
            onUpdateDataSource={handleUpdateDataSource}
            onNewTemplateFromEndpoint={(newTpl) => {
              setTemplates((prev) => [newTpl, ...prev]);
              resetHistory(newTpl, `Generated API Report: ${newTpl.name}`);
              setCurrentView('designer');
            }}
            onNavigateView={setCurrentView}
            liveStreaming={liveStreaming}
            onToggleLiveStream={() => setLiveStreaming(!liveStreaming)}
          />
        )}

        {/* 5. DEVELOPER SDK HUB & EMBED PLAYGROUND */}
        {currentView === 'sdk' && (
          <SdkHub
            template={activeTemplate}
            dataset={dataset}
            parameters={parameters}
            onUpdateTemplateJson={(updated) => resetHistory(updated, 'Updated from SDK Editor')}
          />
        )}
      </main>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        currentTemplate={activeTemplate}
        onSaveAsTemplate={handleSaveAsTemplate}
      />

      {/* Formula Editor Modal */}
      <FormulaEditorModal
        isOpen={formulaModalState.isOpen}
        onClose={() => setFormulaModalState({ isOpen: false, initialFormula: '', callback: null })}
        onSave={(expr) => {
          if (formulaModalState.callback) {
            formulaModalState.callback(expr);
          }
        }}
        initialFormula={formulaModalState.initialFormula}
        template={activeTemplate}
      />

      {/* PDF Export Modal */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        template={activeTemplate}
        dataset={dataset}
        parameters={parameters}
      />
    </div>
  );
}
