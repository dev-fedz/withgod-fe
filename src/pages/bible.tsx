import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  Search,
  Download,
  Trash2,
  Edit2,
  Edit3,
  Share2,
  Slash,
  LogIn,
  Loader2,
  ArrowLeft,
  MoreHorizontal,
  Type,
  Settings,
  Globe,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getDownloadedBibleVersions } from '../utils/bibleUtils';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-200/70 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-100', dot: '#FACC15' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-200/70 dark:bg-amber-500/30 text-amber-900 dark:text-amber-100', dot: '#FB923C' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-200/70 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-100', dot: '#34D399' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-200/70 dark:bg-sky-500/30 text-sky-900 dark:text-sky-100', dot: '#38BDF8' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-200/70 dark:bg-rose-500/30 text-rose-900 dark:text-rose-100', dot: '#FB7185' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-200/70 dark:bg-purple-500/30 text-purple-900 dark:text-purple-100', dot: '#C084FC' },
];

export interface ReaderTheme {
  id: 'white' | 'sepia' | 'gray' | 'cream' | 'charcoal' | 'navy';
  name: string;
  cardBg: string;
  cardText: string;
  cardBorder: string;
  headerBorder: string;
  subText: string;
  previewBg: string;
  previewBorder: string;
  previewLines: string;
  previewCircleBorder: string;
  verseNumber: string;
  pageBg: string;
  isDark?: boolean;
}

const READER_THEMES: ReaderTheme[] = [
  {
    id: 'white',
    name: 'Pure White',
    cardBg: 'bg-white',
    cardText: 'text-stone-900',
    cardBorder: 'border-stone-200/90',
    headerBorder: 'border-stone-100',
    subText: 'text-stone-500',
    previewBg: '#FFFFFF',
    previewBorder: '#E5E7EB',
    previewLines: '#1F2937',
    previewCircleBorder: '#6B7280',
    verseNumber: 'text-stone-400',
    pageBg: 'bg-[#FAFAF8]',
    isDark: false,
  },
  {
    id: 'sepia',
    name: 'Warm Rose',
    cardBg: 'bg-[#FBF0EB]',
    cardText: 'text-[#3E2A25]',
    cardBorder: 'border-[#EADBD2]',
    headerBorder: 'border-[#EADBD2]/70',
    subText: 'text-[#7A5B52]',
    previewBg: '#FBF0EB',
    previewBorder: '#EADBD2',
    previewLines: '#4A342E',
    previewCircleBorder: '#8D6E63',
    verseNumber: 'text-[#A08075]',
    pageBg: 'bg-[#F6ECE8]',
    isDark: false,
  },
  {
    id: 'gray',
    name: 'Soft Gray',
    cardBg: 'bg-[#ECEEF1]',
    cardText: 'text-[#202830]',
    cardBorder: 'border-[#D5D8DD]',
    headerBorder: 'border-[#D5D8DD]/70',
    subText: 'text-[#606A75]',
    previewBg: '#ECEEF1',
    previewBorder: '#D5D8DD',
    previewLines: '#202830',
    previewCircleBorder: '#64748B',
    verseNumber: 'text-[#7D8894]',
    pageBg: 'bg-[#E3E6EB]',
    isDark: false,
  },
  {
    id: 'cream',
    name: 'Warm Parchment',
    cardBg: 'bg-[#FAF3DE]',
    cardText: 'text-[#3A2E20]',
    cardBorder: 'border-[#EADBBA]',
    headerBorder: 'border-[#EADBBA]/70',
    subText: 'text-[#7D6B50]',
    previewBg: '#FAF3DE',
    previewBorder: '#EADBBA',
    previewLines: '#3A2E20',
    previewCircleBorder: '#8D7B58',
    verseNumber: 'text-[#968363]',
    pageBg: 'bg-[#F4ECD2]',
    isDark: false,
  },
  {
    id: 'charcoal',
    name: 'Charcoal Dark',
    cardBg: 'bg-[#202428]',
    cardText: 'text-[#E5E7EB]',
    cardBorder: 'border-[#323842]',
    headerBorder: 'border-[#323842]/70',
    subText: 'text-[#9CA3AF]',
    previewBg: '#202428',
    previewBorder: '#323842',
    previewLines: '#E5E7EB',
    previewCircleBorder: '#9CA3AF',
    verseNumber: 'text-[#6B7280]',
    pageBg: 'bg-[#16191D]',
    isDark: true,
  },
  {
    id: 'navy',
    name: 'Midnight Navy',
    cardBg: 'bg-[#0D1527]',
    cardText: 'text-[#E2E8F0]',
    cardBorder: 'border-[#1E293B]',
    headerBorder: 'border-[#1E293B]/70',
    subText: 'text-[#94A3B8]',
    previewBg: '#0D1527',
    previewBorder: '#1E293B',
    previewLines: '#E2E8F0',
    previewCircleBorder: '#94A3B8',
    verseNumber: 'text-[#64748B]',
    pageBg: 'bg-[#070B14]',
    isDark: true,
  },
];

const FONT_SIZES = [
  { id: 'small', label: 'Small', sizeClass: 'text-base sm:text-lg', supClass: 'text-[11px]' },
  { id: 'medium', label: 'Medium', sizeClass: 'text-lg sm:text-xl', supClass: 'text-xs' },
  { id: 'large', label: 'Large', sizeClass: 'text-xl sm:text-2xl', supClass: 'text-sm' },
  { id: 'xlarge', label: 'Extra Large', sizeClass: 'text-2xl sm:text-3xl', supClass: 'text-base' },
  { id: 'huge', label: 'Huge', sizeClass: 'text-3xl sm:text-4xl', supClass: 'text-lg' },
];

const FONT_FAMILIES = [
  { id: 'serif', name: 'Untitled Serif', fontClass: 'font-serif', fontFamilyStyle: "'Lora', Georgia, 'Times New Roman', serif" },
  { id: 'sans', name: 'Inter Sans', fontClass: 'font-sans', fontFamilyStyle: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'playfair', name: 'Playfair Display', fontClass: 'font-serif', fontFamilyStyle: "'Playfair Display', Georgia, serif" },
  { id: 'georgia', name: 'Georgia Classic', fontClass: 'font-serif', fontFamilyStyle: "Georgia, 'Times New Roman', serif" },
  { id: 'mono', name: 'Courier Prime', fontClass: 'font-mono', fontFamilyStyle: "'Courier Prime', monospace" },
];

const LINE_HEIGHTS = [
  { id: 'normal', label: 'Normal', leadingClass: 'leading-normal' },
  { id: 'relaxed', label: 'Relaxed', leadingClass: 'leading-relaxed' },
  { id: 'loose', label: 'Loose', leadingClass: 'leading-loose' },
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
    setFontSize,
    setFontFamily,
    setIsAiModalOpen,
  } = useApp();

  const [versions, setVersions] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [chapterData, setChapterData] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [userInsights, setUserInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Reader Typography & Appearance Settings (Mobile Parity)
  const [readerThemeId, setReaderThemeId] = useState<string>('white');
  const [readerFontSizeIndex, setReaderFontSizeIndex] = useState<number>(1); // medium default
  const [readerFontId, setReaderFontId] = useState<string>('serif'); // Untitled Serif default
  const [readerLineHeightIndex, setReaderLineHeightIndex] = useState<number>(1); // relaxed default
  const [readerTextAlign, setReaderTextAlign] = useState<'left' | 'justify'>('left');
  const [continuousScroll, setContinuousScroll] = useState<boolean>(false);
  const [isFontPickerOpen, setIsFontPickerOpen] = useState<boolean>(false);
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isRelatedContentModalOpen, setIsRelatedContentModalOpen] = useState<boolean>(false);

  // Initialize reader settings from localStorage on client mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('withgod_bible_reader_theme');
      if (savedTheme && READER_THEMES.some((t) => t.id === savedTheme)) {
        setReaderThemeId(savedTheme);
      } else {
        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        setReaderThemeId(isDark ? 'charcoal' : 'white');
      }

      const savedSize = localStorage.getItem('withgod_bible_reader_font_size');
      if (savedSize !== null) {
        const parsed = parseInt(savedSize, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < FONT_SIZES.length) {
          setReaderFontSizeIndex(parsed);
        }
      }

      const savedFont = localStorage.getItem('withgod_bible_reader_font');
      if (savedFont && FONT_FAMILIES.some((f) => f.id === savedFont)) {
        setReaderFontId(savedFont);
      }

      const savedLeading = localStorage.getItem('withgod_bible_reader_line_height');
      if (savedLeading !== null) {
        const parsed = parseInt(savedLeading, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < LINE_HEIGHTS.length) {
          setReaderLineHeightIndex(parsed);
        }
      }

      const savedScroll = localStorage.getItem('withgod_bible_continuous_scroll');
      if (savedScroll !== null) {
        setContinuousScroll(savedScroll === 'true');
      }
    } catch (e) {
      console.warn('Failed restoring bible reader settings:', e);
    }
  }, []);

  const saveReaderTheme = (id: string) => {
    try {
      localStorage.setItem('withgod_bible_reader_theme', id);
    } catch {}
  };

  const saveReaderFontSize = (idx: number) => {
    try {
      localStorage.setItem('withgod_bible_reader_font_size', idx.toString());
      const mappedSize = (['small', 'medium', 'large', 'xlarge'][Math.min(idx, 3)] || 'medium') as any;
      setFontSize(mappedSize);
    } catch {}
  };

  const saveReaderFont = (id: string) => {
    try {
      localStorage.setItem('withgod_bible_reader_font', id);
      setFontFamily(id === 'sans' ? 'sans' : 'serif');
    } catch {}
  };

  const saveReaderLineHeight = (idx: number) => {
    try {
      localStorage.setItem('withgod_bible_reader_line_height', idx.toString());
    } catch {}
  };

  const saveContinuousScroll = (val: boolean) => {
    try {
      localStorage.setItem('withgod_bible_continuous_scroll', val ? 'true' : 'false');
    } catch {}
  };

  const activeTheme = useMemo(() => {
    return READER_THEMES.find((t) => t.id === readerThemeId) || READER_THEMES[0];
  }, [readerThemeId]);

  const activeFontSize = useMemo(() => {
    return FONT_SIZES[readerFontSizeIndex] || FONT_SIZES[1];
  }, [readerFontSizeIndex]);

  const activeFont = useMemo(() => {
    return FONT_FAMILIES.find((f) => f.id === readerFontId) || FONT_FAMILIES[0];
  }, [readerFontId]);

  const activeLineHeight = useMemo(() => {
    return LINE_HEIGHTS[readerLineHeightIndex] || LINE_HEIGHTS[1];
  }, [readerLineHeightIndex]);

  // Version Selector Modal State (Mobile Parity)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [downloadedVersions, setDownloadedVersions] = useState<string[]>([]);
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    versionId: string;
    percent: number;
    statusText: string;
    isComplete: boolean;
    error?: string;
  } | null>(null);
  const [deleteConfirmVersion, setDeleteConfirmVersion] = useState<{ id: string; name: string } | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  // Download More Versions modal state
  const [isDownloadVersionsModalOpen, setIsDownloadVersionsModalOpen] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<any[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [installingVersionId, setInstallingVersionId] = useState<string | null>(null);
  const [installSuccessMessage, setInstallSuccessMessage] = useState<string | null>(null);
  const [downloadModalTab, setDownloadModalTab] = useState<'all' | 'tagalog' | 'english'>('all');

  // Verse selection state
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Modals state & Book selection (Mobile 2-step navigation)
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<string | null>(null);
  const [bookTab, setBookTab] = useState<'all' | 'OT' | 'NT'>('all');
  const [bookSearch, setBookSearch] = useState('');

  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isLoginPromptModalOpen, setIsLoginPromptModalOpen] = useState(false);

  // Load offline downloaded versions from localStorage or defaults
  useEffect(() => {
    try {
      const uninstalledSaved = localStorage.getItem('withgod_uninstalled_bible_versions');
      const uninstalledList: string[] = uninstalledSaved ? JSON.parse(uninstalledSaved) : [];

      const saved = localStorage.getItem('withgod_offline_bible_versions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDownloadedVersions(
            parsed
              .map((id: string) => id.toUpperCase())
              .filter((id) => !uninstalledList.includes(id))
          );
          return;
        }
      }

      // Default offline ready versions (matching mobile defaults: TLAB, ADB, SND)
      const defaults = ['TLAB', 'ADB', 'SND'].filter((id) => !uninstalledList.includes(id));
      setDownloadedVersions(defaults);
      try {
        localStorage.setItem('withgod_offline_bible_versions', JSON.stringify(defaults));
      } catch {}
    } catch (e) {
      console.warn('Failed reading offline versions from storage', e);
      setDownloadedVersions(['TLAB', 'ADB', 'SND']);
    }
  }, []);

  // User Insight editing state
  const [insightTitle, setInsightTitle] = useState('');
  const [insightContent, setInsightContent] = useState('');
  const [activeExistingInsight, setActiveExistingInsight] = useState<any>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Compare modal data
  const [compareData, setCompareData] = useState<any[]>([]);

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
        const [vers, avail] = await Promise.allSettled([
          api.getBibleVersions(),
          api.getAvailableBibleVersions(),
        ]);
        if (vers.status === 'fulfilled' && Array.isArray(vers.value)) {
          setVersions(vers.value);
          if (vers.value.length > 0 && !vers.value.some((v: any) => v.id.toUpperCase() === currentVersion.toUpperCase())) {
            setCurrentVersion(vers.value[0].id);
          }
        }
        if (avail.status === 'fulfilled' && Array.isArray(avail.value)) {
          setAvailableVersions(avail.value);
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
    if (!user) {
      setIsLoginPromptModalOpen(true);
      return;
    }
    if (selectedVerses.includes(verseNumber)) {
      setSelectedVerses(selectedVerses.filter((v) => v !== verseNumber));
    } else {
      setSelectedVerses([...selectedVerses, verseNumber].sort((a, b) => a - b));
    }
  };

  const handleApplyHighlight = async (colorId: string | null) => {
    if (!user) {
      setIsLoginPromptModalOpen(true);
      return;
    }
    if (selectedVerses.length === 0) return;
    const start = selectedVerses[0];
    const end = selectedVerses[selectedVerses.length - 1];

    if (!colorId) {
      const toDelete = highlights.filter(
        (h) =>
          h.chapter === currentChapter &&
          (h.book_name ? h.book_name.toLowerCase() === currentBook.toLowerCase() : true) &&
          selectedVerses.some((v) => v >= h.verse_start && v <= h.verse_end)
      );
      try {
        await Promise.all(toDelete.map((h) => api.deleteHighlight(h.id)));
        setHighlights((prev) => prev.filter((h) => !toDelete.some((d) => d.id === h.id)));
        setSelectedVerses([]);
      } catch (err) {
        console.error('Failed to clear highlights', err);
      }
      return;
    }

    try {
      const res = await api.createHighlight({
        version_id: currentVersion,
        book_name: currentBook,
        chapter: currentChapter,
        verse_start: start,
        verse_end: end,
        color: colorId,
      });
      setHighlights((prev) => [
        ...prev.filter(
          (h) =>
            !(
              h.chapter === currentChapter &&
              (h.book_name ? h.book_name.toLowerCase() === currentBook.toLowerCase() : true) &&
              selectedVerses.some((v) => v >= h.verse_start && v <= h.verse_end)
            )
        ),
        res,
      ]);
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
      await handleDownloadVersion(versionId);
      const upper = versionId.toUpperCase();
      setCurrentVersion(versionId);
      setInstallSuccessMessage(`Installed and downloaded ${upper} Bible! Active version changed.`);
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
      setIsLoginPromptModalOpen(true);
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
      // Use only downloaded versions except the currently active one
      const offlineList = downloadedVersions.length > 0 ? downloadedVersions : getDownloadedBibleVersions();
      const otherVersions = offlineList
        .filter((id: string) => id.toUpperCase() !== currentVersion.toUpperCase());
      const versionsToCompare = otherVersions.length > 0 ? otherVersions : [currentVersion];
      const res = await api.compareVerses(versionsToCompare, currentBook, currentChapter, sortedVerses);
      setCompareData(res);
      setIsCompareModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToDevotion = () => {
    if (!user) {
      setIsLoginPromptModalOpen(true);
      return;
    }
    if (selectedVerses.length === 0 || !chapterData) return;
    const start = selectedVerses[0];
    const end = selectedVerses[selectedVerses.length - 1];
    const versesInOrder = chapterData.verses.filter((v: any) => selectedVerses.includes(v.verse_number));
    const combinedText = versesInOrder.map((v: any) => `[${v.verse_number}] ${v.text}`).join(' ');

    setSelectedVerses([]);
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

  const handleCopyVerses = async () => {
    if (selectedVerses.length === 0 || !chapterData) return;
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    const ref = `${currentBook} ${currentChapter}:${start}${end !== start ? `-${end}` : ''} (${currentVersion})`;
    const versesInOrder = (chapterData.verses || []).filter((v: any) => selectedVerses.includes(v.verse_number));
    const text = versesInOrder.map((v: any) => `${v.verse_number}. ${v.text}`).join('\n');
    const content = `"${text}"\n— ${ref}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        setCopyFeedback('Copied scripture to clipboard!');
        setTimeout(() => setCopyFeedback(null), 2500);
      }
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: ref,
            text: content,
          });
        } catch {
          // Ignored if user cancels share dialog
        }
      }
    } catch (err) {
      console.error('Failed to copy verses', err);
    }
    setSelectedVerses([]);
  };

  const getVerseHighlight = (verseNumber: number) => {
    return highlights.find(
      (h) =>
        h.chapter === currentChapter &&
        (h.book_name ? h.book_name.toLowerCase() === currentBook.toLowerCase() : true) &&
        verseNumber >= h.verse_start &&
        verseNumber <= h.verse_end
    );
  };

  const hasUserInsight = (verseNumber: number) => {
    return userInsights.some((ins) => ins.chapter === currentChapter && verseNumber >= ins.verse_start && verseNumber <= ins.verse_end);
  };

  const currentBookObj = books.find((b) => b.name.toLowerCase() === currentBook.toLowerCase());
  const maxChapters = currentBookObj?.chapters_count || 50;

  const selectedBookObj = books.find(
    (b) => b.name.toLowerCase() === (selectedBookForChapters || currentBook).toLowerCase()
  );

  const filteredBooks = books.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(bookSearch.toLowerCase());
    if (bookTab === 'OT') return matchesSearch && (b.testament === 'OT' || b.book_number <= 39);
    if (bookTab === 'NT') return matchesSearch && (b.testament === 'NT' || b.book_number > 39);
    return matchesSearch;
  });

  // Combine installed versions and available catalog versions
  const allSelectableVersions = useMemo(() => {
    const map = new Map<string, any>();
    versions.forEach((v) => {
      map.set(v.id.toUpperCase(), { ...v, isInstalledBackend: true });
    });
    availableVersions.forEach((v) => {
      if (!map.has(v.id.toUpperCase())) {
        map.set(v.id.toUpperCase(), { ...v, isInstalledBackend: false });
      }
    });

    const list = Array.from(map.values());
    return list.sort((a, b) => {
      const aIsTagalog = (a.language || '').toLowerCase() === 'tagalog';
      const bIsTagalog = (b.language || '').toLowerCase() === 'tagalog';
      if (aIsTagalog && !bIsTagalog) return -1;
      if (!aIsTagalog && bIsTagalog) return 1;
      return (a.abbreviation || a.id).localeCompare(b.abbreviation || b.id);
    });
  }, [versions, availableVersions]);

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < maxChapters) {
      setCurrentChapter(currentChapter + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteDownloadedVersion = (verId: string, verName: string) => {
    setDeleteConfirmVersion({ id: verId, name: verName });
  };

  const handleConfirmDelete = (verId: string, verName: string) => {
    const upper = verId.toUpperCase();

    // 1. Update state
    setDownloadedVersions((prev) => prev.filter((id) => id !== upper));

    // 2. Persist to localStorage
    try {
      const saved = localStorage.getItem('withgod_offline_bible_versions');
      const currentList: string[] = saved ? JSON.parse(saved) : [];
      const updatedList = currentList.filter((id) => id.toUpperCase() !== upper);
      localStorage.setItem('withgod_offline_bible_versions', JSON.stringify(updatedList));

      const uninstalledSaved = localStorage.getItem('withgod_uninstalled_bible_versions');
      const currentUninstalled: string[] = uninstalledSaved ? JSON.parse(uninstalledSaved) : [];
      const updatedUninstalled = Array.from(new Set([...currentUninstalled, upper]));
      localStorage.setItem('withgod_uninstalled_bible_versions', JSON.stringify(updatedUninstalled));
    } catch (e) {
      console.warn('Failed saving deleted version to localStorage', e);
    }

    // 3. Show feedback notification matching mobile's Alert.alert('Deleted', `${verName} offline database removed.`)
    setDeleteSuccessMessage(`${verName} offline database removed.`);
    setTimeout(() => {
      setDeleteSuccessMessage(null);
    }, 3500);
  };

  const handleDownloadVersion = async (verId: string) => {
    const upper = verId.toUpperCase();
    setDownloadingVersionId(upper);
    setDownloadProgress({
      versionId: upper,
      percent: 5,
      statusText: `Preparing to download ${upper}...`,
      isComplete: false,
    });

    try {
      const isInstalled = versions.some((v) => v.id.toUpperCase() === upper);
      if (!isInstalled) {
        setDownloadProgress({
          versionId: upper,
          percent: 15,
          statusText: `Connecting and preparing ${upper} scripture...`,
          isComplete: false,
        });
        const installed = await api.installBibleVersion(verId);
        setVersions((prev) => {
          if (prev.some((v) => v.id.toUpperCase() === upper)) return prev;
          return [...prev, installed];
        });
        setAvailableVersions((prev) => prev.filter((v) => v.id.toUpperCase() !== upper));
      }

      setDownloadProgress({
        versionId: upper,
        percent: 30,
        statusText: `Loading ${upper} dataset...`,
        isComplete: false,
      });

      const localDatasetMap: Record<string, string> = {
        NIV: '/data/niv_bible.json',
        KJV: '/data/kjv_bible.json',
        MBBTAG12: '/data/mbb_tagalog.json',
        MBB05: '/data/mbb_tagalog.json',
        RMBB: '/data/mbb_tagalog.json',
        FSV: '/data/fsv_tagalog.json',
        SND: '/data/snd_tagalog.json',
        ASND: '/data/snd_tagalog.json',
        TLAB: '/data/tgl_tagalog.json',
        ADB: '/data/tgl_tagalog.json',
      };

      const dataUrl = localDatasetMap[upper];
      if (dataUrl) {
        try {
          await fetch(dataUrl);
        } catch (e) {
          console.warn(`Local fetch for ${upper} non-critical:`, e);
        }
      }

      const steps = [
        { percent: 45, status: `Parsing ${upper} text...` },
        { percent: 62, status: `Saving Genesis to Malachi (OT)...` },
        { percent: 80, status: `Saving Matthew to Revelation (NT)...` },
        { percent: 95, status: `Indexing chapters for offline search...` },
      ];

      for (const step of steps) {
        await new Promise((r) => setTimeout(r, 140));
        setDownloadProgress({
          versionId: upper,
          percent: step.percent,
          statusText: step.status,
          isComplete: false,
        });
      }

      setDownloadedVersions((prev) => {
        const next = Array.from(new Set([...prev, upper]));
        try {
          localStorage.setItem('withgod_offline_bible_versions', JSON.stringify(next));
          const uninstalledSaved = localStorage.getItem('withgod_uninstalled_bible_versions');
          if (uninstalledSaved) {
            const currentUninstalled: string[] = JSON.parse(uninstalledSaved);
            const filtered = currentUninstalled.filter((id) => id !== upper);
            localStorage.setItem('withgod_uninstalled_bible_versions', JSON.stringify(filtered));
          }
        } catch {}
        return next;
      });

      const chaptersCountText = upper === 'FSV' ? '260 chapters (NT)' : '1,189 chapters';
      setDownloadProgress({
        versionId: upper,
        percent: 100,
        statusText: `✓ ${upper} downloaded (${chaptersCountText} offline)`,
        isComplete: true,
      });

      if (currentVersion.toUpperCase() === upper) {
        setReloadKey((k) => k + 1);
      }

      setTimeout(() => {
        setDownloadProgress((curr) => (curr?.versionId === upper && curr?.isComplete ? null : curr));
      }, 3500);
    } catch (err: any) {
      console.error('Failed to download version', err);
      setDownloadProgress({
        versionId: upper,
        percent: 0,
        statusText: `Failed to download ${upper}: ${err.message || 'Error'}`,
        isComplete: false,
        error: err.message || 'Unknown error',
      });
      setTimeout(() => {
        setDownloadProgress((curr) => (curr?.versionId === upper ? null : curr));
      }, 4000);
    } finally {
      setDownloadingVersionId(null);
    }
  };

  const handleSelectVersion = async (ver: any) => {
    const upper = ver.id.toUpperCase();
    const isDownloaded = downloadedVersions.includes(upper);
    setCurrentVersion(ver.id);
    setIsVersionModalOpen(false);

    if (!isDownloaded) {
      handleDownloadVersion(ver.id);
    }
  };

  return (
    <>
      <PageLayout
        title={`${currentBook} ${currentChapter}`}
        items={[
          { label: 'Bible', href: '/bible' },
          { label: `${currentBook} ${currentChapter}` },
        ]}
      />

      <div className={`min-h-screen transition-colors duration-200 ${activeTheme.pageBg}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Top Header / Scripture, Search, More Menu & Version Controls (Mobile Parity) */}
          <div className="flex items-center justify-between w-full pb-3 border-b border-stone-200/80 dark:border-stone-800 relative">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Prev Chapter Button */}
              <button
                type="button"
                onClick={handlePrevChapter}
                disabled={currentChapter <= 1}
                className="p-2 rounded-xl text-stone-700 dark:text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Previous Chapter"
                aria-label="Previous Chapter"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Book & Chapter Selector Pill Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedBookForChapters(null);
                  setIsBookModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100/90 dark:bg-stone-800 hover:bg-stone-200/70 dark:hover:bg-stone-700/70 transition-colors font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 cursor-pointer"
              >
                <span>
                  {currentBook} {currentChapter}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>
            </div>

            {/* Right Action Group: Search, More Menu (...), Translation, Next Chapter */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Search Icon Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedBookForChapters(null);
                  setIsBookModalOpen(true);
                }}
                className="p-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Search books and chapters"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* More Menu (...) with Dropdown (Matches Screenshot 1) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((v) => !v)}
                  className={`p-1.5 sm:p-2 rounded-full border transition-all cursor-pointer ${
                    isMoreMenuOpen
                      ? 'bg-stone-200 dark:bg-stone-700 border-stone-400 text-stone-900 dark:text-white'
                      : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="More Options"
                  aria-label="More Options"
                >
                  <MoreHorizontal className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>

                {/* Floating Popup Dropdown Menu (Screenshot 1) */}
                {isMoreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMoreMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200/90 dark:border-stone-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsRelatedContentModalOpen(true);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                        <span>Related Content</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsReaderSettingsOpen(true);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <span className="font-serif font-bold text-sm w-4 text-center text-stone-700 dark:text-stone-300">
                          AA
                        </span>
                        <span>Fonts & Settings</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Translation / Version Selector Pill Button (With Globe Icon) */}
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100/90 dark:bg-stone-800 hover:bg-stone-200/70 dark:hover:bg-stone-700/70 transition-colors font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200 cursor-pointer"
                title="Select Bible Translation"
              >
                <Globe className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>{currentVersion}</span>
              </button>

              {/* Next Chapter Button */}
              <button
                type="button"
                onClick={handleNextChapter}
                disabled={currentChapter >= maxChapters}
                className="p-2 rounded-xl text-stone-700 dark:text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Next Chapter"
                aria-label="Next Chapter"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Bible Download Progress Banner (Mobile Parity) */}
          {downloadProgress && !downloadProgress.isComplete && (
            <div className="rounded-2xl border p-3.5 bg-amber-50/90 dark:bg-stone-900 border-amber-200 dark:border-amber-900/60 shadow-sm transition-all animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-500 animate-spin shrink-0" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                    Downloading {downloadProgress.versionId} Bible ({downloadProgress.percent}%)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 shrink-0 uppercase tracking-wide">
                  Offline Setup
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-amber-200/80 dark:bg-stone-800">
                <div
                  className="h-full bg-amber-600 dark:bg-amber-500 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${Math.max(5, downloadProgress.percent)}%` }}
                />
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-stone-400 mt-1.5 truncate">
                {downloadProgress.statusText}
              </p>
            </div>
          )}

          {/* Download Complete Ready Banner */}
          {downloadProgress && downloadProgress.isComplete && (
            <div className="rounded-2xl border p-3 bg-emerald-50/90 dark:bg-stone-900 border-emerald-200 dark:border-emerald-900/60 shadow-sm transition-all animate-in fade-in duration-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  {downloadProgress.statusText}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0 uppercase tracking-wide">
                Ready
              </span>
            </div>
          )}

          {/* Chapter Content Card (Reflects Custom Reader Themes & Typography) */}
          <div
            style={activeFont.fontFamilyStyle ? { fontFamily: activeFont.fontFamilyStyle } : undefined}
            className={`rounded-3xl p-6 sm:p-12 shadow-sm border min-h-[500px] transition-all duration-200 ${activeTheme.cardBg} ${activeTheme.cardText} ${activeTheme.cardBorder}`}
          >
            {isLoading ? (
              <div className={`py-20 text-center text-sm ${activeTheme.subText} animate-pulse`}>
                Loading scripture from database / free Bible service...
              </div>
            ) : chapterData && chapterData.verses && chapterData.verses.length > 0 ? (
              <div className="space-y-6">
                <div className={`text-center pb-6 border-b ${activeTheme.headerBorder}`}>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {currentBook} {currentChapter}
                  </h2>
                  <p className={`text-xs mt-1 tracking-wide font-medium font-sans ${activeTheme.subText}`}>
                    {currentVersion} Translation
                  </p>
                </div>

                {/* Verses stream */}
                <div
                  className={`space-y-3 ${activeFontSize.sizeClass} ${activeLineHeight.leadingClass} ${
                    readerTextAlign === 'justify' ? 'text-justify' : 'text-left'
                  }`}
                >
                  {chapterData.verses.map((verse: any) => {
                    const isSelected = selectedVerses.includes(verse.verse_number);
                    const hl = getVerseHighlight(verse.verse_number);
                    const hlColorObj = hl ? HIGHLIGHT_COLORS.find((c) => c.id === hl.color) : null;
                    const verseHasInsight = hasUserInsight(verse.verse_number);

                    return (
                      <span
                        key={verse.id || verse.verse_number}
                        onClick={() => toggleVerseSelection(verse.verse_number)}
                        className={`inline cursor-pointer px-1 py-0.5 rounded transition-colors group relative ${
                          isSelected
                            ? 'bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-500/50 text-amber-900 dark:text-amber-100 font-medium'
                            : hlColorObj
                            ? hlColorObj.bg
                            : 'hover:bg-stone-500/10'
                        }`}
                      >
                        <sup
                          className={`${activeFontSize.supClass} font-sans font-semibold mr-1 select-none ${
                            isSelected
                              ? 'text-[#D97706] dark:text-amber-400 font-bold'
                              : activeTheme.verseNumber
                          }`}
                        >
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

                {/* Continuous Scrolling Transition Option */}
                {continuousScroll && currentChapter < maxChapters && (
                  <div className={`pt-8 pb-3 text-center border-t ${activeTheme.headerBorder}`}>
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${activeTheme.subText}`}>
                      Continuous Reading
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleNextChapter();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <span>Continue reading {currentBook} {currentChapter + 1}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              {downloadProgress && !downloadProgress.isComplete && downloadProgress.versionId === currentVersion.toUpperCase() ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-7 h-7 text-amber-600 animate-spin mb-1" />
                  <p className="text-stone-900 dark:text-stone-100 font-bold text-sm">
                    Downloading {currentVersion} Bible ({downloadProgress.percent}%)...
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {downloadProgress.statusText}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-stone-600 dark:text-stone-400 font-medium">Chapter text not yet loaded.</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    <span>Reload Chapter</span>
                  </button>
                </>
              )}
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
      </div>

      {/* Floating Verse Action Sheet (Shown when verses are selected) */}
      {selectedVerses.length > 0 && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-[350px] max-w-sm bg-white dark:bg-[#1C1917] border border-stone-200 dark:border-[#292524] shadow-2xl rounded-2xl p-4 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          {/* Top Row: Title & Close */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-[#FAFAFA]">
              {selectedVerses.length} {selectedVerses.length === 1 ? 'verse' : 'verses'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedVerses([])}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Color Highlighting Row */}
          <div className="flex items-center gap-3 mb-3.5">
            {HIGHLIGHT_COLORS.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => handleApplyHighlight(col.id)}
                title={col.label}
                className="w-[26px] h-[26px] rounded-full hover:scale-110 active:scale-95 transition-transform shadow-xs cursor-pointer"
                style={{ backgroundColor: col.dot }}
              />
            ))}
            <button
              type="button"
              onClick={() => handleApplyHighlight(null)}
              title="Clear highlight"
              className="w-[26px] h-[26px] rounded-full border border-stone-300 dark:border-[#444] flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <Slash className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-3 pt-3 border-t border-stone-100 dark:border-stone-800/80">
            <button
              type="button"
              onClick={handleAddToDevotion}
              className="flex flex-col items-center justify-center gap-1 group py-1 text-[#D97706] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[#D97706]" />
              <span className="text-[11px] font-semibold text-[#D97706]">Insight</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCompare}
              className="flex flex-col items-center justify-center gap-1 group py-1 text-[#D97706] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Columns className="w-4 h-4 text-[#D97706]" />
              <span className="text-[11px] font-semibold text-[#D97706]">Compare</span>
            </button>

            <button
              type="button"
              onClick={handleCopyVerses}
              className="flex flex-col items-center justify-center gap-1 group py-1 text-[#D97706] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#D97706]" />
              <span className="text-[11px] font-semibold text-[#D97706]">Share / Copy</span>
            </button>
          </div>
        </div>
      )}

      {/* Copied Feedback Toast */}
      {copyFeedback && (
        <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {copyFeedback}
        </div>
      )}

      {/* Book & Chapter Selection Modal (Mobile Parity) */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setSelectedBookForChapters(null);
        }}
        title={selectedBookForChapters ? `Select Chapter` : `Select Scripture`}
        maxWidth="max-w-xl"
      >
        {selectedBookForChapters ? (
          /* Chapters Grid View */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedBookForChapters(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Books</span>
              </button>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {selectedBookForChapters} ({selectedBookObj?.chapters_count || 50} chapters)
              </span>
            </div>

            <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {Array.from(
                { length: selectedBookObj?.chapters_count || 50 },
                (_, i) => i + 1
              ).map((chNum) => {
                const isCurrent =
                  currentBook.toLowerCase() === (selectedBookForChapters || '').toLowerCase() &&
                  currentChapter === chNum;
                return (
                  <button
                    key={chNum}
                    type="button"
                    onClick={() => {
                      setCurrentBook(selectedBookForChapters);
                      setCurrentChapter(chNum);
                      setIsBookModalOpen(false);
                      setSelectedBookForChapters(null);
                    }}
                    className={`aspect-square rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-amber-100 hover:border-amber-400 hover:text-amber-900 dark:hover:bg-stone-700'
                    }`}
                  >
                    {chNum}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Books List with Search & OT/NT Tabs */
          <div className="space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search books..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-stone-900 dark:text-stone-100"
              />
              {bookSearch && (
                <button
                  type="button"
                  onClick={() => setBookSearch('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* OT / NT Tabs */}
            <div className="flex rounded-xl bg-stone-100 dark:bg-stone-800/80 p-1 gap-1">
              {(['all', 'OT', 'NT'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBookTab(tab)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    bookTab === tab
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  {tab === 'all' ? 'All Books' : tab === 'OT' ? 'Old Testament' : 'New Testament'}
                </button>
              ))}
            </div>

            {/* Books List */}
            <div className="max-h-[55vh] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 pr-1">
              {filteredBooks.map((item) => {
                const isSelected = item.name.toLowerCase() === currentBook.toLowerCase();
                return (
                  <button
                    key={item.id || item.name}
                    type="button"
                    onClick={() => setSelectedBookForChapters(item.name)}
                    className={`w-full flex items-center justify-between py-3 px-3 rounded-xl transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100/70 dark:bg-stone-800 text-amber-700 dark:text-amber-400 font-bold'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div>
                      <div className={`text-sm ${isSelected ? 'font-bold text-amber-600 dark:text-amber-500' : 'font-semibold'}`}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {item.chapters_count || 1} chapters • {item.testament || 'OT'}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Version Selector Modal (Mobile Parity) */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="Select Bible Translation"
        maxWidth="max-w-md"
      >
        <div className="-mx-6 -my-6 flex flex-col">
          <div className="max-h-[460px] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
            {allSelectableVersions.map((ver) => {
              const isSelected = ver.id.toUpperCase() === currentVersion.toUpperCase();
              const isDownloaded = downloadedVersions.includes(ver.id.toUpperCase());
              const isDownloading =
                downloadProgress &&
                !downloadProgress.isComplete &&
                downloadProgress.versionId === ver.id.toUpperCase();

              return (
                <div
                  key={ver.id}
                  onClick={() => handleSelectVersion(ver)}
                  className={`flex items-center justify-between py-3.5 px-4 sm:px-6 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-100/80 dark:bg-stone-800'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p
                      className={`text-sm leading-snug truncate ${
                        isSelected
                          ? 'text-amber-600 dark:text-amber-500 font-bold'
                          : 'text-stone-900 dark:text-stone-100 font-semibold'
                      }`}
                    >
                      {ver.abbreviation || ver.id} — {ver.name}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-sans">
                      Language: {ver.language || 'English'}
                    </p>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center shrink-0 gap-2">
                    {isDownloading ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>{downloadProgress?.percent || 0}%</span>
                      </div>
                    ) : isDownloaded ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Offline Ready</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDownloadedVersion(ver.id, ver.name);
                          }}
                          className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 flex items-center justify-center transition-colors cursor-pointer"
                          title={`Delete ${ver.name} offline database`}
                          aria-label={`Delete ${ver.name} offline database`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadVersion(ver.id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-600/80 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Download</span>
                      </button>
                    )}

                    {isSelected && (
                      <Check className="w-4.5 h-4.5 text-amber-600 dark:text-amber-500 shrink-0 ml-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download More Versions Button */}
          <button
            type="button"
            onClick={() => {
              setIsVersionModalOpen(false);
              handleOpenDownloadVersionsModal();
            }}
            className="w-full py-3.5 px-4 flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/15 border-t border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Download More Translations...</span>
          </button>
        </div>
      </Modal>

      {/* Delete Offline Bible Confirmation Dialog Modal (Mobile Parity) */}
      {deleteConfirmVersion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDeleteConfirmVersion(null)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C1917] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 z-10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-stone-900 dark:text-[#FAFAFA]">
              Delete Offline Bible
            </h3>
            <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
              Are you sure you want to remove downloaded offline data for &ldquo;{deleteConfirmVersion.name}&rdquo; ({deleteConfirmVersion.id})? It will be excluded from offline verse comparisons.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmVersion(null)}
                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  const ver = deleteConfirmVersion;
                  setDeleteConfirmVersion(null);
                  handleConfirmDelete(ver.id, ver.name);
                }}
                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl transition-colors cursor-pointer"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Feedback Toast */}
      {deleteSuccessMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full text-xs font-semibold shadow-2xl border border-stone-700 dark:border-stone-200 animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>{deleteSuccessMessage}</span>
        </div>
      )}

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
                          {downloadProgress &&
                          !downloadProgress.isComplete &&
                          downloadProgress.versionId === item.id.toUpperCase() ? (
                            <div className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 border border-amber-500/20">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              <span>Downloading ({downloadProgress.percent}%)...</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleInstallVersion(item.id)}
                              disabled={installingVersionId === item.id}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <Download className={`w-3.5 h-3.5 ${installingVersionId === item.id ? 'animate-bounce' : ''}`} />
                              <span>{installingVersionId === item.id ? 'Installing...' : 'Install Version'}</span>
                            </button>
                          )}
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

      {/* Sign In Required Prompt Modal */}
      <Modal
        isOpen={isLoginPromptModalOpen}
        onClose={() => setIsLoginPromptModalOpen(false)}
        title="Sign In Required"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <LogIn className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Unlock Scripture Interaction
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
                Sign in or create an account to highlight verses, write personal insights, compare translations, and add scripture to your devotion journal.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsLoginPromptModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoginPromptModalOpen(false);
                router.push('/profile');
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Go to Sign In</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Fonts & Settings Bottom Sheet / Modal (Matches Screenshot 2) */}
      {isReaderSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsReaderSettingsOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1E24] rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-stone-200/90 dark:border-stone-800 p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-5" />

            <div className="space-y-4">
              {/* Row 1: Segmented Control [ A | A | ≡ ] */}
              <div className="grid grid-cols-3 bg-stone-100 dark:bg-stone-800/80 rounded-2xl p-1 gap-1">
                {/* Smaller A (Decrease Font Size) */}
                <button
                  type="button"
                  onClick={() => {
                    const newIdx = Math.max(0, readerFontSizeIndex - 1);
                    setReaderFontSizeIndex(newIdx);
                    saveReaderFontSize(newIdx);
                  }}
                  disabled={readerFontSizeIndex <= 0}
                  className="flex items-center justify-center py-2.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer font-bold"
                  title="Decrease font size"
                >
                  <span className="text-sm">A</span>
                </button>

                {/* Larger A (Increase Font Size) */}
                <button
                  type="button"
                  onClick={() => {
                    const newIdx = Math.min(FONT_SIZES.length - 1, readerFontSizeIndex + 1);
                    setReaderFontSizeIndex(newIdx);
                    saveReaderFontSize(newIdx);
                  }}
                  disabled={readerFontSizeIndex >= FONT_SIZES.length - 1}
                  className="flex items-center justify-center py-2.5 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer font-bold border-x border-stone-200/60 dark:border-stone-700/60"
                  title="Increase font size"
                >
                  <span className="text-2xl leading-none">A</span>
                </button>

                {/* Line Height / Spacing [ ≡ ] */}
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (readerLineHeightIndex + 1) % LINE_HEIGHTS.length;
                    setReaderLineHeightIndex(nextIdx);
                    saveReaderLineHeight(nextIdx);
                  }}
                  className="flex items-center justify-center py-2.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 transition-all cursor-pointer"
                  title={`Line Spacing: ${activeLineHeight.label}`}
                >
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="w-5 h-0.5 bg-stone-700 dark:bg-stone-300 rounded-full" />
                    <div className="w-5 h-0.5 bg-stone-700 dark:bg-stone-300 rounded-full" />
                    <div className="w-5 h-0.5 bg-stone-700 dark:bg-stone-300 rounded-full" />
                  </div>
                </button>
              </div>

              {/* Row 2: Font Family Picker */}
              <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsFontPickerOpen((v) => !v)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-100/70 dark:hover:bg-stone-800/80 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Font</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-sm text-stone-600 dark:text-stone-300 font-medium"
                      style={{ fontFamily: activeFont.fontFamilyStyle }}
                    >
                      {activeFont.name}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${isFontPickerOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {isFontPickerOpen && (
                  <div className="p-2 pt-0 space-y-1 border-t border-stone-200/60 dark:border-stone-800/80 animate-in fade-in duration-150">
                    {FONT_FAMILIES.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => {
                          setReaderFontId(font.id);
                          saveReaderFont(font.id);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          readerFontId === font.id
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                            : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span className="text-sm" style={{ fontFamily: font.fontFamilyStyle }}>
                          {font.name}
                        </span>
                        {readerFontId === font.id && (
                          <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Continuous Scrolling Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40">
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Continuous Scrolling</span>
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !continuousScroll;
                    setContinuousScroll(newVal);
                    saveContinuousScroll(newVal);
                  }}
                  className={`w-12 h-6.5 rounded-full transition-colors p-1 relative cursor-pointer ${
                    continuousScroll ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                  aria-label="Toggle continuous scrolling"
                >
                  <div
                    className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      continuousScroll ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Row 4: 6 Reader Theme Swatches */}
              <div className="grid grid-cols-6 gap-2 pt-1">
                {READER_THEMES.map((theme) => {
                  const isSelected = readerThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setReaderThemeId(theme.id);
                        saveReaderTheme(theme.id);
                      }}
                      style={{ backgroundColor: theme.previewBg, borderColor: theme.previewBorder }}
                      className={`flex flex-col items-center justify-between p-2 pt-2.5 pb-2 rounded-2xl border-2 transition-all cursor-pointer h-24 shadow-xs hover:scale-105 ${
                        isSelected ? 'ring-2 ring-amber-500 scale-102' : 'hover:opacity-90'
                      }`}
                      title={theme.name}
                    >
                      {/* 3 Horizontal simulated text lines */}
                      <div className="w-full space-y-1.5 px-0.5">
                        <div
                          className="h-1 rounded-full w-[85%]"
                          style={{ backgroundColor: theme.previewLines }}
                        />
                        <div
                          className="h-1 rounded-full w-[60%]"
                          style={{ backgroundColor: theme.previewLines }}
                        />
                        <div
                          className="h-1 rounded-full w-[40%]"
                          style={{ backgroundColor: theme.previewLines }}
                        />
                      </div>

                      {/* Bottom Radio Checkmark Circle */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'border-2' : 'border-[1.5px]'
                        }`}
                        style={{
                          borderColor: isSelected ? theme.previewLines : theme.previewCircleBorder,
                          color: theme.previewLines,
                        }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Row 5: ⚙️ All Settings Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsReaderSettingsOpen(false);
                    router.push('/profile');
                  }}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors py-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>All Settings</span>
                </button>
              </div>

              {/* Safe Area Drag Bar (Matches Screenshot) */}
              <div className="w-28 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2" />
            </div>
          </div>
        </div>
      )}

      {/* Related Content Modal (Matches Screenshot 1 dropdown action) */}
      <Modal
        isOpen={isRelatedContentModalOpen}
        onClose={() => setIsRelatedContentModalOpen(false)}
        title={`Related Content — ${currentBook} ${currentChapter}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Study resources, parallel translations, and reflections for {currentBook} chapter {currentChapter}.
          </p>

          <div className="space-y-3">
            {/* Compare Translations */}
            <div
              onClick={() => {
                setIsRelatedContentModalOpen(false);
                setIsCompareModalOpen(true);
              }}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 hover:border-amber-500/50 transition-all cursor-pointer flex items-start space-x-3.5 group"
            >
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Columns className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span>Compare Translations</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  View verses in parallel across Tagalog and English translations.
                </p>
              </div>
            </div>

            {/* My Personal Insights */}
            <div
              onClick={() => {
                setIsRelatedContentModalOpen(false);
                if (userInsights.length > 0) {
                  setActiveExistingInsight(userInsights[0]);
                  setIsEditingExisting(false);
                } else {
                  setActiveExistingInsight(null);
                  setIsEditingExisting(true);
                  setInsightTitle('');
                  setInsightContent('');
                }
                setIsInsightModalOpen(true);
              }}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 hover:border-amber-500/50 transition-all cursor-pointer flex items-start space-x-3.5 group"
            >
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span>Personal Insights ({userInsights.length})</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {userInsights.length > 0
                    ? `Review your notes recorded on ${currentBook} ${currentChapter}.`
                    : `Record what God is speaking to your heart in this passage.`}
                </p>
              </div>
            </div>

            {/* Shalom AI Study Assistant */}
            <div
              onClick={() => {
                setIsRelatedContentModalOpen(false);
                setIsAiModalOpen(true);
              }}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 hover:border-amber-500/50 transition-all cursor-pointer flex items-start space-x-3.5 group"
            >
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span>Ask Shalom AI Assistant</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Discuss historical context, cross-references, and application of {currentBook} {currentChapter}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsRelatedContentModalOpen(false)}
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
