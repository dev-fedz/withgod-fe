import React, { useRef, useEffect, useState } from 'react';
import {
  Trash2,
  Maximize2,
  Layers,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { AttachedImage, CanvasPageSettings, ImageWrapMode } from './WordRibbonToolbar';

interface RichWordCanvasProps {
  initialHtml: string;
  onChange: (html: string) => void;
  attachedImages: AttachedImage[];
  onUpdateImage: (imageId: string, partial: Partial<AttachedImage>) => void;
  onRemoveImage: (imageId: string) => void;
  pageSettings: CanvasPageSettings;
  editorRef: React.RefObject<HTMLDivElement>;
}

export const RichWordCanvas: React.FC<RichWordCanvasProps> = ({
  initialHtml,
  onChange,
  attachedImages,
  onUpdateImage,
  onRemoveImage,
  pageSettings,
  editorRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Drag-to-move state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startLeftPercent: number;
    startTopPercent: number;
    containerWidth: number;
    containerHeight: number;
    hasMoved: boolean;
  } | null>(null);

  // Drag-to-resize state
  const [resizingId, setResizingId] = useState<string | null>(null);
  const resizeStartRef = useRef<{
    startX: number;
    startWidthPercent: number;
    containerWidth: number;
  } | null>(null);

  // Sync initial content once
  useEffect(() => {
    if (editorRef.current && initialHtml && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml, editorRef]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const getPageBackgroundStyle = (): React.CSSProperties => {
    if (pageSettings.backgroundType === 'custom' && pageSettings.customBgUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - pageSettings.bgOpacity}), rgba(255, 255, 255, ${1 - pageSettings.bgOpacity})), url(${pageSettings.customBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    switch (pageSettings.backgroundType) {
      case 'cream':
        return { backgroundColor: '#FCFBF7' };
      case 'parchment':
        return { backgroundColor: '#F6F0E2' };
      case 'slate':
        return { backgroundColor: '#F3F4F6' };
      case 'midnight':
        return { backgroundColor: '#0F172A', color: '#F8FAFC' };
      default:
        return { backgroundColor: '#FFFFFF' };
    }
  };

  // Drag anywhere pointer handlers
  const handlePointerDown = (e: React.PointerEvent, img: AttachedImage) => {
    // If clicking inside a button or control, don't initiate drag
    if ((e.target as HTMLElement).closest('button, input, select, .no-drag')) {
      return;
    }
    e.stopPropagation();
    setSelectedImageId(img.id);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentLeft = img.leftPercent ?? 20;
    const currentTop = img.topPercent ?? 20;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeftPercent: currentLeft,
      startTopPercent: currentTop,
      containerWidth: rect.width,
      containerHeight: rect.height,
      hasMoved: false,
    };
    setDraggingId(img.id);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent, img: AttachedImage) => {
    if (draggingId !== img.id || !dragStartRef.current) return;
    const { startX, startY, startLeftPercent, startTopPercent, containerWidth, containerHeight } = dragStartRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      dragStartRef.current.hasMoved = true;
    }

    const deltaLeftPercent = (deltaX / containerWidth) * 100;
    const deltaTopPercent = (deltaY / containerHeight) * 100;

    let newLeft = Math.round(startLeftPercent + deltaLeftPercent);
    let newTop = Math.round(startTopPercent + deltaTopPercent);

    // Keep within bounds
    const maxLeft = Math.max(10, 100 - (img.widthPercent || 30));
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(2, Math.min(newTop, 90));

    onUpdateImage(img.id, {
      leftPercent: newLeft,
      topPercent: newTop,
    });
  };

  const handlePointerUp = (e: React.PointerEvent, img: AttachedImage) => {
    if (draggingId === img.id) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingId(null);
      dragStartRef.current = null;
    }
  };

  // Resize handle pointer handlers
  const handleResizePointerDown = (e: React.PointerEvent, img: AttachedImage) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    resizeStartRef.current = {
      startX: e.clientX,
      startWidthPercent: img.widthPercent || 40,
      containerWidth: rect.width,
    };
    setResizingId(img.id);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleResizePointerMove = (e: React.PointerEvent, img: AttachedImage) => {
    if (resizingId !== img.id || !resizeStartRef.current) return;
    const { startX, startWidthPercent, containerWidth } = resizeStartRef.current;
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / containerWidth) * 100;

    const newWidth = Math.max(15, Math.min(95, Math.round(startWidthPercent + deltaPercent)));
    onUpdateImage(img.id, { widthPercent: newWidth });
  };

  const handleResizePointerUp = (e: React.PointerEvent, img: AttachedImage) => {
    if (resizingId === img.id) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setResizingId(null);
      resizeStartRef.current = null;
    }
  };

  // Nudge position helper
  const handleNudge = (img: AttachedImage, deltaX: number, deltaY: number) => {
    const curLeft = img.leftPercent ?? 20;
    const curTop = img.topPercent ?? 20;
    const newLeft = Math.max(0, Math.min(curLeft + deltaX, 90));
    const newTop = Math.max(0, Math.min(curTop + deltaY, 90));
    onUpdateImage(img.id, { leftPercent: newLeft, topPercent: newTop });
  };

  // Quick position presets
  const handlePresetPosition = (img: AttachedImage, preset: 'tl' | 'tc' | 'tr' | 'c' | 'bl' | 'br') => {
    const w = img.widthPercent || 40;
    switch (preset) {
      case 'tl':
        onUpdateImage(img.id, { topPercent: 6, leftPercent: 5 });
        break;
      case 'tc':
        onUpdateImage(img.id, { topPercent: 6, leftPercent: Math.max(0, Math.round((100 - w) / 2)) });
        break;
      case 'tr':
        onUpdateImage(img.id, { topPercent: 6, leftPercent: Math.max(0, 95 - w) });
        break;
      case 'c':
        onUpdateImage(img.id, { topPercent: 30, leftPercent: Math.max(0, Math.round((100 - w) / 2)) });
        break;
      case 'bl':
        onUpdateImage(img.id, { topPercent: 60, leftPercent: 5 });
        break;
      case 'br':
        onUpdateImage(img.id, { topPercent: 60, leftPercent: Math.max(0, 95 - w) });
        break;
    }
  };

  const behindImages = attachedImages.filter((img) => img.wrapMode === 'behind');
  const frontImages = attachedImages.filter((img) => img.wrapMode === 'front');
  const flowImages = attachedImages.filter(
    (img) => img.wrapMode === 'inline' || img.wrapMode === 'square-left' || img.wrapMode === 'square-right'
  );

  return (
    <div className="w-full space-y-4">
      {/* Document Page Canvas (Like Microsoft Word Sheet) */}
      <div
        ref={containerRef}
        className="relative mx-auto rounded-xl border border-stone-200/90 dark:border-stone-800 shadow-xl transition-all overflow-hidden min-h-[600px] select-text"
        style={getPageBackgroundStyle()}
        onClick={() => setSelectedImageId(null)}
      >
        {/* Document Header & Margins / Selection Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2.5 border-b border-black/5 dark:border-white/10 select-none text-[11px] text-stone-500 font-serif bg-stone-50/40 dark:bg-stone-900/30 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-stone-600 dark:text-stone-300">WithGod Word Canvas • 1.0" Margins</span>
            {attachedImages.length > 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40">
                {attachedImages.length} picture{attachedImages.length > 1 ? 's' : ''} attached (click to select & move)
              </span>
            )}
          </div>

          {/* Quick Picture Selector Chip List (Word Selection Pane) */}
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-stone-400">Pictures:</span>
              {attachedImages.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageId(img.id);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    selectedImageId === img.id
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  #{i + 1} {img.wrapMode}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1. Behind Text Images (Word Watermark / Underlay) - Freely Draggable Anywhere */}
        {behindImages.map((img) => {
          const isSelected = selectedImageId === img.id;
          const isDragging = draggingId === img.id;
          const left = img.leftPercent ?? 20;
          const top = img.topPercent ?? 20;

          return (
            <div
              key={img.id}
              onPointerDown={(e) => handlePointerDown(e, img)}
              onPointerMove={(e) => handlePointerMove(e, img)}
              onPointerUp={(e) => handlePointerUp(e, img)}
              style={{
                position: 'absolute',
                top: `${top}%`,
                left: `${left}%`,
                width: `${img.widthPercent}%`,
                zIndex: isSelected ? 30 : 2, // Elevate when selected so it can be moved freely
                opacity: isSelected ? 0.9 : 0.65,
                touchAction: 'none',
              }}
              className={`group transition-shadow cursor-grab active:cursor-grabbing select-none ${
                isSelected ? 'ring-2 ring-amber-500 rounded-lg shadow-2xl p-1 bg-white/10 backdrop-blur-xs' : ''
              } ${isDragging ? 'opacity-90 ring-2 ring-amber-600 shadow-2xl scale-[1.01]' : ''}`}
            >
              {/* Drag Handle & Label Pill (Always visible on top) */}
              <div
                className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-t-md text-[10px] font-semibold tracking-wide transition-all shadow-md z-40 ${
                  isSelected
                    ? 'bg-amber-500 text-white opacity-100'
                    : 'bg-amber-600/90 text-white opacity-70 group-hover:opacity-100'
                }`}
              >
                <Move className="w-3 h-3 animate-pulse" />
                <span>Drag to Move Anywhere</span>
                <span className="text-[9px] opacity-80 font-normal">
                  ({left}%, {top}%)
                </span>
              </div>

              <img
                src={img.url}
                alt="Behind text picture"
                draggable={false}
                className="w-full h-auto rounded-lg shadow-sm pointer-events-none block"
              />

              {/* Floating Word Control Bar */}
              {isSelected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="no-drag absolute -bottom-16 left-0 bg-stone-900/95 text-white rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 shadow-2xl text-[10px] z-50 border border-stone-700 min-w-[320px]"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-amber-400">Wrap:</span>
                    {(['behind', 'front', 'square-left', 'square-right', 'inline'] as ImageWrapMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateImage(img.id, { wrapMode: mode })}
                        className={`px-1.5 py-0.5 rounded hover:bg-stone-700 capitalize ${
                          img.wrapMode === mode ? 'bg-amber-500 text-white font-bold' : 'text-stone-300'
                        }`}
                      >
                        {mode.replace('-', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="h-4 w-px bg-stone-700" />

                  {/* Nudge Position Buttons */}
                  <div className="flex items-center gap-0.5">
                    <span className="font-bold text-amber-400 mr-1">Move:</span>
                    <button
                      type="button"
                      onClick={() => handleNudge(img, -4, 0)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(img, 4, 0)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(img, 0, -4)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(img, 0, 4)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="h-4 w-px bg-stone-700" />

                  {/* Presets */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePresetPosition(img, 'tc')}
                      className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      Top
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetPosition(img, 'c')}
                      className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetPosition(img, 'br')}
                      className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      Bottom
                    </button>
                  </div>

                  <div className="h-4 w-px bg-stone-700" />

                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 ml-auto"
                    title="Remove Picture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Resize Handle (Bottom-Right Corner) */}
              {isSelected && (
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, img)}
                  onPointerMove={(e) => handleResizePointerMove(e, img)}
                  onPointerUp={(e) => handleResizePointerUp(e, img)}
                  style={{ touchAction: 'none' }}
                  className="no-drag absolute -bottom-2 -right-2 w-5 h-5 bg-amber-500 rounded-full border-2 border-white shadow-md cursor-se-resize z-40 flex items-center justify-center hover:scale-125 transition-transform"
                  title="Drag to resize width"
                >
                  <Maximize2 className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* 2. Flow & Square Wrap Images Container */}
        {flowImages.length > 0 && (
          <div className="px-8 pt-4">
            {flowImages.map((img) => {
              const isSelected = selectedImageId === img.id;
              const floatClass =
                img.wrapMode === 'square-left'
                  ? 'float-left mr-5 mb-4'
                  : img.wrapMode === 'square-right'
                  ? 'float-right ml-5 mb-4'
                  : 'my-4 block mx-auto clear-both';

              return (
                <div
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageId(img.id);
                  }}
                  style={{ width: `${img.widthPercent}%` }}
                  className={`relative group ${floatClass} ${
                    isSelected ? 'ring-2 ring-amber-500 rounded-xl p-1' : ''
                  }`}
                >
                  {/* Top Move / Convert to Free Float button */}
                  <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1 font-sans">
                    <span className="font-semibold text-stone-500">
                      {img.wrapMode === 'square-left' && 'Square (Left Wrapped)'}
                      {img.wrapMode === 'square-right' && 'Square (Right Wrapped)'}
                      {img.wrapMode === 'inline' && 'In Line with Text'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateImage(img.id, {
                          wrapMode: 'front',
                          topPercent: 25,
                          leftPercent: 30,
                        })
                      }
                      className="flex items-center gap-1 text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded font-bold transition-colors"
                      title="Convert to freely movable floating picture"
                    >
                      <Move className="w-3 h-3" />
                      Move Anywhere
                    </button>
                  </div>

                  <img
                    src={img.url}
                    alt="Attached picture"
                    className="w-full h-auto rounded-xl shadow-md cursor-pointer"
                  />

                  {/* Floating Image Control Bar */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-11 left-0 bg-stone-900 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-xl text-[10px] z-30 flex-wrap"
                    >
                      <span className="font-bold text-amber-400">Wrap:</span>
                      {(['inline', 'square-left', 'square-right', 'behind', 'front'] as ImageWrapMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => onUpdateImage(img.id, { wrapMode: mode })}
                          className={`px-1.5 py-0.5 rounded hover:bg-stone-700 capitalize ${
                            img.wrapMode === mode ? 'bg-amber-500 text-white font-bold' : ''
                          }`}
                        >
                          {mode.replace('-', ' ')}
                        </button>
                      ))}
                      <div className="h-3 w-px bg-stone-700" />
                      <span className="font-bold text-amber-400">Width:</span>
                      {[25, 40, 50, 75, 100].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => onUpdateImage(img.id, { widthPercent: w })}
                          className={`px-1.5 py-0.5 rounded ${img.widthPercent === w ? 'bg-stone-700 font-bold' : ''}`}
                        >
                          {w}%
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => onRemoveImage(img.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 ml-1"
                        title="Remove Picture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 3. The Core Rich Text ContentEditable Surface */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="relative z-10 px-8 sm:px-12 py-6 min-h-[460px] focus:outline-none text-stone-900 dark:text-stone-100 font-serif leading-relaxed text-base transition-colors"
          style={{
            wordBreak: 'break-word',
          }}
          data-placeholder="Start typing your devotion... Highlight any word to format it with bold, colors, sizes, and styles just like in Microsoft Word."
        />

        {/* 4. In Front of Text Images (Floating Overlays) - Freely Draggable Anywhere */}
        {frontImages.map((img) => {
          const isSelected = selectedImageId === img.id;
          const isDragging = draggingId === img.id;
          const left = img.leftPercent ?? 25;
          const top = img.topPercent ?? 25;

          return (
            <div
              key={img.id}
              onPointerDown={(e) => handlePointerDown(e, img)}
              onPointerMove={(e) => handlePointerMove(e, img)}
              onPointerUp={(e) => handlePointerUp(e, img)}
              style={{
                position: 'absolute',
                top: `${top}%`,
                left: `${left}%`,
                width: `${img.widthPercent}%`,
                zIndex: isSelected ? 45 : 35,
                touchAction: 'none',
              }}
              className={`group transition-all cursor-grab active:cursor-grabbing select-none ${
                isSelected ? 'ring-2 ring-amber-500 rounded-lg shadow-2xl p-1 bg-white/20 backdrop-blur-xs' : ''
              } ${isDragging ? 'opacity-90 ring-2 ring-amber-600 shadow-2xl scale-[1.01]' : ''}`}
            >
              {/* Drag Handle & Label Pill */}
              <div
                className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-t-md text-[10px] font-semibold tracking-wide transition-all shadow-md z-40 ${
                  isSelected
                    ? 'bg-indigo-600 text-white opacity-100'
                    : 'bg-indigo-700/90 text-white opacity-80 group-hover:opacity-100'
                }`}
              >
                <Move className="w-3 h-3 animate-pulse" />
                <span>Drag to Move Anywhere</span>
                <span className="text-[9px] opacity-80 font-normal">
                  ({left}%, {top}%)
                </span>
              </div>

              <img
                src={img.url}
                alt="Floating front picture"
                draggable={false}
                className="w-full h-auto rounded-lg shadow-2xl border-2 border-white/80 block pointer-events-none"
              />

              {/* Floating Word Control Bar */}
              {isSelected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="no-drag absolute -bottom-16 left-0 bg-stone-900/95 text-white rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 shadow-2xl text-[10px] z-50 border border-stone-700 min-w-[320px]"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-amber-400">Wrap:</span>
                    {(['front', 'behind', 'square-left', 'square-right', 'inline'] as ImageWrapMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateImage(img.id, { wrapMode: mode })}
                        className={`px-1.5 py-0.5 rounded hover:bg-stone-700 capitalize ${
                          img.wrapMode === mode ? 'bg-amber-500 text-white font-bold' : 'text-stone-300'
                        }`}
                      >
                        {mode.replace('-', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="h-4 w-px bg-stone-700" />

                  {/* Nudge Position Buttons */}
                  <div className="flex items-center gap-0.5">
                    <span className="font-bold text-amber-400 mr-1">Move:</span>
                    <button
                      type="button"
                      onClick={() => handleNudge(img, -4, 0)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(img, 4, 0)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(img, 0, -4)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(img, 0, 4)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="h-4 w-px bg-stone-700" />

                  {/* Presets */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePresetPosition(img, 'tc')}
                      className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      Top
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetPosition(img, 'c')}
                      className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetPosition(img, 'br')}
                      className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      Bottom
                    </button>
                  </div>

                  <div className="h-4 w-px bg-stone-700" />

                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 ml-auto"
                    title="Remove Picture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Resize Handle (Bottom-Right Corner) */}
              {isSelected && (
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, img)}
                  onPointerMove={(e) => handleResizePointerMove(e, img)}
                  onPointerUp={(e) => handleResizePointerUp(e, img)}
                  style={{ touchAction: 'none' }}
                  className="no-drag absolute -bottom-2 -right-2 w-5 h-5 bg-amber-500 rounded-full border-2 border-white shadow-md cursor-se-resize z-40 flex items-center justify-center hover:scale-125 transition-transform"
                  title="Drag to resize width"
                >
                  <Maximize2 className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* Footer Page Number Indicator */}
        <div className="px-8 py-3 text-center border-t border-black/5 dark:border-white/10 text-[11px] text-stone-400 font-serif select-none bg-stone-50/20 dark:bg-stone-900/20">
          Page 1
        </div>
      </div>
    </div>
  );
};
