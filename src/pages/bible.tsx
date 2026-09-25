import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Book,
  Highlighter,
  Columns,
  Lightbulb,
  PlusCircle,
  X,
  Check,
  Search,
  Download,
  Trash2,
  Edit2,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-200/70 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-100', dot: 'bg-yellow-400' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-200/70 dark:bg-amber-500/30 text-amber-900 dark:text-amber-100', dot: 'bg-amber-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-200/70 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-100', dot: 'bg-emerald-500' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-200/70 dark:bg-sky-500/30 text-sky-900 dark:text-sky-100', dot: 'bg-sky-400' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-200/70 dark:bg-rose-500/30 text-rose-900 dark:text-rose-100', dot: 'bg-rose-400' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-200/70 dark:bg-purple-500/30 text-purple-900 dark:text-purple-100', dot: 'bg-purple-400' },
];

export default function BibleReader() {
  const router = useRouter();
  const {
    user,
    currentVersion,
    currentBook,
    currentChapter,
    setCurrentVersion,
    setCurrentBook,
    setCurrentChapter,
  } = useApp();

  const [versions, setVersions] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [chapterData, setChapterData] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [userInsights, setUserInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Download More Versions modal state
  const [isDownloadVersionsModalOpen, setIsDownloadVersionsModalOpen] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<any[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [installingVersionId, setInstallingVersionId] = useState<string | null>(null);
  const [installSuccessMessage, setInstallSuccessMessage] = useState<string | null>(null);
  const [downloadModalTab, setDownloadModalTab] = useState<'all' | 'tagalog' | 'english'>('all');

  // Verse selection state
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedModalBook, setSelectedModalBook] = useState(currentBook);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Sync selectedModalBook whenever modal opens or currentBook changes
  useEffect(() => {
    if (isBookModalOpen) {
      setSelectedModalBook(currentBook);
    }
  }, [isBookModalOpen, currentBook]);

  // User Insight editing state
  const [insightTitle, setInsightTitle] = useState('');
  const [insightContent, setInsightContent] = useState('');
  const [activeExistingInsight, setActiveExistingInsight] = useState<any>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Compare modal data
  const [compareData, setCompareData] = useState<any[]>([]);
  const [bookSearch, setBookSearch] = useState('');

  // Scroll direction detection for floating upward header on mobile/desktop
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY;

      if (Math.abs(diff) > 6) {
        setScrollDirection(diff > 0 ? 'down' : 'up');
        lastScrollY = scrollY > 0 ? scrollY : 0;
      }
      setIsScrolled(scrollY > 50);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch Bible Versions and Books
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const vers = await api.getBibleVersions();
        setVersions(vers);
        if (vers && vers.length > 0 && !vers.some((v: any) => v.id.toUpperCase() === currentVersion.toUpperCase())) {
          setCurrentVersion(vers[0].id);
        }
        const bks = await api.getBibleBooks(currentVersion);
        setBooks(bks);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, [currentVersion]);

  // Fetch Chapter Content, User Highlights, and User Insights
  useEffect(() => {
    const fetchChapter = async () => {
      setIsLoading(true);
      setSelectedVerses([]);
      try {
        const [chapRes, hlRes, insightsRes] = await Promise.allSettled([
          api.getBibleChapter(currentVersion, currentBook, currentChapter),
          user ? api.getHighlights() : Promise.resolve([]),
          user ? api.getUserInsights() : Promise.resolve([]),
        ]);

        if (chapRes.status === 'fulfilled') {
          setChapterData(chapRes.value);
        } else {
          setChapterData(null);
        }
        if (hlRes.status === 'fulfilled' && Array.isArray(hlRes.value)) setHighlights(hlRes.value);
        if (insightsRes.status === 'fulfilled' && Array.isArray(insightsRes.value)) setUserInsights(insightsRes.value);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChapter();
  }, [currentVersion, currentBook, currentChapter, user, router.asPath, reloadKey]);

  const toggleVerseSelection = (verseNumber: number) => {
    if (selectedVerses.includes(verseNumber)) {
      setSelectedVerses(selectedVerses.filter((v) => v !== verseNumber));
    } else {
      setSelectedVerses([...selectedVerses, verseNumber].sort((a, b) => a - b));
    }
  };

  const handleApplyHighlight = async (colorId: string) => {
    if (!user) {
      router.push('/profile');
      return;
    }
    if (selectedVerses.length === 0) return;
    const start = selectedVerses[0];
    const end = selectedVerses[selectedVerses.length - 1];

    try {
      const res = await api.createHighlight({
        version_id: currentVersion,
        book_name: currentBook,
        chapter: currentChapter,
        verse_start: start,
        verse_end: end,
        color: colorId,
      });
      setHighlights([...highlights.filter((h) => !(h.chapter === currentChapter && h.verse_start === start)), res]);
      setSelectedVerses([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Download More Versions handlers
  const handleOpenDownloadVersionsModal = async () => {
    setIsDownloadVersionsModalOpen(true);
    setIsLoadingAvailable(true);
    setInstallSuccessMessage(null);
    try {
      const avail = await api.getAvailableBibleVersions();
      setAvailableVersions(Array.isArray(avail) ? avail : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleInstallVersion = async (versionId: string) => {
    setInstallingVersionId(versionId);
    setInstallSuccessMessage(null);
    try {
      const installed = await api.installBibleVersion(versionId);
      // Update installed versions list
      setVersions((prev) => {
        if (prev.some((v) => v.id.toUpperCase() === installed.id.toUpperCase())) return prev;
        return [...prev, installed];
      });
      // Remove from uninstalled available list
      setAvailableVersions((prev) => prev.filter((v) => v.id.toUpperCase() !== versionId.toUpperCase()));
      // Automatically switch to newly installed version
      setCurrentVersion(installed.id);
      setInstallSuccessMessage(`Installed ${installed.name}! Active version changed to ${installed.abbreviation}.`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to install version: ${err.message || err}`);
    } finally {
      setInstallingVersionId(null);
    }
  };

  // Open User Insights modal (Note & Insights are one)
  const handleOpenUserInsight = (verseNum?: number) => {
    if (!user) {
      router.push('/profile');
      return;
    }
    const targetVerse = verseNum || (selectedVerses.length > 0 ? selectedVerses[0] : 1);
    const existing = userInsights.find(
      (ins) => ins.chapter === currentChapter && targetVerse >= ins.verse_start && targetVerse <= ins.verse_end
    );

    if (existing) {
      setActiveExistingInsight(existing);
      setInsightTitle(existing.title || '');
      setInsightContent(existing.content || '');
      setIsEditingExisting(false);
    } else {
      setActiveExistingInsight(null);
      const start = selectedVerses.length > 0 ? selectedVerses[0] : targetVerse;
      const end = selectedVerses.length > 0 ? selectedVerses[selectedVerses.length - 1] : targetVerse;
      setInsightTitle(`${currentBook} ${currentChapter}:${start}${end !== start ? `-${end}` : ''}`);
      setInsightContent('');
      setIsEditingExisting(true);
    }
    setIsInsightModalOpen(true);
  };

  const handleSaveUserInsight = async () => {
    if (!insightContent.trim()) return;
    try {
      if (activeExistingInsight && isEditingExisting) {
        const updated = await api.updateUserInsight(activeExistingInsight.id, {
          title: insightTitle,
          content: insightContent,
        });
        setUserInsights(userInsights.map((ins) => (ins.id === updated.id ? updated : ins)));
      } else {
        const start = selectedVerses.length > 0 ? selectedVerses[0] : 1;
        const end = selectedVerses.length > 0 ? selectedVerses[selectedVerses.length - 1] : start;
        const newInsight = await api.createUserInsight({
          version_id: currentVersion,
          book_name: currentBook,
          chapter: currentChapter,
          verse_start: start,
          verse_end: end,
          title: insightTitle,
          content: insightContent,
        });
        setUserInsights([...userInsights, newInsight]);
      }
      setIsInsightModalOpen(false);
      setSelectedVerses([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUserInsight = async (id: string) => {
    try {
      await api.deleteUserInsight(id);
      setUserInsights(userInsights.filter((ins) => ins.id !== id));
      setIsInsightModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCompare = async () => {
    if (selectedVerses.length === 0) return;
    const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
    try {
      // Use all installed versions except the currently active one
      const otherVersions = versions
        .map((v: any) => v.id)
        .filter((id: string) => id.toUpperCase() !== currentVersion.toUpperCase());
      const versionsToCompare = otherVersions.length > 0 ? otherVersions : ['KJV'];
      const res = await api.compareVerses(versionsToCompare, currentBook, currentChapter, sortedVerses);
      setCompareData(res);
      setIsCompareModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToDevotion = () => {
    if (selectedVerses.length === 0 || !chapterData) return;
    const start = selectedVerses[0];
    const end = selectedVerses[selectedVerses.length - 1];
    const versesInOrder = chapterData.verses.filter((v: any) => selectedVerses.includes(v.verse_number));
    const combinedText = versesInOrder.map((v: any) => `[${v.verse_number}] ${v.text}`).join(' ');

    router.push({
      pathname: '/devotions',
      query: {
        insert_verse: 'true',
        book: currentBook,
        chapter: currentChapter,
        verse_start: start,
        verse_end: end,
        version: currentVersion,
        text: combinedText,
      },
    });
  };

  const getVerseHighlight = (verseNumber: number) => {
    return highlights.find((h) => h.chapter === currentChapter && verseNumber >= h.verse_start && verseNumber <= h.verse_end);
  };

  const hasUserInsight = (verseNumber: number) => {
    return userInsights.some((ins) => ins.chapter === currentChapter && verseNumber >= ins.verse_start && verseNumber <= ins.verse_end);
  };

  const currentBookObj = books.find((b) => b.name.toLowerCase() === currentBook.toLowerCase());
  const maxChapters = currentBookObj?.chapters_count || 50;

  const modalBookObj = books.find(
    (b) => b.name.toLowerCase() === (selectedModalBook || currentBook).toLowerCase()
  );
  const modalMaxChapters = modalBookObj?.chapters_count || 50;

  const filteredBooks = books.filter((b) => b.name.toLowerCase().includes(bookSearch.toLowerCase()));

  return (
    <>
      <PageLayout
        title={`${currentBook} ${currentChapter}`}
        items={[
          { label: 'Bible', href: '/bible' },
          { label: `${currentBook} ${currentChapter}` },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Top Header / Scripture & Version Controls */}
        <div className="flex items-center justify-between gap-2 w-full pb-4 border-b border-stone-200 dark:border-stone-800">
            {/* Book & Chapter Selector Button */}
            <button
              type="button"
              onClick={() => setIsBookModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:border-amber-500/60 transition-all font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex-shrink-0"
            >
              <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>
                {currentBook} {currentChapter}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400 hidden sm:inline" />
            </button>

            {/* Right Controls: Translation Selector with Download More Versions */}
            <div className="flex items-center space-x-1.5 min-w-0 flex-shrink">
              <span className="text-xs text-stone-400 font-medium hidden sm:inline">Version:</span>
              <select
                value={currentVersion}
                onChange={(e) => {
                  if (e.target.value === '__download_more__') {
                    handleOpenDownloadVersionsModal();
                  } else {
                    setCurrentVersion(e.target.value);
                  }
                }}
                className="max-w-[155px] xs:max-w-[190px] sm:max-w-xs truncate text-xs font-semibold px-2.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                {/* Tagalog Versions */}
                {versions.some((v) => (v.language || '').toLowerCase() === 'tagalog') && (
                  <optgroup label="🇵🇭 Tagalog Versions">
                    {versions
                      .filter((ver) => (ver.language || '').toLowerCase() === 'tagalog')
                      .map((ver) => (
                        <option key={ver.id} value={ver.id}>
                          {ver.name} ({ver.abbreviation || ver.id})
                        </option>
                      ))}
                  </optgroup>
                )}

                {/* English Versions */}
                {versions.some((v) => (v.language || '').toLowerCase() === 'english') && (
                  <optgroup label="🇬🇧 English Versions">
                    {versions
                      .filter((ver) => (ver.language || '').toLowerCase() === 'english')
                      .map((ver) => (
                        <option key={ver.id} value={ver.id}>
                          {ver.name} ({ver.abbreviation || ver.id})
                        </option>
                      ))}
                  </optgroup>
                )}

                <option disabled>──────────</option>
                <option value="__download_more__" className="text-amber-600 font-bold">
                  ➕ Download more versions...
                </option>
              </select>

              <button
                type="button"
                onClick={handleOpenDownloadVersionsModal}
                className="p-2 rounded-xl text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors flex-shrink-0"
                title="Download more Bible versions"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>
          </div>

        {/* Chapter Content Card */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-12 shadow-sm border border-stone-200/80 dark:border-stone-800 min-h-[500px]">
          {isLoading ? (
            <div className="py-20 text-center text-sm text-stone-400 animate-pulse">
              Loading scripture from database / free Bible service...
            </div>
          ) : chapterData && chapterData.verses && chapterData.verses.length > 0 ? (
            <div className="space-y-6">
              <div className="text-center pb-6 border-b border-stone-100 dark:border-stone-800/80">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
                  {currentBook} {currentChapter}
                </h2>

              </div>

              {/* Verses stream */}
              <div className="font-serif text-lg sm:text-xl leading-relaxed text-stone-800 dark:text-stone-200 space-y-3">
                {chapterData.verses.map((verse: any) => {
                  const isSelected = selectedVerses.includes(verse.verse_number);
                  const hl = getVerseHighlight(verse.verse_number);
                  const hlColorObj = hl ? HIGHLIGHT_COLORS.find((c) => c.id === hl.color) : null;
                  const verseHasInsight = hasUserInsight(verse.verse_number);

                  return (
                    <span
                      key={verse.id || verse.verse_number}
                      onClick={() => toggleVerseSelection(verse.verse_number)}
                      className={`inline cursor-pointer px-1 py-0.5 rounded transition-colors group relative ${isSelected
                          ? 'bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-500/50'
                          : hlColorObj
                            ? hlColorObj.bg
                            : 'hover:bg-stone-100 dark:hover:bg-stone-800/60'
                        }`}
                    >
                      <sup className="text-xs font-sans font-semibold text-stone-400 mr-1 select-none">
                        {verse.verse_number}
                      </sup>
                      <span>{verse.text} </span>
                      {verseHasInsight && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUserInsight(verse.verse_number);
                          }}
                          className="inline-block align-top ml-1 text-amber-500 hover:scale-125 transition-transform"
                          title="View your personal insight"
                        >
                          <Lightbulb className="w-3.5 h-3.5 inline fill-amber-400/30" />
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <p className="text-stone-600 dark:text-stone-400 font-medium">Chapter text not yet loaded.</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold"
              >
                <span>Reload Chapter</span>
              </button>
            </div>
          )}
        </div>

        {/* Chapter Navigation Controls - Floats when scrolling below */}
        {selectedVerses.length === 0 && (
          <div
            className={`transition-all duration-300 z-30 ${
              isScrolled
                ? 'fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3'
                : 'pt-6 flex justify-center'
            }`}
          >
            <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800/90 shadow-xl shadow-stone-900/10 dark:shadow-stone-950/40">
              {/* Previous Chapter Arrow */}
              <button
                type="button"
                disabled={currentChapter <= 1}
                onClick={() => {
                  setCurrentChapter(Math.max(1, currentChapter - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Previous Chapter"
                aria-label="Previous Chapter"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Clickable Book & Chapter Name in Middle */}
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs sm:text-sm transition-colors group cursor-pointer"
                title="Click to choose books and verses"
              >
                <Book className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="tracking-tight">
                  {currentBook} {currentChapter}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500 transition-colors" />
              </button>

              {/* Next Chapter Arrow */}
              <button
                type="button"
                disabled={currentChapter >= maxChapters}
                onClick={() => {
                  setCurrentChapter(currentChapter + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Next Chapter"
                aria-label="Next Chapter"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Verse Action Bar (Shown when verses are selected) */}
      {selectedVerses.length > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center space-x-2 pl-2">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
              v.{selectedVerses[0]}
              {selectedVerses.length > 1 && `-${selectedVerses[selectedVerses.length - 1]}`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedVerses([])}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Color highlights palette */}
            <div className="flex items-center space-x-1 pr-2 border-r border-stone-200 dark:border-stone-800">
              {HIGHLIGHT_COLORS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleApplyHighlight(col.id)}
                  title={col.label}
                  className={`w-5 h-5 rounded-full ${col.dot} hover:scale-110 transition-transform shadow-xs`}
                />
              ))}
            </div>

            {/* UNIFIED INSIGHTS ACTION (Note + Insights is one as requested) */}
            <button
              onClick={() => handleOpenUserInsight()}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Insights</span>
            </button>

            {/* Compare Action */}
            <button
              onClick={handleOpenCompare}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Columns className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">Compare</span>
            </button>

            {/* Add to Devotion */}
            <button
              onClick={handleAddToDevotion}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Devotion</span>
            </button>
          </div>
        </div>
      )}

      {/* Book & Chapter Selection Modal */}
      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title="Select Scripture" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search books (e.g. Genesis, John, Psalms)..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredBooks.map((b) => {
              const isSelected = b.name.toLowerCase() === (selectedModalBook || currentBook).toLowerCase();
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedModalBook(b.name);
                  }}
                  className={`p-2.5 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <div className="truncate">{b.name}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-amber-100' : 'opacity-70'}`}>
                    {b.chapters_count || 50} ch.
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Select Chapter ({selectedModalBook || currentBook}):
              </h4>
              <span className="text-[11px] text-stone-400">
                {modalMaxChapters} chapters
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
              {Array.from({ length: modalMaxChapters }, (_, i) => i + 1).map((ch) => {
                const isCurrentActive =
                  (selectedModalBook || currentBook).toLowerCase() === currentBook.toLowerCase() &&
                  ch === currentChapter;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      setCurrentBook(selectedModalBook || currentBook);
                      setCurrentChapter(ch);
                      setIsBookModalOpen(false);
                    }}
                    className={`w-9 h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isCurrentActive
                        ? 'bg-amber-500 text-white shadow-xs font-bold'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-stone-700'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Unified User Insights Modal */}
      <Modal
        isOpen={isInsightModalOpen}
        onClose={() => setIsInsightModalOpen(false)}
        title={activeExistingInsight && !isEditingExisting ? 'My Personal Insight' : 'Record Personal Insight'}
      >
        <div className="space-y-4">
          {activeExistingInsight && !isEditingExisting ? (
            /* View Mode */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {currentBook} {currentChapter}:{activeExistingInsight.verse_start}
                  {activeExistingInsight.verse_end !== activeExistingInsight.verse_start && `-${activeExistingInsight.verse_end}`}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setIsEditingExisting(true)}
                    className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    title="Edit Insight"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUserInsight(activeExistingInsight.id)}
                    className="p-1 rounded text-stone-400 hover:text-rose-500"
                    title="Delete Insight"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {activeExistingInsight.title && (
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{activeExistingInsight.title}</h4>
              )}
              <p className="font-serif text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                {activeExistingInsight.content}
              </p>
            </div>
          ) : (
            /* Edit / Create Mode */
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Insight focus or title..."
                value={insightTitle}
                onChange={(e) => setInsightTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-semibold"
              />
              <textarea
                rows={5}
                placeholder="What is God speaking to you through these verses? Write your personal insight and reflection..."
                value={insightContent}
                onChange={(e) => setInsightContent(e.target.value)}
                className="w-full p-3 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-serif leading-relaxed"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInsightModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserInsight}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  Save Insight
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Comparison Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title={`Compare Translations (${(() => {
          if (selectedVerses.length === 0) return '';
          const sorted = [...selectedVerses].sort((a, b) => a - b);
          if (sorted.length === 1) return `${currentBook} ${currentChapter}:${sorted[0]}`;
          const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
          const range = isConsecutive ? `${sorted[0]}-${sorted[sorted.length - 1]}` : sorted.join(', ');
          return `${currentBook} ${currentChapter}:${range}`;
        })()})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {compareData.length > 0 ? (
            <div className="space-y-3">
              {compareData.map((item, idx) => {
                const verseRange =
                  item.verse_numbers && item.verse_numbers.length > 1
                    ? `${item.verse_numbers[0]}-${item.verse_numbers[item.verse_numbers.length - 1]}`
                    : item.verse_number;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                      <span>{item.version_name} ({item.version_id})</span>
                      <span className="text-stone-400">{item.book} {item.chapter}:{verseRange}</span>
                    </div>
                    <p className="font-serif text-base text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-400">
              Loading translation comparison from database...
            </div>
          )}
        </div>
      </Modal>

      {/* Download More Bible Versions Modal */}
      <Modal
        isOpen={isDownloadVersionsModalOpen}
        onClose={() => setIsDownloadVersionsModalOpen(false)}
        title="Download More Bible Versions"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Choose from available translations below to install them into your system. Once installed, they will appear in your version selector and become available for reading, devotions, and parallel comparisons.
          </p>

          {installSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{installSuccessMessage}</span>
            </div>
          )}

          {/* Language Tabs for Tagalog & English */}
          {(() => {
            const tagalogVersions = availableVersions.filter(
              (item) => (item.language || '').toLowerCase() === 'tagalog'
            );
            const englishVersions = availableVersions.filter(
              (item) => (item.language || '').toLowerCase() === 'english'
            );
            const filteredAvailableVersions = availableVersions
              .filter((item) => {
                const lang = (item.language || '').toLowerCase();
                return lang === 'tagalog' || lang === 'english';
              })
              .filter((item) => {
                if (downloadModalTab === 'tagalog') return (item.language || '').toLowerCase() === 'tagalog';
                if (downloadModalTab === 'english') return (item.language || '').toLowerCase() === 'english';
                return true;
              });

            return (
              <>
                <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setDownloadModalTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      downloadModalTab === 'all'
                        ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    All ({tagalogVersions.length + englishVersions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownloadModalTab('tagalog')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      downloadModalTab === 'tagalog'
                        ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>🇵🇭 Tagalog</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-700 font-mono">
                      {tagalogVersions.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownloadModalTab('english')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      downloadModalTab === 'english'
                        ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>🇬🇧 English</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-700 font-mono">
                      {englishVersions.length}
                    </span>
                  </button>
                </div>

                {isLoadingAvailable ? (
                  <div className="py-12 text-center text-xs text-stone-400 animate-pulse">
                    Checking available translations catalog...
                  </div>
                ) : filteredAvailableVersions.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      {downloadModalTab === 'tagalog'
                        ? 'All Tagalog Versions Installed'
                        : downloadModalTab === 'english'
                        ? 'All English Versions Installed'
                        : 'All Available Versions Installed'}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                      {downloadModalTab === 'tagalog'
                        ? 'All Tagalog translations currently in our catalog are already installed and active.'
                        : downloadModalTab === 'english'
                        ? 'All English translations currently in our catalog are already installed and active.'
                        : 'All Tagalog and English translations currently in our catalog are already installed and active in your system.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {filteredAvailableVersions.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-amber-500/40"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                              {item.abbreviation || item.id}
                            </span>
                            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                              {item.name}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                              (item.language || '').toLowerCase() === 'tagalog'
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                            }`}>
                              {item.language}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.license && (
                            <p className="text-[10px] text-stone-400">
                              License: {item.license}
                            </p>
                          )}
                        </div>

                        <div className="sm:shrink-0">
                          <button
                            type="button"
                            onClick={() => handleInstallVersion(item.id)}
                            disabled={installingVersionId === item.id}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <Download className={`w-3.5 h-3.5 ${installingVersionId === item.id ? 'animate-bounce' : ''}`} />
                            <span>{installingVersionId === item.id ? 'Installing...' : 'Install Version'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsDownloadVersionsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
