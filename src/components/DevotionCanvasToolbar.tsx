import React, { useRef, useState } from 'react';
import {
  Palette,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Modal } from './Modal';

export interface CanvasSettings {
  backgroundType:
    | 'default'
    | 'lined'
    | 'dots'
    | 'parchment'
    | 'botanical'
    | 'midnight'
    | 'blush'
    | 'kraft'
    | 'linen'
    | 'custom';
  customBgUrl?: string;
  bgOpacity: number;
  fontFamily: 'serif' | 'handwritten' | 'kalam' | 'playfair' | 'lora' | 'typewriter' | 'sans';
  fontSize: number;
  fontColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
}

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  backgroundType: 'lined',
  customBgUrl: '',
  bgOpacity: 0.9,
  fontFamily: 'handwritten',
  fontSize: 16,
  fontColor: '#1C1917',
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
};

export const PRESET_BACKGROUNDS: {
  id: CanvasSettings['backgroundType'];
  name: string;
  previewClass: string;
  badge: string;
}[] = [
  { id: 'lined', name: 'Classic Lined', previewClass: 'canvas-pattern-lined border-amber-200', badge: '📝 Ruled' },
  { id: 'dots', name: 'Dot Grid', previewClass: 'canvas-pattern-dots border-stone-300', badge: '📐 Bullet' },
  { id: 'parchment', name: 'Parchment', previewClass: 'canvas-pattern-parchment border-amber-300', badge: '📜 Vintage' },
  { id: 'botanical', name: 'Botanical', previewClass: 'canvas-pattern-botanical border-emerald-300', badge: '🌿 Floral' },
  { id: 'midnight', name: 'Midnight Grace', previewClass: 'canvas-pattern-midnight border-indigo-500 text-white', badge: '🌌 Cosmic' },
  { id: 'blush', name: 'Blush Rose', previewClass: 'canvas-pattern-blush border-rose-300', badge: '🌸 Watercolor' },
  { id: 'kraft', name: 'Kraft Paper', previewClass: 'canvas-pattern-kraft border-amber-400', badge: '☕ Rustic' },
  { id: 'linen', name: 'Linen Cloth', previewClass: 'canvas-pattern-linen border-stone-300', badge: '🕊️ Woven' },
  { id: 'default', name: 'Clean White', previewClass: 'bg-white border-stone-200', badge: '⚪ Minimal' },
];

export const FONT_OPTIONS: {
  id: CanvasSettings['fontFamily'];
  name: string;
  className: string;
  category: string;
}[] = [
  { id: 'handwritten', name: 'Caveat (Handwritten)', className: 'font-handwritten text-lg', category: 'Journal' },
  { id: 'kalam', name: 'Kalam (Casual Pen)', className: 'font-kalam text-base', category: 'Script' },
  { id: 'playfair', name: 'Playfair Display (Serif)', className: 'font-playfair text-base', category: 'Biblical' },
  { id: 'lora', name: 'Lora (Classic Book)', className: 'font-lora text-base', category: 'Serif' },
  { id: 'typewriter', name: 'Courier (Typewriter)', className: 'font-typewriter text-sm', category: 'Vintage' },
  { id: 'sans', name: 'Inter (Clean Sans)', className: 'font-sans text-sm', category: 'Modern' },
];

const COLOR_SWATCHES = [
  { hex: '#1C1917', name: 'Charcoal Ink' },
  { hex: '#1E3A8A', name: 'Midnight Navy' },
  { hex: '#78350F', name: 'Walnut Sepia' },
  { hex: '#14532D', name: 'Forest Pine' },
  { hex: '#9F1239', name: 'Crimson Wine' },
  { hex: '#581C87', name: 'Royal Violet' },
  { hex: '#B45309', name: 'Golden Amber' },
  { hex: '#FFFFFF', name: 'Snow White' },
];

const FONT_SIZES = [
  { label: 'S (13px)', value: 13 },
  { label: 'M (16px)', value: 16 },
  { label: 'L (19px)', value: 19 },
  { label: 'XL (23px)', value: 23 },
  { label: 'XXL (28px)', value: 28 },
];

interface DevotionCanvasToolbarProps {
  settings: CanvasSettings;
  onChange: (settings: CanvasSettings) => void;
}

export const DevotionCanvasToolbar: React.FC<DevotionCanvasToolbarProps> = ({
  settings,
  onChange,
}) => {
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const update = (partial: Partial<CanvasSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Please upload an image smaller than 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        update({
          backgroundType: 'custom',
          customBgUrl: result,
          bgOpacity: 0.85,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-stone-900/80 p-3 backdrop-blur-md shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Background & Canvas Mode Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBgModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-stone-700 transition-all shadow-2xs hover:scale-102"
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Canvas Design</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 font-medium">
                {settings.backgroundType === 'custom'
                  ? 'Custom Image'
                  : PRESET_BACKGROUNDS.find((b) => b.id === settings.backgroundType)?.name || 'Default'}
              </span>
            </button>

            {/* Quick Upload from Device Shortcut */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 bg-white/80 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors"
              title="Upload custom background from device"
            >
              <Upload className="w-3 h-3 text-stone-500" />
              <span className="hidden sm:inline">Upload Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Quick Reset Style Button */}
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CANVAS_SETTINGS)}
            className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            title="Reset to default notebook"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset Design</span>
          </button>
        </div>

        {/* Typography Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-stone-800 text-xs">
          {/* Font Family Picker */}
          <div className="flex items-center gap-1 bg-white dark:bg-stone-800 px-2 py-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <Type className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={settings.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value as CanvasSettings['fontFamily'] })}
              className="bg-transparent font-medium text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer pr-1"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id} className="text-stone-900 bg-white dark:bg-stone-900">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-stone-800 px-2 py-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-[11px] text-stone-400 font-semibold">Size:</span>
            <select
              value={settings.fontSize}
              onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) })}
              className="bg-transparent font-medium text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
            >
              {FONT_SIZES.map((s) => (
                <option key={s.value} value={s.value} className="text-stone-900 bg-white dark:bg-stone-900">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bold, Italic, Underline Toggles */}
          <div className="flex items-center bg-white dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => update({ bold: !settings.bold })}
              className={`p-1.5 rounded-lg transition-colors ${
                settings.bold
                  ? 'bg-amber-500 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update({ italic: !settings.italic })}
              className={`p-1.5 rounded-lg transition-colors ${
                settings.italic
                  ? 'bg-amber-500 text-white italic font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update({ underline: !settings.underline })}
              className={`p-1.5 rounded-lg transition-colors ${
                settings.underline
                  ? 'bg-amber-500 text-white underline font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment Toggles */}
          <div className="flex items-center bg-white dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => update({ align: 'left' })}
              className={`p-1.5 rounded-lg transition-colors ${
                settings.align === 'left'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update({ align: 'center' })}
              className={`p-1.5 rounded-lg transition-colors ${
                settings.align === 'center'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update({ align: 'right' })}
              className={`p-1.5 rounded-lg transition-colors ${
                settings.align === 'right'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Color Palette Swatches */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 px-2 py-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-[11px] text-stone-400 font-semibold mr-0.5">Color:</span>
            <div className="flex items-center gap-1">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => update({ fontColor: c.hex })}
                  style={{ backgroundColor: c.hex }}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    settings.fontColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-amber-500 ring-offset-1 scale-115 border-white'
                      : 'border-stone-300 dark:border-stone-600 opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}

              {/* Custom Color Input */}
              <label
                className="relative cursor-pointer w-4 h-4 rounded-full border border-dashed border-stone-400 flex items-center justify-center hover:scale-110 transition-transform overflow-hidden"
                title="Custom Color"
              >
                <input
                  type="color"
                  value={settings.fontColor}
                  onChange={(e) => update({ fontColor: e.target.value })}
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                />
                <span className="text-[9px] font-bold text-stone-500">+</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Background Selection & Upload Modal */}
      <Modal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        title="Customize Notebook Background"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Preset Backgrounds Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                Select Journal Stationery
              </label>
              <span className="text-[11px] text-stone-400">8 Curated Notebook Styles</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_BACKGROUNDS.map((preset) => {
                const isSelected =
                  settings.backgroundType === preset.id && !settings.customBgUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      update({
                        backgroundType: preset.id,
                        customBgUrl: '',
                      });
                    }}
                    className={`relative p-3 rounded-2xl border-2 text-left transition-all overflow-hidden flex flex-col justify-between h-24 ${
                      preset.previewClass
                    } ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/30 scale-102 shadow-md'
                        : 'border-stone-200 dark:border-stone-700/80 hover:border-amber-400 opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-900/10 dark:bg-white/10 backdrop-blur-xs">
                        {preset.badge}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-stone-800 dark:text-stone-100 block">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload from Device Section */}
          <div className="rounded-2xl border-2 border-dashed border-amber-400/50 bg-amber-50/30 dark:bg-stone-900/60 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Upload from Device
                  </h4>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Select any photo, textured wallpaper, or floral illustration from your phone or computer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Browse Files</span>
              </button>
            </div>

            {settings.backgroundType === 'custom' && settings.customBgUrl && (
              <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg bg-cover bg-center border border-stone-300 dark:border-stone-600 shrink-0"
                    style={{ backgroundImage: `url(${settings.customBgUrl})` }}
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                      Custom Canvas Background Active
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Image loaded successfully
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    update({
                      backgroundType: 'lined',
                      customBgUrl: '',
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
            >
              Done & Apply Canvas
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
