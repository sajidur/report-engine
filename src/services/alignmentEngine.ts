import { ReportElement, ReportBand, BandType } from '../types/report';

export interface SnapGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number; // canvas X for vertical, band Y for horizontal
  start: number; // Y start for vertical, X start for horizontal
  end: number;   // Y end for vertical, X end for horizontal
  label?: string;
  color?: string;
}

export interface DragHudInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  bandName?: string;
  snapMessage: string;
  isSnapped: boolean;
  deltaX?: number;
  deltaY?: number;
}

export type GridStyleType = 'dots' | 'lines' | 'crosshairs' | 'off';

export interface GridSettings {
  enabled: boolean;
  size: number; // 4, 8, 12, 16, 24, 32
  style: GridStyleType;
  opacity: number; // 0.1 to 1.0
  magneticSnap: boolean;
  magneticThreshold: number; // in px, e.g. 6
  showRulers: boolean;
  showMargins: boolean;
  showBandHeaders: boolean;
  showOutlines: boolean;
  showConditionalRulesPreview: boolean;
  dataPreviewMode: 'design' | 'live';
  viewLayout: 'single' | 'split';
  previewWatermark?: 'none' | 'draft' | 'confidential' | 'approved' | 'sample';
  previewTheme?: 'corporate-blue' | 'emerald' | 'purple' | 'amber' | 'monochrome';
  previewRecordLimit?: number;
  previewShowKpiSummary?: boolean;
  previewPageSimulation?: boolean;
}

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  enabled: true,
  size: 8,
  style: 'dots',
  opacity: 0.35,
  magneticSnap: true,
  magneticThreshold: 6,
  showRulers: true,
  showMargins: true,
  showBandHeaders: true,
  showOutlines: true,
  showConditionalRulesPreview: true,
  dataPreviewMode: 'design',
  viewLayout: 'single',
  previewWatermark: 'none',
  previewTheme: 'corporate-blue',
  previewRecordLimit: 25,
  previewShowKpiSummary: true,
  previewPageSimulation: true,
};

export class AlignmentEngine {
  /**
   * Snaps a coordinate to the nearest grid line if grid snapping is enabled
   */
  static snapToGridValue(val: number, gridSize: number): number {
    return Math.round(val / gridSize) * gridSize;
  }

  /**
   * Calculates snapping guides and final snapped coordinates during element dragging
   */
  static calculateSnapping(
    targetEl: ReportElement,
    otherElementsInBand: ReportElement[],
    gridSettings: GridSettings,
    canvasWidth: number,
    bandHeight: number
  ): {
    x: number;
    y: number;
    guides: SnapGuide[];
    hud: DragHudInfo;
  } {
    const dummyBand: ReportBand = {
      type: targetEl.band,
      name: targetEl.band,
      height: bandHeight,
      visible: true,
    };
    const res = this.computeDragAlignment(
      targetEl,
      targetEl.x,
      targetEl.y,
      targetEl.width,
      targetEl.height,
      otherElementsInBand,
      dummyBand,
      canvasWidth,
      gridSettings,
      targetEl.x,
      targetEl.y
    );
    return {
      x: res.finalX,
      y: res.finalY,
      guides: res.guides,
      hud: res.hud,
    };
  }

  /**
   * Evaluates magnetic alignment guides and grid snapping during element drag/resize
   */
  static computeDragAlignment(
    targetEl: ReportElement,
    rawX: number,
    rawY: number,
    width: number,
    height: number,
    otherElementsInBand: ReportElement[],
    band: ReportBand,
    canvasWidth: number,
    gridSettings: GridSettings,
    startX: number,
    startY: number
  ): {
    finalX: number;
    finalY: number;
    guides: SnapGuide[];
    hud: DragHudInfo;
  } {
    let finalX = Math.max(0, rawX);
    let finalY = Math.max(0, rawY);
    const guides: SnapGuide[] = [];
    let snapMessage = 'Free Movement';
    let isSnapped = false;

    const threshold = gridSettings.magneticThreshold || 6;
    const isMagnetic = gridSettings.magneticSnap;

    // 1. Grid Snapping Baseline
    if (gridSettings.enabled) {
      const gX = this.snapToGridValue(rawX, gridSettings.size);
      const gY = this.snapToGridValue(rawY, gridSettings.size);
      finalX = gX;
      finalY = gY;
      isSnapped = true;
      snapMessage = `Grid Snap (${gridSettings.size}px) [X:${gX}, Y:${gY}]`;
    }

    if (isMagnetic) {
      // Key X reference points for target element: Left, Center, Right
      const targetLeft = rawX;
      const targetCenterX = rawX + width / 2;
      const targetRight = rawX + width;

      // Key Y reference points for target element: Top, Center, Bottom
      const targetTop = rawY;
      const targetCenterY = rawY + height / 2;
      const targetBottom = rawY + height;

      // Canvas / Margin anchors
      const marginPoints = [
        { x: 16, label: 'Left Margin (16px)' },
        { x: canvasWidth / 2, label: 'Canvas Center' },
        { x: canvasWidth - 16, label: 'Right Margin' },
      ];

      // Check canvas vertical margin alignment
      for (const m of marginPoints) {
        // Left align to margin
        if (Math.abs(targetLeft - m.x) <= threshold) {
          finalX = m.x;
          isSnapped = true;
          snapMessage = m.label;
          guides.push({
            id: `guide-margin-${m.x}`,
            type: 'vertical',
            position: m.x,
            start: 0,
            end: band.height,
            label: m.label,
            color: '#06b6d4',
          });
          break;
        }
        // Center align to margin/center
        if (Math.abs(targetCenterX - m.x) <= threshold) {
          finalX = m.x - width / 2;
          isSnapped = true;
          snapMessage = m.label;
          guides.push({
            id: `guide-margin-center-${m.x}`,
            type: 'vertical',
            position: m.x,
            start: 0,
            end: band.height,
            label: m.label,
            color: '#06b6d4',
          });
          break;
        }
        // Right align to margin
        if (Math.abs(targetRight - m.x) <= threshold) {
          finalX = m.x - width;
          isSnapped = true;
          snapMessage = m.label;
          guides.push({
            id: `guide-margin-right-${m.x}`,
            type: 'vertical',
            position: m.x,
            start: 0,
            end: band.height,
            label: m.label,
            color: '#06b6d4',
          });
          break;
        }
      }

      // Check band vertical anchors
      const bandYPoints = [
        { y: 8, label: 'Top Margin (8px)' },
        { y: band.height / 2, label: 'Band Center' },
        { y: band.height - height - 8, label: 'Bottom Margin' },
      ];

      for (const bPoint of bandYPoints) {
        if (Math.abs(targetTop - bPoint.y) <= threshold) {
          finalY = bPoint.y;
          isSnapped = true;
          snapMessage = bPoint.label;
          guides.push({
            id: `guide-band-y-${bPoint.y}`,
            type: 'horizontal',
            position: bPoint.y,
            start: 0,
            end: canvasWidth,
            label: bPoint.label,
            color: '#06b6d4',
          });
          break;
        }
      }

      // Check Magnetic Alignment with other elements in the band
      for (const other of otherElementsInBand) {
        if (other.id === targetEl.id) continue;

        const otherLeft = other.x;
        const otherCenterX = other.x + other.width / 2;
        const otherRight = other.x + other.width;

        const otherTop = other.y;
        const otherCenterY = other.y + other.height / 2;
        const otherBottom = other.y + other.height;

        // 1. Left-to-Left alignment
        if (Math.abs(targetLeft - otherLeft) <= threshold) {
          finalX = otherLeft;
          isSnapped = true;
          snapMessage = `Aligned Left with "${other.name || other.type}"`;
          guides.push({
            id: `guide-el-left-${other.id}`,
            type: 'vertical',
            position: otherLeft,
            start: Math.min(finalY, otherTop),
            end: Math.max(finalY + height, otherBottom),
            label: `Left: ${other.name || other.type}`,
            color: '#ec4899',
          });
        }
        // 2. Center-to-Center X alignment
        else if (Math.abs(targetCenterX - otherCenterX) <= threshold) {
          finalX = otherCenterX - width / 2;
          isSnapped = true;
          snapMessage = `Centered with "${other.name || other.type}"`;
          guides.push({
            id: `guide-el-center-x-${other.id}`,
            type: 'vertical',
            position: otherCenterX,
            start: Math.min(finalY, otherTop),
            end: Math.max(finalY + height, otherBottom),
            label: `Center: ${other.name || other.type}`,
            color: '#8b5cf6',
          });
        }
        // 3. Right-to-Right alignment
        else if (Math.abs(targetRight - otherRight) <= threshold) {
          finalX = otherRight - width;
          isSnapped = true;
          snapMessage = `Aligned Right with "${other.name || other.type}"`;
          guides.push({
            id: `guide-el-right-${other.id}`,
            type: 'vertical',
            position: otherRight,
            start: Math.min(finalY, otherTop),
            end: Math.max(finalY + height, otherBottom),
            label: `Right: ${other.name || other.type}`,
            color: '#ec4899',
          });
        }

        // 4. Top-to-Top alignment
        if (Math.abs(targetTop - otherTop) <= threshold) {
          finalY = otherTop;
          isSnapped = true;
          snapMessage = `Aligned Top with "${other.name || other.type}"`;
          guides.push({
            id: `guide-el-top-${other.id}`,
            type: 'horizontal',
            position: otherTop,
            start: Math.min(finalX, otherLeft),
            end: Math.max(finalX + width, otherRight),
            label: `Top: ${other.name || other.type}`,
            color: '#ec4899',
          });
        }
        // 5. Center-to-Center Y alignment
        else if (Math.abs(targetCenterY - otherCenterY) <= threshold) {
          finalY = otherCenterY - height / 2;
          isSnapped = true;
          snapMessage = `Middle Aligned with "${other.name || other.type}"`;
          guides.push({
            id: `guide-el-center-y-${other.id}`,
            type: 'horizontal',
            position: otherCenterY,
            start: Math.min(finalX, otherLeft),
            end: Math.max(finalX + width, otherRight),
            label: `Middle: ${other.name || other.type}`,
            color: '#8b5cf6',
          });
        }
        // 6. Bottom-to-Bottom alignment
        else if (Math.abs(targetBottom - otherBottom) <= threshold) {
          finalY = otherBottom - height;
          isSnapped = true;
          snapMessage = `Aligned Bottom with "${other.name || other.type}"`;
          guides.push({
            id: `guide-el-bottom-${other.id}`,
            type: 'horizontal',
            position: otherBottom,
            start: Math.min(finalX, otherLeft),
            end: Math.max(finalX + width, otherRight),
            label: `Bottom: ${other.name || other.type}`,
            color: '#ec4899',
          });
        }
      }
    }

    // If grid snapping is active and no magnetic guides were created on an axis, provide grid snap guide
    if (gridSettings.enabled) {
      if (!guides.some((g) => g.type === 'vertical')) {
        guides.push({
          id: `guide-grid-x-${Math.round(finalX)}`,
          type: 'vertical',
          position: Math.round(finalX),
          start: 0,
          end: band.height,
          label: `Grid X: ${Math.round(finalX)}px`,
          color: '#0ea5e9',
        });
      }
      if (!guides.some((g) => g.type === 'horizontal')) {
        guides.push({
          id: `guide-grid-y-${Math.round(finalY)}`,
          type: 'horizontal',
          position: Math.round(finalY),
          start: 0,
          end: canvasWidth,
          label: `Grid Y: ${Math.round(finalY)}px`,
          color: '#0ea5e9',
        });
      }
    }

    const hud: DragHudInfo = {
      x: Math.round(finalX),
      y: Math.round(finalY),
      width: Math.round(width),
      height: Math.round(height),
      bandName: band.name || band.type,
      snapMessage,
      isSnapped,
      deltaX: Math.round(finalX - startX),
      deltaY: Math.round(finalY - startY),
    };

    return {
      finalX: Math.round(finalX),
      finalY: Math.round(finalY),
      guides,
      hud,
    };
  }

  /**
   * Applies precision alignment commands to an element
   */
  static alignElement(
    el: ReportElement,
    action:
      | 'align-left'
      | 'align-center'
      | 'align-right'
      | 'align-top'
      | 'align-middle'
      | 'align-bottom'
      | 'expand-width'
      | 'snap-to-grid',
    band: ReportBand,
    canvasWidth: number,
    gridSize: number
  ): ReportElement {
    let newX = el.x;
    let newY = el.y;
    let newW = el.width;
    let newH = el.height;

    switch (action) {
      case 'align-left':
        newX = 16;
        break;
      case 'align-center':
        newX = Math.round((canvasWidth - el.width) / 2);
        break;
      case 'align-right':
        newX = canvasWidth - el.width - 16;
        break;
      case 'align-top':
        newY = 8;
        break;
      case 'align-middle':
        newY = Math.max(0, Math.round((band.height - el.height) / 2));
        break;
      case 'align-bottom':
        newY = Math.max(0, band.height - el.height - 8);
        break;
      case 'expand-width':
        newX = 16;
        newW = canvasWidth - 32;
        break;
      case 'snap-to-grid':
        newX = this.snapToGridValue(el.x, gridSize);
        newY = this.snapToGridValue(el.y, gridSize);
        newW = Math.max(gridSize, this.snapToGridValue(el.width, gridSize));
        newH = Math.max(gridSize, this.snapToGridValue(el.height, gridSize));
        break;
    }

    return {
      ...el,
      x: newX,
      y: newY,
      width: newW,
      height: newH,
    };
  }

  /**
   * Snaps all elements in a specific band to the grid
   */
  static snapAllBandElementsToGrid(
    allElements: ReportElement[],
    targetBand: BandType,
    gridSize: number
  ): {
    updatedElements: ReportElement[];
    snappedCount: number;
    description: string;
  } {
    const size = gridSize > 0 ? gridSize : 8;
    let count = 0;
    const updatedElements = allElements.map((el) => {
      if (el.band !== targetBand) return el;
      const nx = this.snapToGridValue(el.x, size);
      const ny = this.snapToGridValue(el.y, size);
      const nw = Math.max(size, this.snapToGridValue(el.width, size));
      const nh = Math.max(size, this.snapToGridValue(el.height, size));
      if (nx !== el.x || ny !== el.y || nw !== el.width || nh !== el.height) {
        count++;
      }
      return {
        ...el,
        x: nx,
        y: ny,
        width: nw,
        height: nh,
      };
    });
    return {
      updatedElements,
      snappedCount: count,
      description: `Snapped ${count} element${count === 1 ? '' : 's'} in ${targetBand} to ${size}px grid`,
    };
  }

  /**
   * Constraint-based Auto-Arrange Algorithm:
   * Spaces out all elements in the target band evenly across available band geometry.
   * Preserves relative reading order while distributing horizontal/vertical gaps cleanly.
   */
  static autoArrangeBandElements(
    allElements: ReportElement[],
    targetBand: BandType,
    band: ReportBand,
    canvasWidth: number,
    gridSize: number = 8,
    mode: 'auto' | 'horizontal' | 'grid' | 'vertical' = 'auto'
  ): {
    updatedElements: ReportElement[];
    arrangedCount: number;
    recommendedBandHeight?: number;
    layoutDescription: string;
  } {
    const bandElements = allElements.filter((el) => el.band === targetBand);
    if (bandElements.length === 0) {
      return {
        updatedElements: allElements,
        arrangedCount: 0,
        layoutDescription: 'No elements in active band to arrange',
      };
    }

    const marginX = 16;
    const marginY = 8;
    const availableWidth = Math.max(100, canvasWidth - marginX * 2);
    const bandHeight = band.height || 60;

    // Single element in band
    if (bandElements.length === 1) {
      const el = bandElements[0];
      const updatedEl: ReportElement = {
        ...el,
        x: el.width >= availableWidth ? marginX : Math.round((canvasWidth - el.width) / 2),
        y: Math.max(marginY, Math.round((bandHeight - el.height) / 2)),
      };
      if (gridSize > 0) {
        updatedEl.x = this.snapToGridValue(updatedEl.x, gridSize);
        updatedEl.y = this.snapToGridValue(updatedEl.y, gridSize);
      }
      return {
        updatedElements: allElements.map((item) => (item.id === updatedEl.id ? updatedEl : item)),
        arrangedCount: 1,
        layoutDescription: `Centered 1 element in ${band.name || targetBand}`,
      };
    }

    // Determine auto layout strategy
    const totalElementWidth = bandElements.reduce((acc, el) => acc + el.width, 0);
    const minSpacingNeeded = (bandElements.length - 1) * 8;
    const fitsSingleRow = totalElementWidth + minSpacingNeeded <= availableWidth;

    let effectiveMode = mode;
    if (effectiveMode === 'auto') {
      if (fitsSingleRow) {
        effectiveMode = 'horizontal';
      } else {
        effectiveMode = 'grid';
      }
    }

    let modifiedMap = new Map<string, ReportElement>();
    let recommendedHeight = bandHeight;
    let desc = '';

    if (effectiveMode === 'horizontal') {
      // Sort elements by X to preserve left-to-right visual order
      const sorted = [...bandElements].sort((a, b) => a.x - b.x);
      const totalWidth = sorted.reduce((acc, el) => acc + el.width, 0);
      const count = sorted.length;

      let gap = count > 1 ? (availableWidth - totalWidth) / (count - 1) : 0;
      gap = Math.max(8, gap);

      let currentX = marginX;
      for (let i = 0; i < sorted.length; i++) {
        const el = sorted[i];
        let targetX = currentX;
        let targetY = Math.max(marginY, Math.round((bandHeight - el.height) / 2));

        if (gridSize > 0) {
          targetX = this.snapToGridValue(targetX, gridSize);
          targetY = this.snapToGridValue(targetY, gridSize);
        }

        modifiedMap.set(el.id, {
          ...el,
          x: targetX,
          y: targetY,
        });

        currentX += el.width + gap;
      }
      desc = `Evenly spaced ${count} elements horizontally in ${band.name || targetBand}`;
    } else if (effectiveMode === 'vertical') {
      // Sort by Y to preserve top-to-bottom visual order
      const sorted = [...bandElements].sort((a, b) => a.y - b.y);
      const totalHeight = sorted.reduce((acc, el) => acc + el.height, 0);
      const count = sorted.length;
      const availableHeight = Math.max(30, bandHeight - marginY * 2);

      let gapY = count > 1 ? (availableHeight - totalHeight) / (count - 1) : 8;
      gapY = Math.max(6, gapY);

      let currentY = marginY;
      for (let i = 0; i < sorted.length; i++) {
        const el = sorted[i];
        let targetX = el.width >= availableWidth ? marginX : Math.round((canvasWidth - el.width) / 2);
        let targetY = currentY;

        if (gridSize > 0) {
          targetX = this.snapToGridValue(targetX, gridSize);
          targetY = this.snapToGridValue(targetY, gridSize);
        }

        modifiedMap.set(el.id, {
          ...el,
          x: targetX,
          y: targetY,
        });

        currentY += el.height + gapY;
      }

      recommendedHeight = Math.max(bandHeight, Math.round(currentY + marginY));
      desc = `Evenly stacked ${count} elements vertically in ${band.name || targetBand}`;
    } else {
      // Multi-row Grid Flow: Wrap elements into balanced rows, evenly spacing elements in each row
      const sorted = [...bandElements].sort((a, b) => {
        // Group roughly by Y first, then X
        if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
        return a.x - b.x;
      });

      const rows: ReportElement[][] = [];
      let currentRow: ReportElement[] = [];
      let currentRowWidth = 0;

      for (const el of sorted) {
        const elementWidthWithGap = el.width + (currentRow.length > 0 ? 12 : 0);
        if (currentRow.length > 0 && currentRowWidth + elementWidthWithGap > availableWidth) {
          rows.push(currentRow);
          currentRow = [el];
          currentRowWidth = el.width;
        } else {
          currentRow.push(el);
          currentRowWidth += elementWidthWithGap;
        }
      }
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      const rowGap = 12;
      let currentY = marginY;

      for (const row of rows) {
        const rowTotalWidth = row.reduce((acc, el) => acc + el.width, 0);
        const rowMaxHeight = Math.max(...row.map((el) => el.height), 30);
        const rowCount = row.length;
        const rowGapX = rowCount > 1 ? Math.max(8, (availableWidth - rowTotalWidth) / (rowCount - 1)) : 0;

        let rowCurrentX = marginX;
        for (const el of row) {
          let targetX = rowCount === 1 ? Math.round((canvasWidth - el.width) / 2) : rowCurrentX;
          let targetY = currentY + Math.max(0, Math.round((rowMaxHeight - el.height) / 2));

          if (gridSize > 0) {
            targetX = this.snapToGridValue(targetX, gridSize);
            targetY = this.snapToGridValue(targetY, gridSize);
          }

          modifiedMap.set(el.id, {
            ...el,
            x: targetX,
            y: targetY,
          });

          rowCurrentX += el.width + rowGapX;
        }

        currentY += rowMaxHeight + rowGap;
      }

      recommendedHeight = Math.max(bandHeight, Math.round(currentY + marginY));
      desc = `Auto-arranged ${bandElements.length} elements across ${rows.length} rows in ${band.name || targetBand}`;
    }

    const updatedElements = allElements.map((el) => modifiedMap.get(el.id) || el);

    return {
      updatedElements,
      arrangedCount: bandElements.length,
      recommendedBandHeight: recommendedHeight > bandHeight ? recommendedHeight : undefined,
      layoutDescription: desc,
    };
  }
}
