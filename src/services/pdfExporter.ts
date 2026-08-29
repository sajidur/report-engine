import jsPDF from 'jspdf';
import { ReportTemplate } from '../types/report';
import { FormulaEngine } from './formulaEngine';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'Letter' | 'Legal';
  margins?: { top: number; right: number; bottom: number; left: number };
  watermarkText?: string;
  watermarkOpacity?: number;
  printDate?: boolean;
  pageNumbering?: boolean;
  author?: string;
  fileName?: string;
}

export class PdfExporter {
  /**
   * Generates a multi-page PDF document using jsPDF with banded layout, data grids,
   * summaries, and custom watermarking.
   */
  public static exportToPdf(
    template: ReportTemplate,
    dataset: Record<string, any>[] = [],
    parameters: Record<string, any> = {},
    options: PdfExportOptions = {}
  ): jsPDF {
    const orientation = options.orientation || template.pageSettings.orientation || 'portrait';
    const format = options.paperSize || template.pageSettings.size || 'a4';

    // Initialize jsPDF document (unit in mm)
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: format.toLowerCase(),
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margins = options.margins || template.pageSettings.margins || { top: 12, right: 12, bottom: 12, left: 12 };
    const contentWidth = pageWidth - margins.left - margins.right;

    let currentY = margins.top;

    // Helper: Add watermark
    const addWatermark = (text?: string, opacity = 0.08) => {
      const wmText = text || (template.pageSettings.watermark?.enabled ? template.pageSettings.watermark.text : '');
      if (!wmText) return;

      doc.saveGraphicsState();
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(44);
      doc.setFont('helvetica', 'bold');
      // @ts-ignore
      if (doc.setGState) {
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity }));
      }
      doc.text(wmText, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: orientation === 'portrait' ? -45 : -30,
      });
      doc.restoreGraphicsState();
    };

    // Helper: Add page header and footer
    const addPageDecoration = (pageNum: number, totalPagesRef: { count: number }) => {
      addWatermark(options.watermarkText, options.watermarkOpacity);

      // Top running line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margins.left, margins.top - 3, pageWidth - margins.right, margins.top - 3);

      // Bottom footer text
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');

      const footerText = `Enterprise Report Engine • ${template.name} • Version ${template.version}`;
      doc.text(footerText, margins.left, pageHeight - margins.bottom + 6);

      if (options.pageNumbering !== false) {
        const pageStr = `Page ${pageNum} of ${totalPagesRef.count}`;
        doc.text(pageStr, pageWidth - margins.right, pageHeight - margins.bottom + 6, { align: 'right' });
      }

      if (options.printDate !== false) {
        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.text(`Printed: ${dateStr}`, pageWidth / 2, pageHeight - margins.bottom + 6, { align: 'center' });
      }
    };

    // ==========================================
    // 1. REPORT HEADER BAND
    // ==========================================
    const reportHeader = template.bands.reportHeader;
    if (reportHeader && reportHeader.visible) {
      // Background accent bar
      doc.setFillColor(2, 132, 199); // Cyan-600
      doc.rect(margins.left, currentY, 3, 18, 'F');

      // Title & category
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(2, 132, 199);
      doc.text((template.category || 'BUSINESS REPORT').toUpperCase() + ' • CRYSTAL REPORT ENGINE', margins.left + 6, currentY + 4);

      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(template.name, margins.left + 6, currentY + 11);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated for Enterprise Systems | Parameter: Territory = ${parameters.Region || 'All'}`, margins.left + 6, currentY + 16);

      currentY += 24;
    }

    // ==========================================
    // 2. PAGE HEADER / KPI SUMMARY
    // ==========================================
    const kpiElements = template.elements.filter((el) => el.type === 'kpi' && el.band === 'pageHeader');
    if (kpiElements.length > 0) {
      const kpiWidth = (contentWidth - (kpiElements.length - 1) * 4) / kpiElements.length;
      kpiElements.forEach((kpi, idx) => {
        const kpiX = margins.left + idx * (kpiWidth + 4);
        const kpiHeight = 20;

        // Card bg
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(kpiX, currentY, kpiWidth, kpiHeight, 2, 2, 'FD');

        // Title
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.kpiTitle || 'Metric', kpiX + 4, currentY + 5);

        // Value
        const evaluatedVal = kpi.formula
          ? FormulaEngine.evaluate(kpi.formula, {}, dataset, parameters)
          : (kpi.content || '0');
        const formattedVal = FormulaEngine.formatValue(evaluatedVal, kpi.format, kpi.prefix, kpi.suffix);

        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(String(formattedVal), kpiX + 4, currentY + 12);

        // Trend
        if (kpi.kpiTrendField) {
          doc.setFontSize(7.5);
          doc.setTextColor(16, 185, 129); // emerald
          doc.text(kpi.kpiTrendField, kpiX + 4, currentY + 17);
        }
      });

      currentY += 26;
    }

    // ==========================================
    // 3. DETAILS BAND: DATA TABLE WITH PAGINATION
    // ==========================================
    const tableElement = template.elements.find((el) => el.type === 'table');
    const columns = tableElement?.columns || [
      { id: '1', header: 'Item', field: 'order_number', width: 25, align: 'left' },
      { id: '2', header: 'Description', field: 'customer_name', width: 35, align: 'left' },
      { id: '3', header: 'Category', field: 'product_category', width: 20, align: 'left' },
      { id: '4', header: 'Revenue', field: 'gross_revenue', width: 20, align: 'right', format: 'currency', summaryType: 'sum' },
    ];

    // Compute column widths in mm
    const totalDefinedWidth = columns.reduce((acc, c) => acc + c.width, 0);
    const colWidthsMm = columns.map((c) => (c.width / totalDefinedWidth) * contentWidth);

    // Function to render table header
    const renderTableHeader = (yPos: number) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(margins.left, yPos, contentWidth, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(margins.left, yPos + 8, margins.left + contentWidth, yPos + 8);

      let colX = margins.left;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);

      columns.forEach((col, idx) => {
        const width = colWidthsMm[idx];
        const textX = col.align === 'right' ? colX + width - 3 : col.align === 'center' ? colX + width / 2 : colX + 3;
        doc.text(col.header, textX, yPos + 5.5, { align: col.align || 'left' });
        colX += width;
      });

      return yPos + 8;
    };

    // Draw initial Table Header
    currentY = renderTableHeader(currentY);

    const rowHeight = 7.5;
    const maxY = pageHeight - margins.bottom - 20;

    // Render dataset rows
    dataset.forEach((row, rowIdx) => {
      // Check if row exceeds page height -> add new page
      if (currentY + rowHeight > maxY) {
        doc.addPage(format.toLowerCase(), orientation);
        currentY = margins.top + 8;
        currentY = renderTableHeader(currentY);
      }

      // Alternating row background
      if (rowIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margins.left, currentY, contentWidth, rowHeight, 'F');
      }

      // Bottom subtle row border
      doc.setDrawColor(241, 245, 249);
      doc.line(margins.left, currentY + rowHeight, margins.left + contentWidth, currentY + rowHeight);

      let colX = margins.left;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      columns.forEach((col, cIdx) => {
        const width = colWidthsMm[cIdx];
        const rawVal = row[col.field];
        const formatted = FormulaEngine.formatValue(rawVal, col.format);
        const textX = col.align === 'right' ? colX + width - 3 : col.align === 'center' ? colX + width / 2 : colX + 3;

        // Truncate long text if necessary
        const maxCharLen = Math.floor(width * 0.45);
        const safeText = String(formatted).length > maxCharLen ? String(formatted).slice(0, maxCharLen - 3) + '...' : String(formatted);

        doc.text(safeText, textX, currentY + 5, { align: col.align || 'left' });
        colX += width;
      });

      currentY += rowHeight;
    });

    // ==========================================
    // 4. TABLE FOOTER / SUMMARY ROW
    // ==========================================
    if (tableElement?.showTableFooter !== false) {
      if (currentY + 10 > maxY) {
        doc.addPage(format.toLowerCase(), orientation);
        currentY = margins.top + 8;
      }

      doc.setFillColor(226, 232, 240);
      doc.rect(margins.left, currentY, contentWidth, 8, 'F');
      doc.setDrawColor(148, 163, 184);
      doc.line(margins.left, currentY, margins.left + contentWidth, currentY);
      doc.line(margins.left, currentY + 8, margins.left + contentWidth, currentY + 8);

      let colX = margins.left;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);

      columns.forEach((col, cIdx) => {
        const width = colWidthsMm[cIdx];
        if (cIdx === 0) {
          doc.text('TOTALS / SUMMARY', colX + 3, currentY + 5.5);
        } else if (col.summaryType === 'sum') {
          const sum = dataset.reduce((acc, r) => acc + (Number(r[col.field]) || 0), 0);
          const formatted = FormulaEngine.formatValue(sum, col.format);
          const textX = col.align === 'right' ? colX + width - 3 : colX + 3;
          doc.text(String(formatted), textX, currentY + 5.5, { align: col.align || 'left' });
        }
        colX += width;
      });

      currentY += 14;
    }

    // ==========================================
    // 5. REPORT FOOTER / GRAND SUMMARY
    // ==========================================
    if (currentY + 25 > maxY) {
      doc.addPage(format.toLowerCase(), orientation);
      currentY = margins.top + 8;
    }

    const reportFooter = template.bands.reportFooter;
    if (reportFooter && reportFooter.visible) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margins.left, currentY, contentWidth, 20, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      doc.text('Certified Crystal Analytics Report • Enterprise SQL Data Connector', margins.left + 4, currentY + 6);
      doc.text('This document was rendered directly from the report design specification (.rpt.json).', margins.left + 4, currentY + 11);
      doc.text('Authorized by: Corporate BI Architecture Governance', margins.left + 4, currentY + 16);
    }

    // ==========================================
    // 6. FINALIZE MULTI-PAGE DECORATIONS
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    const totalPagesRef = { count: totalPages };

    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      addPageDecoration(p, totalPagesRef);
    }

    return doc;
  }

  /**
   * Generates and downloads a CSV export of the report data.
   */
  public static exportToCsv(template: ReportTemplate, dataset: Record<string, any>[]): void {
    if (!dataset || dataset.length === 0) return;

    const tableElement = template.elements.find((el) => el.type === 'table');
    const columns = tableElement?.columns || Object.keys(dataset[0]).map((k) => ({ id: k, header: k, field: k, width: 10, align: 'left' as const }));

    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = dataset.map((row) =>
      columns.map((c) => {
        const val = row[c.field] !== undefined ? String(row[c.field]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${template.id}-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Exports the entire report template specification as a .rpt.json file.
   */
  public static exportTemplateJson(template: ReportTemplate): void {
    const jsonStr = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${template.id}.rpt.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
