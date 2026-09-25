import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Plus,
  Search,
  BookOpen,
  Image as ImageIcon,
  Trash2,
  Calendar,
  Sparkles,
  Edit2,
  FileText,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  WordRibbonToolbar,
  AttachedImage,
  CanvasPageSettings,
} from '../components/WordRibbonToolbar';
import { RichWordCanvas } from '../components/RichWordCanvas';

export default function DevotionsPage() {
  const router = useRouter();
  const { user } = useApp();

  const [devotions, setDevotions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeDevotionId, setActiveDevotionId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [coverImage, setCoverImage] = useState('');
  const [documentHtml, setDocumentHtml] = useState('<p>Write your devotion, prayer, and scripture meditation here...</p>');
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [pageSettings, setPageSettings] = useState<CanvasPageSettings>({
    backgroundType: 'white',
    customBgUrl: '',
    bgOpacity: 1,
  });
  const [isSaving, setIsSaving] = useState(false);

  // ContentEditable Editor Reference
  const editorRef = useRef<HTMLDivElement>(null);

  // Floating Bible Picker Modal State
  const [isBiblePickerOpen, setIsBiblePickerOpen] = useState(false);
  const [pickerBook, setPickerBook] = useState('John');
  const [pickerChapter, setPickerChapter] = useState(6);
  const [pickerVerseStart, setPickerVerseStart] = useState(27);
  const [pickerVerseEnd, setPickerVerseEnd] = useState(29);
  const [pickerVersion, setPickerVersion] = useState('KJV');

  const fetchDevotions = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.getDevotions(searchTerm);
      setDevotions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevotions();
  }, [user, searchTerm, router.asPath]);

  // Handle query params (e.g. from Verse of the Day or Bible Reader "Add to Devotion")
  useEffect(() => {
    if (router.query.insert_verse === 'true') {
      const b = (router.query.book as string) || 'John';
      const c = parseInt((router.query.chapter as string) || '6', 10);
      const vs = parseInt((router.query.verse_start as string) || '1', 10);
      const ve = parseInt((router.query.verse_end as string) || '1', 10);
      const ver = (router.query.version as string) || 'KJV';
      const text = (router.query.text as string) || '';

      setTitle(`Reflections on ${b} ${c}:${vs}${ve !== vs ? `-${ve}` : ''}`);
      setDate(new Date().toISOString().split('T')[0]);
      setCoverImage('');
      setActiveDevotionId(null);
      setPageSettings({ backgroundType: 'white', customBgUrl: '', bgOpacity: 1 });
      setAttachedImages([]);

      const initialHtml = `
        <p>Today I was meditating on God’s Word and found this comforting truth:</p>
        <blockquote style="margin: 16px 0; padding: 12px 18px; border-left: 4px solid #F59E0B; background-color: rgba(245, 158, 11, 0.08); border-radius: 8px;">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #B45309; font-size: 14px;">
            📖 ${b} ${c}:${vs}${ve !== vs ? `-${ve}` : ''} (${ver})
          </p>
          <p style="margin: 0; font-style: italic; font-size: 16px; line-height: 1.6;">“${text}”</p>
        </blockquote>
        <p>This passage reminds me that...</p>
        <p><br></p>
        <p style="color: #047857; font-style: italic;"><strong>Prayer:</strong> Lord, thank You for Your unending love and grace. Guide my heart today.</p>
      `;

      setDocumentHtml(initialHtml);
      if (editorRef.current) {
        editorRef.current.innerHTML = initialHtml;
      }
      setIsEditorOpen(true);
    } else if (router.query.action === 'new') {
      handleOpenNew();
    }
  }, [router.query]);

  const handleOpenNew = () => {
    setActiveDevotionId(null);
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setCoverImage('');
    setPageSettings({ backgroundType: 'white', customBgUrl: '', bgOpacity: 1 });
    setAttachedImages([]);
    const defaultHtml = '<p>Write your personal reflections, insights, and prayers here...</p>';
    setDocumentHtml(defaultHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = defaultHtml;
    }
    setIsEditorOpen(true);
  };

  const handleOpenEdit = async (devotionId: string) => {
    try {
      const dev = await api.getDevotion(devotionId);
      setActiveDevotionId(dev.id);
      setTitle(dev.title);
      setDate(dev.date);
      setCoverImage(dev.cover_image || '');

      const firstBlock = dev.blocks?.[0];
      let htmlContent = '';
      if (firstBlock?.content) {
        htmlContent = firstBlock.content;
      } else if (dev.blocks && dev.blocks.length > 0) {
        htmlContent = dev.blocks.map((b: any) => `<p>${b.content}</p>`).join('');
      } else {
        htmlContent = '<p></p>';
      }

      setDocumentHtml(htmlContent);
      setAttachedImages(firstBlock?.metadata?.attachedImages || []);
      setPageSettings(
        firstBlock?.metadata?.pageSettings || {
          backgroundType: 'white',
          customBgUrl: '',
          bgOpacity: 1,
        }
      );

      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent;
      }
      setIsEditorOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (devotionId: string) => {
    if (!confirm('Are you sure you want to delete this devotion?')) return;
    try {
      await api.deleteDevotion(devotionId);
      setDevotions(devotions.filter((d) => d.id !== devotionId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    if (typeof document !== 'undefined') {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      if (editorRef.current) {
        setDocumentHtml(editorRef.current.innerHTML);
      }
    }
  };

  const handleInsertImage = (newImage: AttachedImage) => {
    setAttachedImages((prev) => [...prev, newImage]);
  };

  const handleUpdateImage = (imageId: string, partial: Partial<AttachedImage>) => {
    setAttachedImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, ...partial } : img))
    );
  };

  const handleRemoveImage = (imageId: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleInsertBiblePassage = async () => {
    try {
      const chapterData = await api.getBibleChapter(pickerVersion, pickerBook, pickerChapter);
      let text = `${pickerBook} ${pickerChapter}:${pickerVerseStart}-${pickerVerseEnd}`;
      if (chapterData && chapterData.verses) {
        const filtered = chapterData.verses.filter(
          (v: any) => v.verse_number >= pickerVerseStart && v.verse_number <= pickerVerseEnd
        );
        if (filtered.length > 0) {
          text = filtered.map((v: any) => `[${v.verse_number}] ${v.text}`).join(' ');
        }
      }

      const scriptureHtml = `
        <blockquote style="margin: 16px 0; padding: 12px 18px; border-left: 4px solid #F59E0B; background-color: rgba(245, 158, 11, 0.08); border-radius: 8px;">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #B45309; font-size: 13px;">
            📖 ${pickerBook} ${pickerChapter}:${pickerVerseStart}${pickerVerseEnd !== pickerVerseStart ? `-${pickerVerseEnd}` : ''} (${pickerVersion})
          </p>
          <p style="margin: 0; font-style: italic; font-size: 15px; line-height: 1.6;">“${text}”</p>
        </blockquote><p><br></p>
      `;

      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, scriptureHtml);
        setDocumentHtml(editorRef.current.innerHTML);
      }
      setIsBiblePickerOpen(false);
    } catch {
      const scriptureHtml = `
        <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #F59E0B; background-color: rgba(245, 158, 11, 0.08); border-radius: 8px;">
          <p style="margin: 0; font-weight: bold; color: #B45309;">📖 ${pickerBook} ${pickerChapter}:${pickerVerseStart}-${pickerVerseEnd}</p>
        </blockquote><p><br></p>
      `;
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, scriptureHtml);
        setDocumentHtml(editorRef.current.innerHTML);
      }
      setIsBiblePickerOpen(false);
    }
  };

  const handleSaveDevotion = async () => {
    if (!title.trim()) {
      alert('Please enter a devotion title.');
      return;
    }
    setIsSaving(true);
    try {
      const htmlToSave = editorRef.current ? editorRef.current.innerHTML : documentHtml;

      const payload = {
        title,
        date,
        cover_image: coverImage || null,
        tags: [
          `canvas_bg:${pageSettings.backgroundType}`,
          `images:${attachedImages.length}`,
          'word_canvas',
        ],
        blocks: [
          {
            type: 'text',
            position: 0,
            content: htmlToSave,
            metadata: {
              attachedImages,
              pageSettings,
            },
          },
        ],
      };

      if (activeDevotionId) {
        await api.updateDevotion(activeDevotionId, payload);
      } else {
        await api.createDevotion(payload);
      }
      setIsEditorOpen(false);
      fetchDevotions();
    } catch (err) {
      console.error(err);
      alert('Error saving devotion.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to extract clean plain-text snippet for cards
  const extractSnippet = (content?: string | null): string => {
    if (!content) return '';
    let text = content.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, '');
    text = text.replace(/<(br|\/p|\/div|\/h[1-6]|\/li|\/tr|\/td|\/blockquote)[^>]*>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return text.length > 140 ? `${text.slice(0, 140)}...` : text;
  };

  return (
    <>
      <PageLayout
        title="Devotions"
        items={[{ label: 'Devotions' }]}
        actions={
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors md:w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Document</span>
          </button>
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Search Bar - aligned left with md:w-96 according to design rules */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search your insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs"
            />
          </div>

          <div className="text-xs text-stone-400 font-medium">
            {devotions.length} {devotions.length === 1 ? 'document' : 'documents'} recorded
          </div>
        </div>

        {/* Devotions Grid / List */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-stone-400 animate-pulse">Loading documents...</div>
        ) : devotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {devotions.map((dev) => {
              const bgTag = dev.tags?.find((t: string) => t.startsWith('canvas_bg:'))?.replace('canvas_bg:', '') || 'white';
              const imgTag = dev.tags?.find((t: string) => t.startsWith('images:'))?.replace('images:', '');
              const snippetText = extractSnippet(dev.snippet || dev.blocks?.[0]?.content);

              return (
                <div
                  key={dev.id}
                  className="group relative rounded-3xl bg-white dark:bg-stone-900 p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {dev.date}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 capitalize flex items-center gap-1">
                          <FileText className="w-3 h-3 text-amber-500" />
                          <span>{bgTag === 'custom' ? 'Custom Wallpaper' : `${bgTag} Page`}</span>
                        </span>
                        {imgTag && parseInt(imgTag, 10) > 0 ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                            🖼️ {imgTag}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(dev.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                          title="Edit Document"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(dev.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3
                      onClick={() => handleOpenEdit(dev.id)}
                      className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {dev.title}
                    </h3>

                    {snippetText && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 font-serif leading-relaxed">
                        {snippetText}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 mt-4 flex items-center justify-between text-[11px] text-stone-400">
                    <span>Document View</span>
                    <button
                      onClick={() => handleOpenEdit(dev.id)}
                      className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Open Document →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Your document canvas is clean
              </h3>
              <p className="text-xs text-stone-500">
                Create an insight, style words freely, attach pictures with Word wrapping, and save.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create Word Document
            </button>
          </div>
        )}
      </div>

      {/* Microsoft Word Document Canvas Editor Modal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={activeDevotionId ? 'Edit Insight' : 'New Insight'}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          {/* Document Title & Date Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3.5 py-1.5 rounded-xl text-lg font-bold border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
            </div>
          </div>

          {/* Microsoft Word Ribbon Toolbar */}
          <WordRibbonToolbar
            onFormat={handleFormat}
            onInsertImage={handleInsertImage}
            onOpenBiblePicker={() => setIsBiblePickerOpen(true)}
            pageSettings={pageSettings}
            onPageSettingsChange={setPageSettings}
          />

          {/* Document Canvas Sheet (contentEditable with inline word styling & image wrapping) */}
          <RichWordCanvas
            initialHtml={documentHtml}
            onChange={setDocumentHtml}
            attachedImages={attachedImages}
            onUpdateImage={handleUpdateImage}
            onRemoveImage={handleRemoveImage}
            pageSettings={pageSettings}
            editorRef={editorRef}
          />

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveDevotion}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Devotion'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Floating Bible Passage Picker Modal */}
      <Modal
        isOpen={isBiblePickerOpen}
        onClose={() => setIsBiblePickerOpen(false)}
        title="Insert Scripture Passage (Into Word Canvas)"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-stone-500 block mb-1">Book Name</label>
            <input
              type="text"
              value={pickerBook}
              onChange={(e) => setPickerBook(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-stone-500 block mb-1">Chapter</label>
              <input
                type="number"
                min={1}
                value={pickerChapter}
                onChange={(e) => setPickerChapter(parseInt(e.target.value || '1', 10))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Start Verse</label>
              <input
                type="number"
                min={1}
                value={pickerVerseStart}
                onChange={(e) => setPickerVerseStart(parseInt(e.target.value || '1', 10))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">End Verse</label>
              <input
                type="number"
                min={1}
                value={pickerVerseEnd}
                onChange={(e) => setPickerVerseEnd(parseInt(e.target.value || '1', 10))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBiblePickerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertBiblePassage}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            >
              Insert Passage
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
