import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Lightbulb, Highlighter, Trash2, Edit2, BookOpen, Search, ArrowRight } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function StudyPage() {
  const router = useRouter();
  const { user, setCurrentBook, setCurrentChapter, setCurrentVersion } = useApp();

  const [activeTab, setActiveTab] = useState<'insights' | 'highlights'>('insights');
  const [highlights, setHighlights] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
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
      setHighlights(hlData);
      setInsights(insightsData);
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

  return (
    <>
      <PageLayout
        title="Personal Insights & Highlights"
        items={[{ label: 'Insights' }]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Tab switchers */}
        <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3">
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
            <span>My Insights ({insights.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('highlights')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'highlights'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlights ({highlights.length})</span>
          </button>
        </div>

        {/* Content Stream */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-stone-400 animate-pulse">Loading study items...</div>
        ) : activeTab === 'insights' ? (
          insights.length > 0 ? (
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
              No personal insights recorded yet. While reading scripture, select verses and click "Insights" to write your personal reflection.
            </div>
          )
        ) : highlights.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((hl) => (
              <div
                key={hl.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                      {hl.book_name} {hl.chapter}:{hl.verse_start}
                      {hl.verse_end !== hl.verse_start && `-${hl.verse_end}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400">{hl.version_id} Translation</div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleJumpToChapter(hl.book_name, hl.chapter, hl.version_id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                    title="Jump to verse"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteHighlight(hl.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Remove Highlight"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-stone-400">
            No highlights recorded yet. Select verses in the Bible reader to highlight with beautiful colors.
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Note">
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
              Update Insight
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
