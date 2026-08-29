import React from 'react';
import { ReportElement } from '../../types/report';

interface CanvasRulersProps {
  canvasWidth: number;
  totalCanvasHeight: number;
  zoom: number;
  mousePos: { x: number; y: number } | null;
  selectedElement: ReportElement | null;
  gridSize: number;
}

export const CanvasRulers: React.FC<CanvasRulersProps> = ({
  canvasWidth,
  totalCanvasHeight,
  zoom,
  mousePos,
  selectedElement,
  gridSize,
}) => {
  const step = 50; // Major tick step in pixels
  const numHorizontalTicks = Math.ceil(canvasWidth / step);
  const numVerticalTicks = Math.ceil(totalCanvasHeight / step);

  return (
    <>
      {/* Top Corner Badge */}
      <div 
        style={{ width: '24px', height: '24px' }}
        className="absolute -top-6 -left-6 z-30 bg-slate-900 border-r border-b border-slate-700 text-[9px] font-mono text-cyan-400 flex items-center justify-center select-none"
        title="Canvas origin (0,0) in pixels"
      >
        px
      </div>

      {/* Top Horizontal Ruler */}
      <div 
        style={{ 
          width: `${canvasWidth}px`, 
          height: '24px',
          top: '-24px',
          left: '0px'
        }}
        className="absolute z-20 bg-slate-900/95 border-b border-slate-700 text-[9px] font-mono text-slate-400 overflow-hidden select-none"
      >
        {/* Selected Element Horizontal Projection Span */}
        {selectedElement && (
          <div
            style={{
              left: `${selectedElement.x}px`,
              width: `${selectedElement.width}px`,
            }}
            className="absolute top-0 bottom-0 bg-cyan-500/20 border-x border-cyan-400 z-10 pointer-events-none"
          >
            <span className="absolute bottom-0.5 left-1 text-[8px] font-bold text-cyan-300 font-mono leading-none">
              {selectedElement.width}px
            </span>
          </div>
        )}

        {/* Mouse Position Indicator Line */}
        {mousePos && mousePos.x >= 0 && mousePos.x <= canvasWidth && (
          <div
            style={{ left: `${mousePos.x}px` }}
            className="absolute top-0 bottom-0 w-px bg-rose-400 z-20 pointer-events-none"
          >
            <span className="absolute top-0.5 left-1 text-[8px] font-mono text-rose-300 bg-slate-950 px-0.5 rounded shadow">
              {Math.round(mousePos.x)}
            </span>
          </div>
        )}

        {/* Ticks and Numbers */}
        <div className="relative w-full h-full">
          {Array.from({ length: numHorizontalTicks + 1 }).map((_, i) => {
            const pos = i * step;
            return (
              <div
                key={`h-tick-${pos}`}
                style={{ left: `${pos}px` }}
                className="absolute bottom-0 flex flex-col items-start pointer-events-none"
              >
                <div className="h-2 w-px bg-slate-600" />
                <span className="text-[8px] text-slate-400 pl-0.5 -mt-4 font-mono select-none">
                  {pos}
                </span>
                {/* Minor intermediate 10px ticks */}
                {i < numHorizontalTicks && (
                  <>
                    <div style={{ left: '10px' }} className="absolute bottom-0 h-1 w-px bg-slate-700" />
                    <div style={{ left: '20px' }} className="absolute bottom-0 h-1 w-px bg-slate-700" />
                    <div style={{ left: '25px' }} className="absolute bottom-0 h-1.5 w-px bg-slate-600" />
                    <div style={{ left: '30px' }} className="absolute bottom-0 h-1 w-px bg-slate-700" />
                    <div style={{ left: '40px' }} className="absolute bottom-0 h-1 w-px bg-slate-700" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Left Vertical Ruler */}
      <div
        style={{
          width: '24px',
          height: `${totalCanvasHeight}px`,
          top: '0px',
          left: '-24px',
        }}
        className="absolute z-20 bg-slate-900/95 border-r border-slate-700 text-[9px] font-mono text-slate-400 overflow-hidden select-none"
      >
        {/* Mouse Position Indicator Line */}
        {mousePos && mousePos.y >= 0 && mousePos.y <= totalCanvasHeight && (
          <div
            style={{ top: `${mousePos.y}px` }}
            className="absolute left-0 right-0 h-px bg-rose-400 z-20 pointer-events-none"
          >
            <span className="absolute left-0.5 -top-3 text-[8px] font-mono text-rose-300 bg-slate-950 px-0.5 rounded shadow">
              {Math.round(mousePos.y)}
            </span>
          </div>
        )}

        {/* Ticks and Numbers */}
        <div className="relative w-full h-full">
          {Array.from({ length: numVerticalTicks + 1 }).map((_, i) => {
            const pos = i * step;
            return (
              <div
                key={`v-tick-${pos}`}
                style={{ top: `${pos}px` }}
                className="absolute right-0 flex items-center justify-end w-full pointer-events-none"
              >
                <span className="text-[8px] text-slate-400 pr-1 -mt-2 font-mono select-none">
                  {pos}
                </span>
                <div className="w-2 h-px bg-slate-600" />
                {/* Minor intermediate 10px ticks */}
                {i < numVerticalTicks && (
                  <>
                    <div style={{ top: '10px' }} className="absolute right-0 w-1 h-px bg-slate-700" />
                    <div style={{ top: '20px' }} className="absolute right-0 w-1 h-px bg-slate-700" />
                    <div style={{ top: '25px' }} className="absolute right-0 w-1.5 h-px bg-slate-600" />
                    <div style={{ top: '30px' }} className="absolute right-0 w-1 h-px bg-slate-700" />
                    <div style={{ top: '40px' }} className="absolute right-0 w-1 h-px bg-slate-700" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
