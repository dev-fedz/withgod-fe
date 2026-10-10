import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bookmark, Lightbulb, Trash2, Edit2, BookOpen, ArrowRight, LogIn } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', bg: 'rgba(254, 240, 138, 0.45)', dot: '#FACC15' },
  { id: 'amber', label: 'Amber', bg: 'rgba(254, 215, 170, 0.5)', dot: '#FB923C' },
  { id: 'emerald', label: 'Emerald', bg: 'rgba(167, 243, 208, 0.45)', dot: '#34D399' },
  { id: 'sky', label: 'Sky', bg: 'rgba(186, 230, 253, 0.45)', dot: '#38BDF8' },
  { id: 'rose', label: 'Rose', bg: 'rgba(254, 205, 211, 0.45)', dot: '#FB7185' },
  { id: 'purple', label: 'Purple', bg: 'rgba(233, 213, 255, 0.45)', dot: '#C084FC' },
];

export default function StudyPage() {
  const router = useRouter();
  const { user, setCurrentBook, setCurrentChapter, setCurrentVersion } = useApp();

  const [activeTab, setActiveTab] = useState<'highlights' | 'insights'>('highlights');
  const [highlights, setHighlights] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Insight Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInsight, setEditingInsight] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const fetchData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [hlData, insightsData] = await Promise.all([
        api.getHighlights(),
        api.getUserInsights(),
      ]);
      setHighlights(hlData || []);
      setInsights(insightsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, router.asPath]);

  const handleDeleteHighlight = async (id: string) => {
    try {
      await api.deleteHighlight(id);
      setHighlights(highlights.filter((h) => h.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInsight = async (id: string) => {
    try {
      await api.deleteUserInsight(id);
      setInsights(insights.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditInsight = (item: any) => {
    setEditingInsight(item);
    setEditTitle(item.title || '');
    setEditContent(item.content || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditInsight = async () => {
    if (!editingInsight) return;
    try {
      const updated = await api.updateUserInsight(editingInsight.id, {
        title: editTitle,
        content: editContent,
      });
      setInsights(insights.map((n) => (n.id === updated.id ? updated : n)));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJumpToChapter = (book: string, chapter: number, version = 'KJV') => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setCurrentVersion(version);
    router.push('/bible');
  };

  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = { all: highlights.length };
    HIGHLIGHT_COLORS.forEach((c) => {
      counts[c.id] = highlights.filter((h) => h.color === c.id).length;
    });
    return counts;
  }, [highlights]);

  const filteredHighlights = useMemo(() => {
    if (colorFilter === 'all') return highlights;
    return highlights.filter((h) => h.color === colorFilter);
  }, [highlights, colorFilter]);

  if (!user) {
    return (
      <>
        <PageLayout
          title="Highlighted Verses"
          items={[{ label: 'Highlighted Verses' }]}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Sign In to View Highlights
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Access your saved verse highlights and personal study notes across all your devices.
          </p>
          <div className="pt-2">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageLayout
        title="Highlighted Verses"
        items={[{ label: 'Highlighted Verses' }]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Tab switchers */}
        <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('highlights')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'highlights'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Highlighted Verses ({highlights.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'insights'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Verse Reflections ({insights.length})</span>
          </button>
        </div>

        {/* Color Filters when on Highlights Tab */}
        {activeTab === 'highlights' && highlights.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setColorFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                colorFilter === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <span>All ({colorCounts.all || 0})</span>
            </button>
            {HIGHLIGHT_COLORS.map((col) => {
              const count = colorCounts[col.id] || 0;
              const isSelected = colorFilter === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setColorFilter(col.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: col.dot }}
                  />
                  <span>
                    {col.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Stream */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-stone-400 animate-pulse">Loading study items...</div>
        ) : activeTab === 'highlights' ? (
          filteredHighlights.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredHighlights.map((hl) => {
                const colObj = HIGHLIGHT_COLORS.find((c) => c.id === hl.color);
                return (
                  <div
                    key={hl.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center justify-between hover:border-amber-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block shrink-0 shadow-xs"
                          style={{ backgroundColor: colObj?.dot || '#FACC15' }}
                        />
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                          {hl.book_name} {hl.chapter}:{hl.verse_start}
                          {hl.verse_end !== hl.verse_start && `-${hl.verse_end}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 pl-5">{hl.version_id} Translation</div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleJumpToChapter(hl.book_name, hl.chapter, hl.version_id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Read in Bible Reader"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHighlight(hl.id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Remove Highlight"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-stone-400">
              {colorFilter !== 'all'
                ? `No ${colorFilter} highlights recorded yet.`
                : 'No highlights recorded yet. Select verses in the Bible reader to highlight with beautiful colors.'}
            </div>
          )
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {item.book_name} {item.chapter}:{item.verse_start}
                    {item.verse_end !== item.verse_start && `-${item.verse_end}`}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleJumpToChapter(item.book_name, item.chapter, item.version_id)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs flex items-center gap-1 mr-2"
                      title="Read in Bible Reader"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleOpenEditInsight(item)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteInsight(item.id)}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.title && <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{item.title}</h4>}
                <p className="font-serif text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-stone-400">
            No personal scripture reflections recorded yet. While reading scripture, select verses and click "Insight" to write your personal reflection.
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Reflection">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title..."
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 font-semibold"
          />
          <textarea
            rows={5}
            placeholder="Content..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 font-serif leading-relaxed"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEditInsight}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            >
              Update Reflection
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
