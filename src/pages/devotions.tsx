import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Plus,
  Search,
  BookOpen,
  Image as ImageIcon,
  Trash2,
  Calendar,
  Sparkles,
  MoveUp,
  MoveDown,
  Quote,
  Heart,
  Minus,
  Edit2,
  Eye,
  Check,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface DevotionBlockItem {
  id?: string;
  type: 'text' | 'heading' | 'bible' | 'image' | 'prayer' | 'quote' | 'divider';
  position: number;
  content: string;
  metadata?: any;
}

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
  const [blocks, setBlocks] = useState<DevotionBlockItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Floating Bible Picker Modal State
  const [isBiblePickerOpen, setIsBiblePickerOpen] = useState(false);
  const [pickerBook, setPickerBook] = useState('John');
  const [pickerChapter, setPickerChapter] = useState(6);
  const [pickerVerseStart, setPickerVerseStart] = useState(27);
  const [pickerVerseEnd, setPickerVerseEnd] = useState(29);
  const [pickerVersion, setPickerVersion] = useState('KJV');

  // Insert Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

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
      setBlocks([
        {
          type: 'text',
          position: 0,
          content: 'Today I was meditating on God’s Word and found this comforting truth:',
        },
        {
          type: 'bible',
          position: 1,
          content: text || `${b} ${c}:${vs}-${ve}`,
          metadata: { book: b, chapter: c, startVerse: vs, endVerse: ve, version: ver },
        },
        {
          type: 'text',
          position: 2,
          content: 'This passage reminds me that...',
        },
        {
          type: 'prayer',
          position: 3,
          content: 'Lord, thank You for Your unending love and grace. Guide my heart today.',
        },
      ]);
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
    setBlocks([
      {
        type: 'text',
        position: 0,
        content: '',
      },
    ]);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = async (devotionId: string) => {
    try {
      const dev = await api.getDevotion(devotionId);
      setActiveDevotionId(dev.id);
      setTitle(dev.title);
      setDate(dev.date);
      setCoverImage(dev.cover_image || '');
      setBlocks(
        dev.blocks && dev.blocks.length > 0
          ? dev.blocks
          : [{ type: 'text', position: 0, content: '' }]
      );
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

  const handleSaveDevotion = async () => {
    if (!title.trim()) {
      alert('Please enter a devotion title.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title,
        date,
        cover_image: coverImage || null,
        blocks: blocks.map((b, idx) => ({ ...b, position: idx })),
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

  // Block manipulation
  const updateBlockContent = (index: number, content: string) => {
    const updated = [...blocks];
    updated[index].content = content;
    setBlocks(updated);
  };

  const addBlock = (type: DevotionBlockItem['type'], content = '', metadata = {}) => {
    const newBlock: DevotionBlockItem = {
      type,
      position: blocks.length,
      content,
      metadata,
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) return;
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setBlocks(updated);
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
      addBlock('bible', text, {
        book: pickerBook,
        chapter: pickerChapter,
        startVerse: pickerVerseStart,
        endVerse: pickerVerseEnd,
        version: pickerVersion,
      });
      setIsBiblePickerOpen(false);
    } catch {
      addBlock('bible', `${pickerBook} ${pickerChapter}:${pickerVerseStart}-${pickerVerseEnd}`, {
        book: pickerBook,
        chapter: pickerChapter,
      });
      setIsBiblePickerOpen(false);
    }
  };

  const handleInsertImage = () => {
    if (!imageUrlInput.trim()) return;
    addBlock('image', imageUrlInput.trim(), { width: 500 });
    setImageUrlInput('');
    setIsImageModalOpen(false);
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
            <span>New Devotion</span>
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
              placeholder="Search your devotions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs"
            />
          </div>

          <div className="text-xs text-stone-400 font-medium">
            {devotions.length} {devotions.length === 1 ? 'entry' : 'entries'} recorded
          </div>
        </div>

        {/* Devotions Grid / List */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-stone-400 animate-pulse">Loading journal...</div>
        ) : devotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {devotions.map((dev) => (
              <div
                key={dev.id}
                className="group relative rounded-3xl bg-white dark:bg-stone-900 p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {dev.date}
                    </span>
                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(dev.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                        title="Edit Devotion"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dev.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete Devotion"
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

                  {dev.snippet && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 font-serif leading-relaxed">
                      {dev.snippet}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 mt-4 flex items-center justify-between text-[11px] text-stone-400">
                  <span>{dev.blocks_count} sections</span>
                  <button
                    onClick={() => handleOpenEdit(dev.id)}
                    className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Open Notebook →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Your journal is clean & empty</h3>
              <p className="text-xs text-stone-500">
                Write down your prayers, insights, and lessons learned while walking with God.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Write First Entry
            </button>
          </div>
        )}
      </div>

      {/* Devotion Block Editor Modal (Full-featured block notebook) */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={activeDevotionId ? 'Edit Devotion' : 'New Personal Devotion'}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Metadata inputs */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Give your devotion an inspiring title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl text-lg font-bold border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
              />
              <input
                type="text"
                placeholder="Cover image URL (optional)..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
              />
            </div>
          </div>

          {/* Block Document Stream */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100 dark:border-stone-800">
              <span>Notebook Sections</span>
              <span className="text-[11px] font-normal normal-case">Content reflows automatically</span>
            </div>

            {blocks.map((block, idx) => (
              <div
                key={idx}
                className="relative group p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 space-y-2 transition-all hover:border-stone-300 dark:hover:border-stone-700"
              >
                {/* Block header & controls */}
                <div className="flex items-center justify-between text-[11px] text-stone-400 pb-1">
                  <span className="font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {block.type === 'bible' && '📖 Bible Passage'}
                    {block.type === 'text' && '✍️ Reflection Text'}
                    {block.type === 'heading' && '📌 Heading'}
                    {block.type === 'prayer' && '🙏 Prayer'}
                    {block.type === 'quote' && '💬 Quote'}
                    {block.type === 'image' && '🖼️ Image / GIF'}
                    {block.type === 'divider' && '— Divider'}
                  </span>

                  <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveBlock(idx, 'up')}
                      className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === blocks.length - 1}
                      onClick={() => moveBlock(idx, 'down')}
                      className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(idx)}
                      className="p-1 rounded text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Block Content Renderers / Editors */}
                {block.type === 'text' && (
                  <textarea
                    rows={4}
                    placeholder="Write your personal reflections and thoughts..."
                    value={block.content}
                    onChange={(e) => updateBlockContent(idx, e.target.value)}
                    className="w-full p-3 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-serif leading-relaxed"
                  />
                )}

                {block.type === 'heading' && (
                  <input
                    type="text"
                    placeholder="Section Heading..."
                    value={block.content}
                    onChange={(e) => updateBlockContent(idx, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-base font-bold border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                )}

                {block.type === 'bible' && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    {block.metadata?.book && (
                      <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {block.metadata.book} {block.metadata.chapter}:{block.metadata.startVerse}
                        {block.metadata.endVerse !== block.metadata.startVerse && `-${block.metadata.endVerse}`} (
                        {block.metadata.version || 'KJV'})
                      </div>
                    )}
                    <blockquote className="font-serif text-sm italic text-stone-800 dark:text-stone-200 leading-relaxed">
                      “{block.content}”
                    </blockquote>
                  </div>
                )}

                {block.type === 'prayer' && (
                  <div className="space-y-1">
                    <textarea
                      rows={3}
                      placeholder="Lord, my prayer today is..."
                      value={block.content}
                      onChange={(e) => updateBlockContent(idx, e.target.value)}
                      className="w-full p-3 rounded-xl text-sm italic border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-serif leading-relaxed"
                    />
                  </div>
                )}

                {block.type === 'quote' && (
                  <textarea
                    rows={2}
                    placeholder="Quote text..."
                    value={block.content}
                    onChange={(e) => updateBlockContent(idx, e.target.value)}
                    className="w-full p-3 rounded-xl text-sm border-l-4 border-amber-500 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-serif italic"
                  />
                )}

                {block.type === 'image' && (
                  <div className="space-y-2">
                    {block.content && (
                      <div className="max-h-60 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 flex justify-center bg-stone-950/5">
                        <img
                          src={block.content}
                          alt="Devotion illustration"
                          className="object-contain max-h-60 w-auto rounded-lg"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Image URL..."
                      value={block.content}
                      onChange={(e) => updateBlockContent(idx, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"
                    />
                  </div>
                )}

                {block.type === 'divider' && (
                  <div className="py-2 flex items-center justify-center text-stone-300 dark:text-stone-700">
                    <div className="w-24 h-0.5 bg-stone-200 dark:bg-stone-800 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Section Toolbar & Floating Bible Button */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-stone-400 font-medium mr-2">Add block:</span>
              <button
                type="button"
                onClick={() => addBlock('text')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              >
                + Text
              </button>
              <button
                type="button"
                onClick={() => addBlock('heading')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              >
                + Heading
              </button>
              <button
                type="button"
                onClick={() => addBlock('prayer')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
              >
                + Prayer
              </button>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 flex items-center gap-1"
              >
                <ImageIcon className="w-3 h-3" /> Image
              </button>
              <button
                type="button"
                onClick={() => addBlock('divider')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              >
                — Divider
              </button>
            </div>

            {/* The Floating 📖 Bible Button as requested in Task section 26 */}
            <button
              type="button"
              onClick={() => setIsBiblePickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-105"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📖 Insert Bible Passage</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors disabled:opacity-50"
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
        title="Insert Bible Passage"
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

      {/* Insert Image Modal */}
      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} title="Insert Image / GIF" maxWidth="max-w-md">
        <div className="space-y-4">
          <input
            type="url"
            placeholder="Paste image or GIF web URL..."
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
          />
          <p className="text-[11px] text-stone-400">
            Surrounding paragraphs will automatically reflow smoothly around this image.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertImage}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            >
              Insert Image
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
