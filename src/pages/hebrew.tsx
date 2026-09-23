import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Languages,
  BookOpen,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  Search,
  RotateCcw,
  Trophy,
  ArrowRight,
  Flame,
  Check,
  ChevronRight,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Words' },
  { id: 'names_of_god', label: "God's Names" },
  { id: 'theological', label: 'Theological Roots' },
  { id: 'worship', label: 'Worship & Prayer' },
  { id: 'verbs', label: 'Biblical Verbs' },
  { id: 'common', label: 'Everyday Greetings' },
  { id: 'family', label: 'Family' },
];

const NIKKUD_GUIDE = [
  { sign: 'ָ', name: 'Qamats', sound: "'ah' as in father", example: 'בָּ', exampleName: 'Bah' },
  { sign: 'ַ', name: 'Patach', sound: "'ah' as in car", example: 'בַּ', exampleName: 'Bah' },
  { sign: 'ֵ', name: 'Tsere', sound: "'ay' as in hey", example: 'בֵּ', exampleName: 'Bay' },
  { sign: 'ֶ', name: 'Segol', sound: "'eh' as in red", example: 'בֶּ', exampleName: 'Beh' },
  { sign: 'ִ', name: 'Hireq', sound: "'ee' as in see", example: 'בִּ', exampleName: 'Bee' },
  { sign: 'ֹ', name: 'Holam', sound: "'oh' as in boat", example: 'בֹּ', exampleName: 'Boh' },
  { sign: 'ֻ', name: 'Qubuts', sound: "'oo' as in boot", example: 'בֻּ', exampleName: 'Boo' },
  { sign: 'ְ', name: 'Sheva', sound: "Vocal 'eh' or silent stop", example: 'בְּ', exampleName: "B' (in/with)" },
];

export default function LearnHebrew() {
  const router = useRouter();
  const { user } = useApp();

  const [activeTab, setActiveTab] = useState<'alphabet' | 'vocabulary' | 'grammar' | 'quiz'>('alphabet');

  // Alphabet state
  const [letters, setLetters] = useState<any[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);

  // Vocabulary state
  const [words, setWords] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWordDetail, setSelectedWordDetail] = useState<any>(null);

  // Grammar & Sentences state
  const [lessons, setLessons] = useState<any[]>([]);
  const [sentences, setSentences] = useState<any[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [userConstructedTokens, setUserConstructedTokens] = useState<string[]>([]);
  const [sentenceValidationResult, setSentenceValidationResult] = useState<'correct' | 'incorrect' | null>(null);

  // Quiz state
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotalAnswered, setQuizTotalAnswered] = useState(0);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState<any>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // Progress state
  const [progress, setProgress] = useState<any>({
    completed_lessons: [],
    mastered_words: [],
    quiz_score: 0,
    streak_days: 1,
  });

  // Audio Speech Synthesis
  const speakHebrew = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const loadHebrewData = async () => {
      try {
        const [lettersRes, wordsRes, lessonsRes, sentencesRes, progressRes] = await Promise.allSettled([
          api.getHebrewAlphabet(),
          api.getHebrewWords(),
          api.getHebrewLessons(),
          api.getHebrewSentences(),
          api.getHebrewProgress(),
        ]);

        if (lettersRes.status === 'fulfilled' && Array.isArray(lettersRes.value)) setLetters(lettersRes.value);
        if (wordsRes.status === 'fulfilled' && Array.isArray(wordsRes.value)) setWords(wordsRes.value);
        if (lessonsRes.status === 'fulfilled' && Array.isArray(lessonsRes.value)) setLessons(lessonsRes.value);
        if (sentencesRes.status === 'fulfilled' && Array.isArray(sentencesRes.value)) setSentences(sentencesRes.value);
        if (progressRes.status === 'fulfilled') setProgress(progressRes.value);
      } catch (err) {
        console.error('Error loading Hebrew data:', err);
      }
    };
    loadHebrewData();
  }, [router.asPath]);

  // Filter words
  const filteredWords = words.filter((w) => {
    const matchCat = selectedCategory === 'all' || w.category === selectedCategory;
    const matchSearch =
      !searchTerm ||
      w.hebrew.includes(searchTerm) ||
      w.transliteration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.root && w.root.includes(searchTerm));
    return matchCat && matchSearch;
  });

  // Generate Quiz Question
  const generateNewQuestion = () => {
    if (words.length < 4) return;
    const randomIndex = Math.floor(Math.random() * words.length);
    const correctWord = words[randomIndex];

    // Pick 3 random wrong options
    const wrongWords = words.filter((w) => w.hebrew !== correctWord.hebrew).sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [correctWord, ...wrongWords].sort(() => 0.5 - Math.random());

    setCurrentQuizQuestion({
      targetWord: correctWord,
      options,
      correctIndex: options.findIndex((o) => o.hebrew === correctWord.hebrew),
    });
    setSelectedQuizOption(null);
    setIsAnswerSubmitted(false);
  };

  useEffect(() => {
    if (activeTab === 'quiz' && !currentQuizQuestion && words.length >= 4) {
      generateNewQuestion();
    }
  }, [activeTab, words, currentQuizQuestion]);

  const handleSelectQuizAnswer = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedQuizOption(idx);
    setIsAnswerSubmitted(true);
    setQuizTotalAnswered((prev) => prev + 1);

    const isCorrect = idx === currentQuizQuestion.correctIndex;
    if (isCorrect) {
      setQuizScore((prev) => prev + 10);
      speakHebrew(currentQuizQuestion.targetWord.hebrew);
      api.updateHebrewProgress({ quiz_score: 10, word_id: currentQuizQuestion.targetWord.hebrew }).catch(() => {});
    }
  };

  // Sentence Builder Handlers
  const currentSentence = sentences[activeSentenceIndex] || null;

  const handleAddTokenToSentence = (tokenHebrew: string) => {
    setUserConstructedTokens([...userConstructedTokens, tokenHebrew]);
    setSentenceValidationResult(null);
  };

  const handleRemoveTokenFromSentence = (indexToRemove: number) => {
    setUserConstructedTokens(userConstructedTokens.filter((_, idx) => idx !== indexToRemove));
    setSentenceValidationResult(null);
  };

  const handleCheckSentence = () => {
    if (!currentSentence) return;
    const expectedTokens = currentSentence.breakdown.map((b: any) => b.hebrew);
    const isCorrect =
      userConstructedTokens.length === expectedTokens.length &&
      userConstructedTokens.every((token, idx) => token === expectedTokens[idx]);

    setSentenceValidationResult(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      speakHebrew(currentSentence.hebrew);
      api.updateHebrewProgress({ lesson_slug: `sentence-${activeSentenceIndex + 1}` }).catch(() => {});
    }
  };

  const handleResetSentence = () => {
    setUserConstructedTokens([]);
    setSentenceValidationResult(null);
  };

  return (
    <>
      <PageLayout
        title="Learn Biblical & Modern Hebrew"
        items={[{ label: 'Learn Hebrew' }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Hero Banner with Hebrew Spiritual Meaning */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-6 sm:p-10 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Language of Scripture & Covenant</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight">
              Learn Biblical Hebrew
            </h1>
            <p className="text-sm sm:text-base text-amber-100 font-sans leading-relaxed">
              Understand God&apos;s holy words in their original tongue. Master the Alef-Bet, explore covenant word roots, contract prepositions, and build sentences from right to left.
            </p>

            {/* Quick Stats */}
            <div className="pt-3 flex items-center gap-6 text-xs font-semibold text-amber-50">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-200" />
                <span>Score: {quizScore + (progress.quiz_score || 0)} pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Streak: {progress.streak_days || 1} Day</span>
              </div>
            </div>
          </div>

          {/* Decorative Hebrew Script in Background */}
          <div
            className="absolute -right-6 -bottom-8 select-none pointer-events-none opacity-15 text-8xl sm:text-9xl font-serif font-black"
            dir="rtl"
          >
            אֱלֹהִים שָׁלוֹם
          </div>
        </div>

        {/* Primary Tabs */}
        <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('alphabet')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'alphabet'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>1. The Alef-Bet & Writing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vocabulary')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'vocabulary'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Words & Roots ({words.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grammar')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'grammar'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>3. Sentence Contractions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'quiz'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>4. Practice & Quiz</span>
          </button>
        </div>

        {/* TAB 1: ALEF-BET & WRITING */}
        {activeTab === 'alphabet' && (
          <div className="space-y-8">
            {/* Guide Info */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                How to Read & Write Hebrew (Right to Left)
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                Hebrew is an abjad written and read from <strong>Right to Left (RTL)</strong>. It contains 22 consonant letters, plus 5 letters that change shape when they appear at the end of a word (*Sofit*). Vowels are indicated by small dots and dashes called <strong>Nikkud</strong> placed above, below, or inside letters.
              </p>
            </div>

            {/* Alphabet Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" dir="rtl">
              {letters.map((l) => (
                <div
                  key={l.order}
                  onClick={() => {
                    setSelectedLetter(l);
                    setIsLetterModalOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/70 dark:hover:border-amber-500/70 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center space-y-1"
                >
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {l.letter}
                  </span>
                  <div className="space-y-0.5" dir="ltr">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                      {l.name}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      {l.transliteration}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">
                      Val: {l.gematria}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Nikkud (Vowel Points) Reference */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                Vowel Signs Guide (Nikkud נִקּוּד)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                In Biblical texts, vowel markings are placed around letters to indicate exact pronunciation. Shown below on the letter Bet (ב):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {NIKKUD_GUIDE.map((n, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                        {n.example}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakHebrew(n.example)}
                        className="p-1 rounded-lg text-stone-400 hover:text-amber-600"
                        title="Pronounce"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">{n.name}</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block">{n.sound}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOCABULARY & ROOTS */}
        {activeTab === 'vocabulary' && (
          <div className="space-y-6">
            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Hebrew, English, or root..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Word Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWords.map((word, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100" dir="rtl">
                        {word.hebrew}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakHebrew(word.hebrew)}
                        className="p-2 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        title="Listen to Hebrew pronunciation"
                      >
                        <Volume2 className="w-4 h-4 text-amber-500" />
                      </button>
                    </div>

                    <div>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 block">
                        {word.transliteration}
                      </span>
                      <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 mt-0.5 leading-snug">
                        {word.meaning}
                      </p>
                    </div>

                    {word.root && (
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                        <span className="font-semibold text-stone-500">Root (Shoresh):</span>
                        <span className="font-serif text-xs font-bold text-stone-700 dark:text-stone-300" dir="rtl">
                          {word.root}
                        </span>
                      </div>
                    )}
                  </div>

                  {word.example_verse_ref && (
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Scripture Reference: {word.example_verse_ref}
                      </span>
                      {word.example_verse_hebrew && (
                        <p className="font-serif text-xs text-stone-800 dark:text-stone-200 leading-relaxed" dir="rtl">
                          {word.example_verse_hebrew}
                        </p>
                      )}
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                        “{word.example_verse_english}”
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SENTENCE CONTRACTIONS & GRAMMAR */}
        {activeTab === 'grammar' && (
          <div className="space-y-8">
            {/* Interactive Sentence Builder */}
            {currentSentence && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      Interactive Sentence Builder (Right-to-Left)
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                      Construct: &ldquo;{currentSentence.translation}&rdquo;
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSentenceIndex((prev) => (prev > 0 ? prev - 1 : sentences.length - 1));
                        handleResetSentence();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSentenceIndex((prev) => (prev + 1) % sentences.length);
                        handleResetSentence();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Construction Workspace (RTL dropzone) */}
                <div className="p-4 sm:p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 min-h-[90px] flex items-center justify-center">
                  {userConstructedTokens.length === 0 ? (
                    <span className="text-xs text-stone-400 italic">
                      Click the word blocks below in Right-to-Left order to build the sentence.
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 justify-center" dir="rtl">
                      {userConstructedTokens.map((token, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleRemoveTokenFromSentence(idx)}
                          className="px-3 py-2 rounded-xl bg-amber-500 text-white text-base font-serif font-bold shadow-sm hover:bg-rose-500 transition-colors flex items-center gap-1.5 group"
                          title="Click to remove"
                        >
                          <span>{token}</span>
                          <span className="text-[10px] text-amber-200 group-hover:text-white">✕</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scrambled Word Chips to Click */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block">Available Word Blocks:</span>
                  <div className="flex flex-wrap items-center gap-2" dir="rtl">
                    {currentSentence.breakdown
                      .map((b: any) => b.hebrew)
                      .sort(() => 0.5 - Math.sin(activeSentenceIndex))
                      .map((token: string, idx: number) => {
                        const countInSentence = userConstructedTokens.filter((t) => t === token).length;
                        const totalAllowed = currentSentence.breakdown.filter((b: any) => b.hebrew === token).length;
                        const isUsed = countInSentence >= totalAllowed;

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={isUsed}
                            onClick={() => handleAddTokenToSentence(token)}
                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-base sm:text-lg font-serif font-bold text-stone-800 dark:text-stone-100 hover:border-amber-500 hover:text-amber-600 disabled:opacity-30 disabled:pointer-events-none shadow-sm transition-all"
                          >
                            {token}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Actions & Feedback */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={handleResetSentence}
                    className="flex items-center gap-1 text-xs font-semibold text-stone-400 hover:text-stone-600"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {sentenceValidationResult === 'correct' && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Correct! Mazal Tov!
                      </span>
                    )}
                    {sentenceValidationResult === 'incorrect' && (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Incorrect order. Try again.
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleCheckSentence}
                      disabled={userConstructedTokens.length === 0}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                      Check Sentence
                    </button>
                  </div>
                </div>

                {/* Sentence Grammatical Breakdown */}
                {sentenceValidationResult === 'correct' && currentSentence.grammar_notes && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                    <span className="font-bold block">💡 Grammatical Insight:</span>
                    <p className="font-sans leading-relaxed">{currentSentence.grammar_notes}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      {currentSentence.breakdown.map((b: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-white/70 dark:bg-stone-900/70 border border-amber-200/60 dark:border-amber-900/60">
                          <span className="font-serif font-bold text-sm block" dir="rtl">{b.hebrew}</span>
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 block">{b.transliteration} ({b.gloss})</span>
                          <span className="text-[10px] text-stone-500 block">{b.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Grammar & Contraction Explanatory Lessons */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                Hebrew Contraction & Grammar Rules
              </h3>

              {lessons.map((lesson) => (
                <div
                  key={lesson.slug}
                  className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                      {lesson.title}
                    </h4>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                      {lesson.topic}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                    {lesson.explanation}
                  </p>

                  {lesson.formula && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-serif font-bold text-amber-700 dark:text-amber-300">
                      Formula: {lesson.formula}
                    </div>
                  )}

                  {lesson.examples && lesson.examples.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {lesson.examples.map((ex: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-serif font-bold text-stone-900 dark:text-stone-100" dir="rtl">
                              {ex.combined || ex.construct || ex.with_ha || ex.derived}
                            </span>
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              {ex.translation || ex.meaning}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 block">
                            {ex.prefix ? `${ex.prefix} + ${ex.base_word}` : ex.base ? `${ex.base}` : ex.noun1 ? `${ex.noun1} + ${ex.noun2}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PRACTICE & QUIZ */}
        {activeTab === 'quiz' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Hebrew Vocabulary Challenge
                </span>
              </div>
              <span className="text-xs font-semibold text-stone-500">
                Answered: {quizTotalAnswered} | Points: {quizScore}
              </span>
            </div>

            {currentQuizQuestion ? (
              <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-md space-y-6 text-center">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
                  What is the meaning of this Hebrew word?
                </span>

                <div className="space-y-2">
                  <span className="text-5xl sm:text-6xl font-serif font-extrabold text-stone-900 dark:text-stone-100 block" dir="rtl">
                    {currentQuizQuestion.targetWord.hebrew}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakHebrew(currentQuizQuestion.targetWord.hebrew)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Pronounce</span>
                  </button>
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-4">
                  {currentQuizQuestion.options.map((opt: any, idx: number) => {
                    const isSelected = selectedQuizOption === idx;
                    const isCorrect = idx === currentQuizQuestion.correctIndex;
                    let btnStyle = 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-amber-500';

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectQuizAnswer(idx)}
                        disabled={isAnswerSubmitted}
                        className={`p-4 rounded-2xl border text-xs font-medium transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold block text-sm">{opt.meaning}</span>
                          <span className="text-[11px] text-stone-400">{opt.transliteration}</span>
                        </div>
                        {isAnswerSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback and Next */}
                {isAnswerSubmitted && (
                  <div className="pt-4 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                    <div className="text-left text-xs space-y-0.5">
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">
                        {currentQuizQuestion.targetWord.transliteration} = {currentQuizQuestion.targetWord.meaning}
                      </span>
                      {currentQuizQuestion.targetWord.example_verse_ref && (
                        <span className="text-[10px] text-stone-400 block">
                          Found in {currentQuizQuestion.targetWord.example_verse_ref}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={generateNewQuestion}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span>Next Word</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-stone-400 animate-pulse">
                Preparing quiz questions...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Letter Details Modal */}
      <Modal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        title={selectedLetter ? `${selectedLetter.name} (${selectedLetter.letter})` : 'Letter Detail'}
        maxWidth="max-w-md"
      >
        {selectedLetter && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-7xl font-serif font-bold text-amber-600 dark:text-amber-400 block">
                {selectedLetter.letter}
              </span>
              <button
                type="button"
                onClick={() => speakHebrew(selectedLetter.letter)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear sound</span>
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 space-y-1">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Sound & Pronunciation</span>
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">{selectedLetter.sound}</p>
                <span className="text-[11px] text-stone-400">Transliteration: {selectedLetter.transliteration}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 space-y-1">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Ancient Symbol & Spiritual Meaning</span>
                <p className="text-xs text-stone-700 dark:text-stone-300 font-sans leading-relaxed">{selectedLetter.meaning}</p>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <span className="font-bold text-stone-700 dark:text-stone-300">Gematria Value:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">{selectedLetter.gematria}</span>
              </div>

              {selectedLetter.is_final && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-xs text-blue-700 dark:text-blue-300">
                  ℹ️ This is a <strong>Sofit</strong> letter, used exclusively when this sound falls at the very end of a word.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsLetterModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
