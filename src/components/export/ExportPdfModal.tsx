import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  Settings, 
  Shield, 
  Check, 
  Sliders, 
  Sparkles 
} from 'lucide-react';
import { ReportTemplate } from '../../types/report';
import { PdfExporter, PdfExportOptions } from '../../services/pdfExporter';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ReportTemplate;
  dataset: Record<string, any>[];
  parameters: Record<string, any>;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  template,
  dataset,
  parameters,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    template.pageSettings.orientation || 'portrait'
  );
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('INTERNAL CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.08);
  const [printDate, setPrintDate] = useState(true);
  const [pageNumbering, setPageNumbering] = useState(true);
  const [fileName, setFileName] = useState(`${template.id}-export.pdf`);
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePdf = () => {
    setGenerating(true);
    setTimeout(() => {
      try {
        const options: PdfExportOptions = {
          orientation,
          paperSize,
          watermarkText: watermarkEnabled ? watermarkText : undefined,
          watermarkOpacity,
          printDate,
          pageNumbering,
          fileName,
        };

        const doc = PdfExporter.exportToPdf(template, dataset, parameters, options);
        doc.save(fileName);
        setGenerating(false);
        onClose();
      } catch (err) {
        console.error('PDF export error:', err);
        alert('Failed to generate PDF');
        setGenerating(false);
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Export High-Fidelity Crystal PDF</h3>
              <p className="text-xs text-slate-400">Configure layout geometry, headers, footers, and watermarking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Filename */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Export File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Grid Layout & Geometry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200">Page Geometry</h4>
              
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Paper Format</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                  <option value="Legal">Legal (8.5 × 14 in)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Page Orientation</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="portrait">Portrait (Vertical)</option>
                  <option value="landscape">Landscape (Horizontal)</option>
                </select>
              </div>
            </div>

            {/* Headers & Footers */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200">Header & Footer Annotations</h4>
              
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer pt-1">
                <span>Page Numbers ("Page X of Y")</span>
                <input
                  type="checkbox"
                  checked={pageNumbering}
                  onChange={(e) => setPageNumbering(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Print Timestamp & Generation Date</span>
                <input
                  type="checkbox"
                  checked={printDate}
                  onChange={(e) => setPrintDate(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                />
              </label>

              <div className="text-[11px] text-slate-500 pt-1">
                Data rows: <span className="text-slate-300 font-mono">{dataset.length} records</span>
              </div>
            </div>
          </div>

          {/* Watermark Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">Security Watermark Overlay</span>
              </div>
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-600"
              />
            </div>

            {watermarkEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Watermark Stamp Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono"
                    placeholder="e.g. CONFIDENTIAL"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Opacity ({Math.round(watermarkOpacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.03"
                    max="0.25"
                    step="0.01"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 mt-2"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={handleGeneratePdf}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{generating ? 'Compiling PDF...' : 'Download PDF Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
