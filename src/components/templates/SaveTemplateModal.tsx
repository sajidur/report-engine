import React, { useState } from 'react';
import { ReportTemplate, ReportBand } from '../../types/report';
import { X, Save, BookmarkCheck, FileText, User, Tag } from 'lucide-react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: ReportTemplate;
  onSaveAsTemplate: (newTemplate: ReportTemplate) => void;
}

const CATEGORIES = [
  'Sales',
  'Financial',
  'Executive',
  'Invoicing',
  'Operations',
  'SaaS',
  'HR',
  'Healthcare',
  'Custom',
];

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  currentTemplate,
  onSaveAsTemplate,
}) => {
  const [name, setName] = useState(currentTemplate.name + ' (Custom)');
  const [description, setDescription] = useState(currentTemplate.description || 'Customized enterprise report layout');
  const [category, setCategory] = useState<string>(currentTemplate.category || 'Custom');
  const [author, setAuthor] = useState(currentTemplate.author || 'Enterprise Architect');
  const [version, setVersion] = useState('1.0.0');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedTemplate: ReportTemplate = {
      ...currentTemplate,
      id: `rpt-lib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: description.trim(),
      category: category as any,
      author: author.trim(),
      version: version.trim() || '1.0.0',
      createdAt: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    onSaveAsTemplate(savedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Save to Template Library</h3>
              <p className="text-xs text-slate-400">Save current report layout for reuse across teams & projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Template Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="e.g. Quarterly Executive Revenue Summary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="Enterprise Developer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description & Use Case
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
              placeholder="Describe the report contents, group structures, and intended business consumers..."
            />
          </div>

          {/* Template Specs Summary Pill */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">{currentTemplate.elements.length} Elements</span>
              <span>•</span>
              <span>{(Object.values(currentTemplate.bands) as (ReportBand | undefined)[]).filter((b) => b?.visible).length} Bands</span>
              <span>•</span>
              <span className="capitalize">{currentTemplate.pageSettings.orientation}</span>
            </div>
            <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              {currentTemplate.pageSettings.size}
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save to Library</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
