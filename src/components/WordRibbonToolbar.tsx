import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Type,
  Image as ImageIcon,
  Palette,
  Upload,
  BookOpen,
  Highlighter,
  RotateCcw,
  Sparkles,
  Layers,
  Move,
} from 'lucide-react';
import { Modal } from './Modal';

export type ImageWrapMode = 'inline' | 'behind' | 'front' | 'square-left' | 'square-right';

export interface AttachedImage {
  id: string;
  url: string;
  wrapMode: ImageWrapMode;
  widthPercent: number; // 25, 50, 75, 100
  caption?: string;
  topPercent?: number; // For floating behind / front
  leftPercent?: number;
}

export interface CanvasPageSettings {
  backgroundType: 'white' | 'cream' | 'parchment' | 'midnight' | 'slate' | 'custom';
  customBgUrl?: string;
  bgOpacity: number; // 0.1 to 1.0
}

interface WordRibbonToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onInsertImage: (image: AttachedImage) => void;
  onOpenBiblePicker: () => void;
  pageSettings: CanvasPageSettings;
  onPageSettingsChange: (settings: CanvasPageSettings) => void;
}

const FONT_FAMILIES = [
  { label: 'Calibri / Inter', value: 'Inter, sans-serif' },
  { label: 'Times New Roman / Playfair', value: "'Playfair Display', Georgia, serif" },
  { label: 'Georgia (Classic Serif)', value: 'Georgia, serif' },
  { label: 'Caveat (Handwritten)', value: "'Caveat', cursive, sans-serif" },
  { label: 'Kalam (Journal Script)', value: "'Kalam', cursive, sans-serif" },
  { label: 'Courier Prime (Typewriter)', value: "'Courier Prime', monospace" },
  { label: 'Arial / System Sans', value: 'Arial, sans-serif' },
];

const FONT_SIZES = [
  { label: '11pt', value: '1' },
  { label: '13pt', value: '2' },
  { label: '16pt', value: '3' },
  { label: '18pt', value: '4' },
  { label: '24pt', value: '5' },
  { label: '32pt', value: '6' },
  { label: '40pt', value: '7' },
];

const TEXT_COLORS = [
  { hex: '#1C1917', name: 'Automatic (Black)' },
  { hex: '#1E3A8A', name: 'Dark Navy' },
  { hex: '#78350F', name: 'Warm Walnut' },
  { hex: '#14532D', name: 'Forest Green' },
  { hex: '#9F1239', name: 'Crimson Red' },
  { hex: '#581C87', name: 'Royal Purple' },
  { hex: '#B45309', name: 'Golden Amber' },
  { hex: '#4B5563', name: 'Slate Gray' },
];

const HIGHLIGHT_COLORS = [
  { hex: 'transparent', name: 'No Color' },
  { hex: '#FEF08A', name: 'Yellow' },
  { hex: '#BBF7D0', name: 'Green' },
  { hex: '#BAE6FD', name: 'Cyan' },
  { hex: '#FBCFE8', name: 'Pink' },
  { hex: '#FED7AA', name: 'Orange' },
];

export const WordRibbonToolbar: React.FC<WordRibbonToolbarProps> = ({
  onFormat,
  onInsertImage,
  onOpenBiblePicker,
  pageSettings,
  onPageSettingsChange,
}) => {
  // Image insertion modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedWrapMode, setSelectedWrapMode] = useState<ImageWrapMode>('behind');
  const [selectedWidthPercent, setSelectedWidthPercent] = useState<number>(50);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Background customization modal state
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeviceBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        onPageSettingsChange({
          backgroundType: 'custom',
          customBgUrl: dataUrl,
          bgOpacity: 0.85,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmInsertImage = () => {
    if (!imageUrl.trim()) {
      alert('Please enter an image URL or upload an image file.');
      return;
    }

    onInsertImage({
      id: `img_${Date.now()}`,
      url: imageUrl.trim(),
      wrapMode: selectedWrapMode,
      widthPercent: selectedWidthPercent,
      topPercent: selectedWrapMode === 'behind' || selectedWrapMode === 'front' ? 15 : undefined,
      leftPercent: selectedWrapMode === 'behind' || selectedWrapMode === 'front' ? 25 : undefined,
    });

    setImageUrl('');
    setIsImageModalOpen(false);
  };

  return (
    <>
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-xs p-2.5 space-y-2">
        {/* Ribbon Upper Row: Font Controls & Styles */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-stone-100 dark:border-stone-800/80">
          {/* Font Family Dropdown */}
          <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
            <Type className="w-3.5 h-3.5 text-stone-400" />
            <select
              defaultValue="'Playfair Display', Georgia, serif"
              onChange={(e) => onFormat('fontName', e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer pr-1 max-w-[140px] truncate"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.label} value={f.value} className="text-stone-900 bg-white dark:bg-stone-900">
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Dropdown */}
          <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
            <span className="text-[11px] text-stone-400 font-bold">Size</span>
            <select
              defaultValue="3"
              onChange={(e) => onFormat('fontSize', e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
            >
              {FONT_SIZES.map((s) => (
                <option key={s.value} value={s.value} className="text-stone-900 bg-white dark:bg-stone-900">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 mx-1 hidden sm:block" />

          {/* Bold, Italic, Underline, Strikethrough */}
          <div className="flex items-center bg-stone-50 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onFormat('bold');
              }}
              className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onFormat('italic');
              }}
              className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 italic"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onFormat('underline');
              }}
              className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 underline"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onFormat('strikeThrough');
              }}
              className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Color Picker */}
          <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
            <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 border-b-2 border-amber-500">
              A
            </span>
            <div className="flex items-center gap-0.5">
              {TEXT_COLORS.slice(0, 5).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onFormat('foreColor', c.hex);
                  }}
                  style={{ backgroundColor: c.hex }}
                  className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-stone-600 hover:scale-120 transition-transform"
                  title={c.name}
                />
              ))}
              <label
                className="relative cursor-pointer w-3.5 h-3.5 rounded-full border border-dashed border-stone-400 flex items-center justify-center hover:scale-120 transition-transform overflow-hidden"
                title="Custom Color"
              >
                <input
                  type="color"
                  onChange={(e) => onFormat('foreColor', e.target.value)}
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                />
                <span className="text-[8px] font-bold text-stone-500">+</span>
              </label>
            </div>
          </div>

          {/* Text Highlighter */}
          <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <div className="flex items-center gap-0.5">
              {HIGHLIGHT_COLORS.map((h) => (
                <button
                  key={h.hex}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onFormat('hiliteColor', h.hex);
                  }}
                  style={{ backgroundColor: h.hex === 'transparent' ? '#E5E7EB' : h.hex }}
                  className="w-3.5 h-3.5 rounded border border-stone-300 dark:border-stone-600 hover:scale-120 transition-transform"
                  title={h.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Ribbon Lower Row: Paragraph, Alignment, Insert Tools, Page Canvas */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Paragraph Alignment & Lists */}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-stone-50 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onFormat('justifyLeft');
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onFormat('justifyCenter');
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onFormat('justifyRight');
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onFormat('justifyFull');
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                title="Justify"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center bg-stone-50 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onFormat('insertUnorderedList');
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                title="Bulleted List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onFormat('insertOrderedList');
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                title="Numbered List"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Insert Picture with MS Word Text Wrapping & Insert Tools */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Insert Picture Button */}
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>Attach Image (Word Layout)</span>
            </button>

            {/* Insert Bible Passage Button */}
            <button
              type="button"
              onClick={onOpenBiblePicker}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Insert Scripture</span>
            </button>

            {/* Canvas Page Background Settings */}
            <button
              type="button"
              onClick={() => setIsBgModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 transition-colors"
              title="Change Document Canvas Background"
            >
              <Palette className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden md:inline">Page Color / Background</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attach Image & Text Wrapping Modal (Microsoft Word Style) */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title="Insert Picture & Text Wrapping"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* Source Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              1. Choose Picture (Device or Web URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste image web URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Device File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDeviceImageUpload}
              />
            </div>
            {imageUrl ? (
              <div className="h-32 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-stone-100 dark:bg-stone-900 flex items-center justify-center">
                <img src={imageUrl} alt="Preview" className="h-full object-contain" />
              </div>
            ) : null}
          </div>

          {/* Microsoft Word Text Wrapping Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              2. Text Wrapping & Positioning (Like Microsoft Word)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'behind',
                  title: '🔙 Behind Text',
                  desc: 'Watermark under text; words float directly over the picture',
                },
                {
                  id: 'front',
                  title: '🔝 In Front of Text',
                  desc: 'Floating picture overlay on top of words',
                },
                {
                  id: 'square-left',
                  title: '⬅️ Square (Left)',
                  desc: 'Text wraps smoothly along right side',
                },
                {
                  id: 'square-right',
                  title: '➡️ Square (Right)',
                  desc: 'Text wraps smoothly along left side',
                },
                {
                  id: 'inline',
                  title: '📄 In Line with Text',
                  desc: 'Standard paragraph inline break',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedWrapMode(opt.id as ImageWrapMode)}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                    selectedWrapMode === opt.id
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
                      : 'border-stone-200 dark:border-stone-800 hover:border-amber-400'
                  }`}
                >
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                    {opt.title}
                  </span>
                  <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sizing options */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              3. Initial Size
            </label>
            <div className="flex gap-2">
              {[
                { label: 'Small (25%)', val: 25 },
                { label: 'Medium (50%)', val: 50 },
                { label: 'Large (75%)', val: 75 },
                { label: 'Full Width (100%)', val: 100 },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setSelectedWidthPercent(s.val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                    selectedWidthPercent === s.val
                      ? 'bg-amber-500 text-white font-bold border-amber-500'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmInsertImage}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
            >
              Attach Picture to Canvas
            </button>
          </div>
        </div>
      </Modal>

      {/* Page Canvas Background Selection Modal */}
      <Modal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        title="Document Canvas Background"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
              Page Tone / Color
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'white', name: 'Standard White', preview: 'bg-white border-stone-200' },
                { id: 'cream', name: 'Warm Cream Page', preview: 'bg-[#FCFBF7] border-amber-200' },
                { id: 'parchment', name: 'Vintage Parchment', preview: 'bg-[#F6F0E2] border-amber-300' },
                { id: 'slate', name: 'Modern Studio Slate', preview: 'bg-[#F3F4F6] border-stone-300' },
                { id: 'midnight', name: 'Midnight Dark Page', preview: 'bg-[#0F172A] border-indigo-900 text-white' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    onPageSettingsChange({
                      backgroundType: p.id as CanvasPageSettings['backgroundType'],
                      customBgUrl: '',
                      bgOpacity: 1,
                    })
                  }
                  className={`p-3 rounded-xl border-2 text-left transition-all ${p.preview} ${
                    pageSettings.backgroundType === p.id && !pageSettings.customBgUrl
                      ? 'ring-2 ring-amber-500 border-amber-500'
                      : ''
                  }`}
                >
                  <span className="text-xs font-bold block">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-stone-700 bg-amber-50/30 dark:bg-stone-900 space-y-2">
            <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              Upload Custom Page Watermark / Wallpaper
            </h5>
            <p className="text-[11px] text-stone-500">
              Set any photo or pattern from your computer as the document canvas background.
            </p>
            <button
              type="button"
              onClick={() => bgFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Computer Photo</span>
            </button>
            <input
              ref={bgFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDeviceBgUpload}
            />

            {pageSettings.backgroundType === 'custom' && pageSettings.customBgUrl && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Custom Page Image Active
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onPageSettingsChange({
                      backgroundType: 'white',
                      customBgUrl: '',
                      bgOpacity: 1,
                    })
                  }
                  className="text-xs text-rose-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsBgModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white"
            >
              Apply to Document
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
