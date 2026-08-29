import { useState, useCallback, useEffect, useRef } from 'react';
import { ReportTemplate } from '../types/report';

export interface HistoryEntry {
  id: string;
  template: ReportTemplate;
  action: string;
  timestamp: number;
}

export interface UseUndoRedoResult {
  template: ReportTemplate;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryEntry[];
  currentIndex: number;
  undo: () => void;
  redo: () => void;
  setTemplate: (newTemplate: ReportTemplate | ((prev: ReportTemplate) => ReportTemplate), actionLabel?: string) => void;
  resetHistory: (initialTemplate: ReportTemplate, label?: string) => void;
  jumpToHistoryIndex: (index: number) => void;
  lastAction: string;
}

const MAX_HISTORY_STEPS = 60;

export function useUndoRedo(initialTemplate: ReportTemplate): UseUndoRedoResult {
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: `hist-init-${Date.now()}`,
      template: initialTemplate,
      action: 'Initial Template Loaded',
      timestamp: Date.now(),
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Keep a ref to latest state to avoid stale closures in event listeners
  const historyRef = useRef(history);
  historyRef.current = history;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  const currentTemplate = history[currentIndex]?.template || initialTemplate;
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const lastAction = history[currentIndex]?.action || 'Ready';

  // Push new template snapshot
  const setTemplate = useCallback((
    newTemplateOrUpdater: ReportTemplate | ((prev: ReportTemplate) => ReportTemplate),
    actionLabel: string = 'Modified Template'
  ) => {
    const prevTemplate = historyRef.current[indexRef.current]?.template;
    const nextTemplate = typeof newTemplateOrUpdater === 'function'
      ? newTemplateOrUpdater(prevTemplate)
      : newTemplateOrUpdater;

    // Check if it's identical
    if (nextTemplate === prevTemplate) return;

    setHistory((prevHistory) => {
      // Cut off future branch if we were in the middle of history
      const sliced = prevHistory.slice(0, indexRef.current + 1);

      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        template: nextTemplate,
        action: actionLabel,
        timestamp: Date.now(),
      };

      const updated = [...sliced, newEntry];
      // Cap at maximum history steps
      if (updated.length > MAX_HISTORY_STEPS) {
        return updated.slice(updated.length - MAX_HISTORY_STEPS);
      }
      return updated;
    });

    setCurrentIndex((prevIdx) => {
      const slicedLen = prevIdx + 1;
      const newLen = slicedLen + 1;
      return newLen > MAX_HISTORY_STEPS ? MAX_HISTORY_STEPS - 1 : prevIdx + 1;
    });
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, []);

  // Redo
  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, []);

  // Jump to specific point in history
  const jumpToHistoryIndex = useCallback((targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < historyRef.current.length) {
      setCurrentIndex(targetIndex);
    }
  }, []);

  // Reset entire history (e.g. when loading a new template from library)
  const resetHistory = useCallback((newInitialTemplate: ReportTemplate, label: string = 'Template Loaded') => {
    const initEntry: HistoryEntry = {
      id: `hist-init-${Date.now()}`,
      template: newInitialTemplate,
      action: label,
      timestamp: Date.now(),
    };
    setHistory([initEntry]);
    setCurrentIndex(0);
  }, []);

  // Global keyboard shortcuts for Undo/Redo (Ctrl+Z, Cmd+Z, Ctrl+Y, Cmd+Y, Ctrl+Shift+Z, Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut when active in text inputs or textareas to allow native text editing
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!isCmdOrCtrl) return;

      // Undo: Ctrl+Z / Cmd+Z (without shift)
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z
      else if (
        (e.key.toLowerCase() === 'y' && !e.shiftKey) ||
        (e.key.toLowerCase() === 'z' && e.shiftKey)
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    template: currentTemplate,
    canUndo,
    canRedo,
    history,
    currentIndex,
    undo,
    redo,
    setTemplate,
    resetHistory,
    jumpToHistoryIndex,
    lastAction,
  };
}
