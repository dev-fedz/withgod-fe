import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Scroll,
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  Columns,
  Edit3,
  Share2,
  Slash,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getDownloadedBibleVersions } from '../utils/bibleUtils';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', bg: '#FEF9C3', darkBg: 'rgba(234, 179, 8, 0.22)', dot: '#EAB308' },
  { id: 'green', label: 'Green', bg: '#DCFCE7', darkBg: 'rgba(34, 197, 94, 0.22)', dot: '#22C55E' },
  { id: 'blue', label: 'Blue', bg: '#DBEAFE', darkBg: 'rgba(59, 130, 246, 0.22)', dot: '#3B82F6' },
  { id: 'purple', label: 'Purple', bg: '#F3E8FF', darkBg: 'rgba(168, 85, 247, 0.22)', dot: '#A855F7' },
  { id: 'rose', label: 'Rose', bg: '#FFE4E6', darkBg: 'rgba(244, 63, 94, 0.22)', dot: '#F43F5E' },
];

const TORAH_BOOKS = [
  { id: 'all', label: 'All Portions', count: 54 },
  { id: 'Genesis', label: 'Genesis (Bereshit)', count: 12 },
  { id: 'Exodus', label: 'Exodus (Shemot)', count: 11 },
  { id: 'Leviticus', label: 'Leviticus (Vayikra)', count: 10 },
  { id: 'Numbers', label: 'Numbers (Bamidbar)', count: 10 },
  { id: 'Deuteronomy', label: 'Deuteronomy (Devarim)', count: 11 },
];

export default function TorahPage() {
  const router = useRouter();
  const { user, currentVersion, setCurrentVersion, setCurrentBook, setCurrentChapter } = useApp();

  const [thisWeek, setThisWeek] = useState<any>(null);
  const [portions, setPortions] = useState<any[]>([]);
  const [selectedPortionId, setSelectedPortionId] = useState<string>('');
  const [selectedPortionData, setSelectedPortionData] = useState<any>(null);

  // Reading Suite state
  const [activeReadingTab, setActiveReadingTab] = useState<'torah' | 'prophet' | 'gospel'>('torah');
  const [readingsData, setReadingsData] = useState<any>(null);
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [downloadedVersions, setDownloadedVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>(currentVersion || 'KJV');

  // Load downloaded versions from storage
  useEffect(() => {
    setDownloadedVersions(getDownloadedBibleVersions());
  }, []);

  // Filter versions to only downloaded Bible versions (Mobile Parity)
  const selectableTorahVersions = React.useMemo(() => {
    if (!versions || versions.length === 0) return [];
    if (downloadedVersions.length === 0) return versions;
    const downloadedUpper = downloadedVersions.map((v) => v.toUpperCase());
    const filtered = versions.filter((v: any) =>
      downloadedUpper.includes((v.id || '').toUpperCase())
    );
    return filtered.length > 0 ? filtered : versions;
  }, [versions, downloadedVersions]);

  // Ensure selectedVersion is among selectable versions
  useEffect(() => {
    if (
      selectableTorahVersions.length > 0 &&
      !selectableTorahVersions.some(
        (v: any) => v.id.toUpperCase() === selectedVersion.toUpperCase()
      )
    ) {
      const fallback = selectableTorahVersions[0].id;
      setSelectedVersion(fallback);
      setCurrentVersion(fallback);
    }
  }, [selectableTorahVersions, selectedVersion, setCurrentVersion]);

  // Filter & Search state
  const [selectedBook, setSelectedBook] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);

  // Verse Selection & Highlighting (Mobile Parity)
  const [highlights, setHighlights] = useState<any[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<Record<string, number[]>>({});
  const [activeSegKey, setActiveSegKey] = useState<string | null>(null);
  const [collapsedSegments, setCollapsedSegments] = useState<Record<string, boolean>>({});

  // Compare Modal state
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<any[]>([]);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [compareRefInfo, setCompareRefInfo] = useState<{ book: string; chapter: number; verses: number[] } | null>(null);

  // Sign In Prompt Modal
  const [isLoginPromptModalOpen, setIsLoginPromptModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Load User Highlights
  const fetchHighlights = async () => {
    if (!user) {
      setHighlights([]);
      return;
    }
    try {
      const res = await api.getHighlights();
      if (Array.isArray(res)) {
        setHighlights(res);
      }
    } catch (e) {
      console.warn('Failed to fetch highlights:', e);
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, [user]);

  // Fetch This Week's Portion, Catalog, and Available Versions
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [weekRes, portionsRes, versRes] = await Promise.allSettled([
          api.getTorahThisWeek(),
          api.getTorahPortions(),
          api.getBibleVersions(),
        ]);

        if (versRes.status === 'fulfilled') {
          setVersions(versRes.value);
          if (versRes.value.length > 0 && !versRes.value.some((v: any) => v.id.toUpperCase() === selectedVersion.toUpperCase())) {
            setSelectedVersion(versRes.value[0].id);
          }
        }

        let defaultId = 'haazinu';
        if (weekRes.status === 'fulfilled' && weekRes.value) {
          setThisWeek(weekRes.value);
          defaultId = weekRes.value.id;
        }

        if (portionsRes.status === 'fulfilled' && Array.isArray(portionsRes.value)) {
          setPortions(portionsRes.value);
        }

        // Check if portion is in router query (e.g. ?portion=bereshit)
        const qPortion = router.query.portion as string;
        const initialPortionId = qPortion || defaultId;
        setSelectedPortionId(initialPortionId);
      } catch (err) {
        console.error('Failed to load Torah initial data:', err);
      }
    };
    fetchInitialData();
  }, [router.query.portion]);

  // Fetch readings whenever selected portion or translation changes
  useEffect(() => {
    if (!selectedPortionId) return;

    const fetchReadings = async () => {
      setIsLoadingReadings(true);
      // Clear selections when changing portion or version
      setSelectedVerses({});
      setActiveSegKey(null);
      try {
        const res = await api.getTorahReadings(selectedPortionId, selectedVersion);
        setReadingsData(res);
        if (res.portion) {
          setSelectedPortionData(res.portion);
        }
      } catch (err) {
        console.error('Failed loading readings:', err);
      } finally {
        setIsLoadingReadings(false);
      }
    };
    fetchReadings();
  }, [selectedPortionId, selectedVersion]);

  // Handle opening reading segment in main Bible reader
  const handleOpenInReader = (book: string, chapter: number) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    if (selectedVersion) setCurrentVersion(selectedVersion);
    router.push('/bible');
  };

  const handleCopyText = (text: string, ref: string) => {
    navigator.clipboard.writeText(`“${text}” — ${ref}`);
    setCopiedVerse(ref);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  // Toggle verse selection within a segment
  const toggleVerseSelection = (segKey: string, verseNum: number) => {
    if (!user) {
      setIsLoginPromptModalOpen(true);
      return;
    }
    setActiveSegKey(segKey);
    setSelectedVerses((prev) => {
      const current = prev[segKey] || [];
      const updated = current.includes(verseNum)
        ? current.filter((n) => n !== verseNum)
        : [...current, verseNum].sort((a, b) => a - b);
      if (updated.length === 0) {
        const next = { ...prev };
        delete next[segKey];
        if (Object.keys(next).length === 0) setActiveSegKey(null);
        return next;
      }
      return { ...prev, [segKey]: updated };
    });
  };

  const clearSegmentSelection = (segKey: string | null) => {
    if (!segKey) {
      setSelectedVerses({});
      setActiveSegKey(null);
      return;
    }
    setSelectedVerses((prev) => {
      const next = { ...prev };
      delete next[segKey];
      return next;
    });
    setActiveSegKey(null);
  };

  // Apply highlight to selected verses in a segment
  const applyHighlight = async (seg: any, colorId: string | null) => {
    if (!user) {
      setIsLoginPromptModalOpen(true);
      return;
    }
    const segKey = `${seg.book}_${seg.chapter}`;
    const selVs = selectedVerses[segKey] || [];
    if (selVs.length === 0) return;

    if (!colorId) {
      // Clear highlights for selected verses
      const toDelete = highlights.filter(
        (h) =>
          h.chapter === seg.chapter &&
          (h.book_name ? h.book_name.toLowerCase() === seg.book.toLowerCase() : true) &&
          selVs.some((v) => v >= h.verse_start && v <= h.verse_end)
      );
      try {
        await Promise.all(toDelete.map((h) => api.deleteHighlight(h.id)));
        setHighlights((prev) => prev.filter((h) => !toDelete.some((d) => d.id === h.id)));
      } catch (err) {
        console.error('Failed to clear highlights:', err);
      }
      clearSegmentSelection(segKey);
      return;
    }

    // Apply color highlight
    const start = selVs[0];
    const end = selVs[selVs.length - 1];
    try {
      const res = await api.createHighlight({
        version_id: selectedVersion,
        book_name: seg.book,
        chapter: seg.chapter,
        verse_start: start,
        verse_end: end,
        color: colorId,
      });
      setHighlights((prev) => [
        ...prev.filter(
          (h) =>
            !(
              h.chapter === seg.chapter &&
              (h.book_name ? h.book_name.toLowerCase() === seg.book.toLowerCase() : true) &&
              selVs.some((v) => v >= h.verse_start && v <= h.verse_end)
            )
        ),
        res,
      ]);
    } catch (err) {
      console.error('Failed to save highlight:', err);
    }
    clearSegmentSelection(segKey);
  };

  // Insight / Devotion creation
  const handleAddToInsight = (seg: any) => {
    if (!user) {
      setIsLoginPromptModalOpen(true);
      return;
    }
    const segKey = `${seg.book}_${seg.chapter}`;
    const selVs = selectedVerses[segKey] || [];
    if (selVs.length === 0) return;
    const sorted = [...selVs].sort((a, b) => a - b);
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    const combinedText = (seg.verses || [])
      .filter((v: any) => selVs.includes(v.verse_number))
      .map((v: any) => `[${v.verse_number}] ${v.text}`)
      .join(' ');

    clearSegmentSelection(segKey);
    router.push({
      pathname: '/devotions',
      query: {
        insert_verse: 'true',
        book: seg.book,
        chapter: seg.chapter,
        verse_start: start,
        verse_end: end,
        version: selectedVersion,
        text: combinedText,
      },
    });
  };

  // Open Compare translations modal
  const handleOpenCompare = async (seg: any) => {
    const segKey = `${seg.book}_${seg.chapter}`;
    const selVs = selectedVerses[segKey] || [];
    if (selVs.length === 0) return;

    setCompareRefInfo({ book: seg.book, chapter: seg.chapter, verses: selVs });
    setIsCompareModalOpen(true);
    setIsLoadingCompare(true);

    try {
      const downloaded = getDownloadedBibleVersions();
      const otherVersions = downloaded
        .filter((id: string) => id.toUpperCase() !== selectedVersion.toUpperCase());
      const versionsToCompare = otherVersions.length > 0 ? otherVersions : [selectedVersion];
      const res = await api.compareVerses(versionsToCompare, seg.book, seg.chapter, selVs);
      setCompareData(Array.isArray(res) ? res : res?.comparisons || []);
    } catch (err) {
      console.error('Compare error:', err);
      setCompareData([]);
    } finally {
      setIsLoadingCompare(false);
    }
  };

  // Share / Copy selected verses
  const handleShareVerses = async (seg: any) => {
    const segKey = `${seg.book}_${seg.chapter}`;
    const selVs = selectedVerses[segKey] || [];
    if (selVs.length === 0) return;
    const sorted = [...selVs].sort((a, b) => a - b);
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    const ref = `${seg.book} ${seg.chapter}:${start}${end !== start ? `-${end}` : ''} (${selectedVersion})`;
    const text = (seg.verses || [])
      .filter((v: any) => selVs.includes(v.verse_number))
      .map((v: any) => `${v.verse_number}. ${v.text}`)
      .join('\n');
    const content = `"${text}"\n— ${ref}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        setCopyFeedback('Copied scripture to clipboard!');
        setTimeout(() => setCopyFeedback(null), 2500);
      }
    } catch {}
    clearSegmentSelection(segKey);
  };

  // Filter portions list
  const filteredPortions = portions.filter((p) => {
    const matchesBook = selectedBook === 'all' || p.book.toLowerCase() === selectedBook.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.english_meaning.toLowerCase().includes(q) ||
      p.tagalog_meaning.toLowerCase().includes(q) ||
      p.torah_ref.toLowerCase().includes(q) ||
      p.prophet_ref.toLowerCase().includes(q) ||
      p.gospel_ref.toLowerCase().includes(q);
    return matchesBook && matchesQuery;
  });

  const activeSegmentData = readingsData?.readings?.[activeReadingTab];
  const segments = activeSegmentData?.segments || [];
  const currentSelectedVerses = activeSegKey ? selectedVerses[activeSegKey] || [] : [];
  const currentActiveSeg =
    currentSelectedVerses.length > 0
      ? segments.find((s: any) => `${s.book}_${s.chapter}` === activeSegKey)
      : null;

  return (
    <>
      <PageLayout
        title="Torah Portion (Parashat HaShavua)"
        items={[{ label: 'Torah', href: '/torah' }]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white p-6 sm:p-10 shadow-xl border border-stone-800">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
              <Scroll className="w-3.5 h-3.5" />
              Hebcal Live Torah Schedule
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Torah Portions & Scripture Cycle
            </h1>
            <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-serif">
              Read the weekly Triad of God's Word: the Torah (Law), the Prophets (Haftarah), and the Gospel (B'rit Chadashah) across Tagalog and English translations.
            </p>
          </div>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Current Week's Highlight Banner */}
        {thisWeek && (
          <section className="p-6 sm:p-8 rounded-3xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                  This Week's Portion
                </span>
                {thisWeek.hdate && (
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {thisWeek.hdate}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                  {thisWeek.name}
                </h2>
                {thisWeek.hebrew_name && (
                  <span className="text-xl sm:text-2xl font-serif text-amber-700 dark:text-amber-400" dir="rtl">
                    {thisWeek.hebrew_name}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                English: <span className="font-semibold text-stone-900 dark:text-stone-100">“{thisWeek.english_meaning}”</span> • Tagalog: <span className="font-semibold text-stone-900 dark:text-stone-100">“{thisWeek.tagalog_meaning}”</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPortionId(thisWeek.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  selectedPortionId === thisWeek.id
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/80 hover:bg-amber-50 dark:hover:bg-stone-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{selectedPortionId === thisWeek.id ? 'Currently Reading' : 'Read This Portion'}</span>
              </button>
            </div>
          </section>
        )}

        {/* Interactive Scripture Reading Suite */}
        <section className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
          {/* Reader Top Bar */}
          <div className="p-6 border-b border-stone-200/80 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Reading Portion
                </span>
                {selectedPortionData?.parashah_number && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-mono">
                    Parashah #{selectedPortionData.parashah_number}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {selectedPortionData?.name || thisWeek?.name}
                </h2>
                {selectedPortionData?.hebrew_name && (
                  <span className="text-lg font-serif text-amber-700 dark:text-amber-400" dir="rtl">
                    {selectedPortionData.hebrew_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                “{selectedPortionData?.english_meaning}” ({selectedPortionData?.tagalog_meaning})
              </p>
            </div>

            {/* Translation Selector for Torah Reader */}
            <div className="flex items-center space-x-2 self-start md:self-center">
              <span className="text-xs text-stone-500 font-medium">Bible Version:</span>
              <select
                value={selectedVersion}
                onChange={(e) => {
                  setSelectedVersion(e.target.value);
                  setCurrentVersion(e.target.value);
                }}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                {/* Tagalog Group */}
                {selectableTorahVersions.some((v: any) => v.language === 'tl') && (
                  <optgroup label="Tagalog Versions">
                    {selectableTorahVersions
                      .filter((v: any) => v.language === 'tl')
                      .map((ver: any) => (
                        <option key={ver.id} value={ver.id}>
                          {ver.name} ({ver.abbreviation || ver.id})
                        </option>
                      ))}
                  </optgroup>
                )}

                {/* English Group */}
                {selectableTorahVersions.some((v: any) => v.language !== 'tl') && (
                  <optgroup label="English Versions">
                    {selectableTorahVersions
                      .filter((v: any) => v.language !== 'tl')
                      .map((ver: any) => (
                        <option key={ver.id} value={ver.id}>
                          {ver.name} ({ver.abbreviation || ver.id})
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* 3 Triad Reading Tabs */}
          <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 p-2 gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setActiveReadingTab('torah');
                setSelectedVerses({});
                setActiveSegKey(null);
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeReadingTab === 'torah'
                  ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-md border border-amber-500/40 dark:border-amber-500/50 ring-1 ring-amber-500/20'
                  : 'bg-stone-200/70 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:white hover:bg-stone-200 dark:hover:bg-stone-800 border border-transparent dark:border-stone-800'
              }`}
            >
              <span className="text-sm">📜</span>
              <span>Torah (Law)</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                  activeReadingTab === 'torah'
                    ? 'bg-amber-500/20 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30'
                    : 'bg-stone-300/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300/60 dark:border-stone-700'
                }`}
              >
                {readingsData?.readings?.torah?.reference || selectedPortionData?.torah_ref}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveReadingTab('prophet');
                setSelectedVerses({});
                setActiveSegKey(null);
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeReadingTab === 'prophet'
                  ? 'bg-white dark:bg-stone-800 text-blue-700 dark:text-blue-400 shadow-md border border-blue-500/40 dark:border-blue-500/50 ring-1 ring-blue-500/20'
                  : 'bg-stone-200/70 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:white hover:bg-stone-200 dark:hover:bg-stone-800 border border-transparent dark:border-stone-800'
              }`}
            >
              <span className="text-sm">🎺</span>
              <span>Prophets (Haftarah)</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                  activeReadingTab === 'prophet'
                    ? 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-900 dark:text-blue-200 font-bold border border-blue-500/30'
                    : 'bg-stone-300/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300/60 dark:border-stone-700'
                }`}
              >
                {readingsData?.readings?.prophet?.reference || selectedPortionData?.prophet_ref}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveReadingTab('gospel');
                setSelectedVerses({});
                setActiveSegKey(null);
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeReadingTab === 'gospel'
                  ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-md border border-emerald-500/40 dark:border-emerald-500/50 ring-1 ring-emerald-500/20'
                  : 'bg-stone-200/70 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:white hover:bg-stone-200 dark:hover:bg-stone-800 border border-transparent dark:border-stone-800'
              }`}
            >
              <span className="text-sm">✝️</span>
              <span>Gospel (B'rit Chadashah)</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                  activeReadingTab === 'gospel'
                    ? 'bg-emerald-500/20 dark:bg-emerald-400/20 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-500/30'
                    : 'bg-stone-300/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300/60 dark:border-stone-700'
                }`}
              >
                {readingsData?.readings?.gospel?.reference || selectedPortionData?.gospel_ref}
              </span>
            </button>
          </div>

          {/* Verses Content View */}
          <div className="p-6 sm:p-8 min-h-[350px]">
            {isLoadingReadings ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-stone-400">Loading scripture verses...</p>
              </div>
            ) : !activeSegmentData || !activeSegmentData.segments || activeSegmentData.segments.length === 0 ? (
              <div className="py-16 text-center space-y-3 text-stone-400">
                <Scroll className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                  Scripture Reference: {activeSegmentData?.reference || 'None'}
                </p>
                <p className="text-xs text-stone-400">
                  Click 'Open in Bible Reader' below to read this passage directly.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {activeSegmentData.segments.map((seg: any, idx: number) => {
                  const segKey = `${seg.book}_${seg.chapter}`;
                  const isCollapsed = !!collapsedSegments[segKey];
                  const selVs = selectedVerses[segKey] || [];

                  return (
                    <div
                      key={idx}
                      className="space-y-4 rounded-2xl p-4 sm:p-5 bg-stone-50/50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800/80"
                    >
                      {/* Segment Header (Collapsible with Verse Count badge) */}
                      <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800 pb-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedSegments((prev) => ({
                                ...prev,
                                [segKey]: !prev[segKey],
                              }))
                            }
                            className="flex items-center gap-2 text-stone-700 dark:text-stone-200 hover:text-amber-600 transition-colors cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-stone-400" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-stone-400" />
                            )}
                            <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                              <span>{seg.reference}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-mono">
                                {selectedVersion}
                              </span>
                              {seg.verses && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                                  {seg.verses.length}v
                                </span>
                              )}
                            </h3>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenInReader(seg.book, seg.chapter)}
                          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Open in Reader</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Segment Verses (Rendered with Highlighting & Selection) */}
                      {!isCollapsed && (
                        <div>
                          {seg.verses && seg.verses.length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              {seg.verses.map((v: any) => {
                                const vRef = `${seg.book} ${seg.chapter}:${v.verse_number}`;
                                const isCopied = copiedVerse === vRef;
                                const isSelected = selVs.includes(v.verse_number);

                                // Find if this verse has an active highlight
                                const hl = highlights.find(
                                  (h) =>
                                    h.chapter === seg.chapter &&
                                    (h.book_name
                                      ? h.book_name.toLowerCase() === seg.book.toLowerCase()
                                      : true) &&
                                    v.verse_number >= h.verse_start &&
                                    v.verse_number <= h.verse_end
                                );
                                const highlightObj = hl
                                  ? HIGHLIGHT_COLORS.find((c) => c.id === hl.color)
                                  : null;

                                return (
                                  <div
                                    key={v.verse_number}
                                    onClick={() => toggleVerseSelection(segKey, v.verse_number)}
                                    style={{
                                      backgroundColor: isSelected
                                        ? undefined
                                        : highlightObj
                                        ? highlightObj.bg
                                        : undefined,
                                    }}
                                    className={`group flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-amber-100 dark:bg-amber-950/60 ring-2 ring-amber-500 shadow-xs'
                                        : highlightObj
                                        ? 'hover:opacity-90 dark:bg-opacity-20 border-l-4'
                                        : 'hover:bg-stone-100/70 dark:hover:bg-stone-800/40'
                                    }`}
                                    style-extra={highlightObj ? { borderLeftColor: highlightObj.dot } : undefined}
                                  >
                                    <span
                                      className={`text-xs font-bold font-mono w-6 shrink-0 pt-0.5 text-right ${
                                        isSelected
                                          ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                                          : highlightObj
                                          ? 'text-stone-700 dark:text-stone-300'
                                          : 'text-stone-400 dark:text-stone-500'
                                      }`}
                                    >
                                      {v.verse_number}
                                    </span>
                                    <p
                                      className={`font-serif text-base leading-relaxed flex-1 ${
                                        isSelected
                                          ? 'text-amber-950 dark:text-amber-100 font-medium'
                                          : highlightObj
                                          ? 'text-stone-900 dark:text-stone-100'
                                          : 'text-stone-800 dark:text-stone-200'
                                      }`}
                                    >
                                      {v.text}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyText(v.text, vRef);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-200/80 dark:hover:bg-stone-700 transition-all cursor-pointer shrink-0"
                                      title="Copy verse"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-stone-400">
                              Verses will appear here once loaded.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* All 54 Torah Portions Catalog & Browser */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Torah Cycle Catalog (54 Parashot)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Explore the complete annual readings across Genesis, Exodus, Leviticus, Numbers, and Deuteronomy.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Torah name, meaning, or verses..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Book Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {TORAH_BOOKS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBook(b.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedBook === b.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Portions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPortions.map((p) => {
              const isSelected = selectedPortionId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPortionId(p.id);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500 dark:border-amber-700 ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 hover:border-amber-500/40 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono">
                        #{p.parashah_number} • {p.book}
                      </span>
                      <span className="text-base font-serif text-amber-700 dark:text-amber-400 font-bold" dir="rtl">
                        {p.hebrew_name}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      {p.name}
                    </h3>

                    <div className="text-xs space-y-0.5 text-stone-600 dark:text-stone-300">
                      <p>
                        <span className="text-stone-400">EN:</span> “{p.english_meaning}”
                      </p>
                      <p>
                        <span className="text-stone-400">TL:</span> “{p.tagalog_meaning}”
                      </p>
                    </div>
                  </div>

                  {/* Readings Summary */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] space-y-1 font-sans">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 truncate">
                      <span className="font-sans font-bold text-[10px]">📜 Torah:</span>
                      <span className="truncate">{p.torah_ref}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 truncate">
                      <span className="font-sans font-bold text-[10px]">🎺 Prophet:</span>
                      <span className="truncate">{p.prophet_ref}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 truncate">
                      <span className="font-sans font-bold text-[10px]">✝️ Gospel:</span>
                      <span className="truncate">{p.gospel_ref}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <span>{isSelected ? 'Reading Now' : 'Read Portion'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Floating Selection Toolbar (Mobile Parity: Highlights & Actions) */}
      {currentSelectedVerses.length > 0 && currentActiveSeg && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200/80 dark:border-stone-800 p-3 px-5 max-w-sm w-[92%]">
          {/* Header / Selection Info */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {currentActiveSeg.book} {currentActiveSeg.chapter}:{currentSelectedVerses[0]}
              {currentSelectedVerses.length > 1 && `-${currentSelectedVerses[currentSelectedVerses.length - 1]}`}
              <span className="text-stone-400 font-normal ml-1">
                ({currentSelectedVerses.length} {currentSelectedVerses.length === 1 ? 'verse' : 'verses'})
              </span>
            </span>
            <button
              type="button"
              onClick={() => clearSegmentSelection(activeSegKey)}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color Highlight Dots */}
          <div className="flex items-center justify-between pb-3 pt-1 px-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => applyHighlight(currentActiveSeg, c.id)}
                title={`Highlight ${c.label}`}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
                style={{ backgroundColor: c.dot }}
              />
            ))}
            <button
              type="button"
              onClick={() => applyHighlight(currentActiveSeg, null)}
              title="Clear highlight"
              className="w-7 h-7 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <Slash className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons: Insight, Compare, Share / Copy */}
          <div className="grid grid-cols-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => handleAddToInsight(currentActiveSeg)}
              className="flex flex-col items-center justify-center gap-1 py-1 text-amber-600 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-600">Insight</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCompare(currentActiveSeg)}
              className="flex flex-col items-center justify-center gap-1 py-1 text-amber-600 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Columns className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-600">Compare</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareVerses(currentActiveSeg)}
              className="flex flex-col items-center justify-center gap-1 py-1 text-amber-600 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-600">Share / Copy</span>
            </button>
          </div>
        </div>
      )}

      {/* Compare Translations Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title={`Compare Translations (${(() => {
          if (!compareRefInfo || compareRefInfo.verses.length === 0) return '';
          const sorted = [...compareRefInfo.verses].sort((a, b) => a - b);
          if (sorted.length === 1) return `${compareRefInfo.book} ${compareRefInfo.chapter}:${sorted[0]}`;
          const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
          const range = isConsecutive ? `${sorted[0]}-${sorted[sorted.length - 1]}` : sorted.join(', ');
          return `${compareRefInfo.book} ${compareRefInfo.chapter}:${range}`;
        })()})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {isLoadingCompare ? (
            <div className="py-12 text-center space-y-2 text-stone-400 text-xs">
              <div className="w-6 h-6 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p>Fetching translation comparisons...</p>
            </div>
          ) : compareData.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
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
                      <span>{item.version_name || item.version_id} ({item.version_id})</span>
                      <span className="text-stone-400">{item.book} {item.chapter}:{verseRange}</span>
                    </div>
                    <p className="font-serif text-base text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                      {item.text || item.verse_text}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-400">
              No comparisons found for the selected verses.
            </div>
          )}
        </div>
      </Modal>

      {/* Sign In Required Prompt Modal */}
      <Modal
        isOpen={isLoginPromptModalOpen}
        onClose={() => setIsLoginPromptModalOpen(false)}
        title="Sign In Required"
      >
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Please sign in or create an account to highlight verses, save study insights, or compare translations.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              type="button"
              onClick={() => setIsLoginPromptModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoginPromptModalOpen(false);
                router.push('/profile');
              }}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </Modal>

      {/* Copied Feedback Toast */}
      {copyFeedback && (
        <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full text-xs font-semibold shadow-lg">
          {copyFeedback}
        </div>
      )}
    </>
  );
}
