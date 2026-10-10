import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Send,
  Plus,
  Clock,
  Trash2,
  Copy,
  Check,
  Key,
  Sparkles,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AiAnimatedEye } from './AiAnimatedEye';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

const QUICK_PROMPTS = [
  'Hebrew meaning of Shalom & Hesed',
  'Explain the 7 Biblical Feasts',
  'Summary of this week’s Torah portion',
  'Scriptures for peace & strength',
  'How do Old & New Covenants connect?',
];

export const AiAssistantModal: React.FC = () => {
  const { user, isAiModalOpen, setIsAiModalOpen, geminiApiKey, setGeminiApiKey } = useApp();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>('New Conversation');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // In-modal quick API key entry if not yet configured
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userId = user?.id || 'guest';

  // Load sessions from localStorage
  const loadSessionsFromStorage = (): ChatSession[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`withgod_ai_sessions_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveSessionsToStorage = (newSessions: ChatSession[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`withgod_ai_sessions_${userId}`, JSON.stringify(newSessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  };

  const loadMessagesFromStorage = (sessionId: string): ChatMessage[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`withgod_ai_messages_${userId}_${sessionId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveMessagesToStorage = (sessionId: string, newMessages: ChatMessage[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`withgod_ai_messages_${userId}_${sessionId}`, JSON.stringify(newMessages));
    } catch (e) {
      console.warn('Failed to save messages:', e);
    }
  };

  // Init on modal open
  useEffect(() => {
    if (!isAiModalOpen) return;
    const existingSessions = loadSessionsFromStorage();
    setSessions(existingSessions);

    if (existingSessions.length > 0 && !currentSessionId) {
      const latest = existingSessions[0];
      setCurrentSessionId(latest.id);
      setCurrentSessionTitle(latest.title);
      setMessages(loadMessagesFromStorage(latest.id));
    } else if (currentSessionId) {
      setMessages(loadMessagesFromStorage(currentSessionId));
    } else {
      setCurrentSessionId(null);
      setCurrentSessionTitle('New Conversation');
      setMessages([]);
    }
  }, [isAiModalOpen, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isAiModalOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isAiModalOpen]);

  // Focus input on open
  useEffect(() => {
    if (isAiModalOpen && !isHistoryOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isAiModalOpen, isHistoryOpen]);

  const handleStartNewChat = () => {
    setCurrentSessionId(null);
    setCurrentSessionTitle('New Conversation');
    setMessages([]);
    setIsHistoryOpen(false);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setCurrentSessionTitle(session.title);
    setMessages(loadMessagesFromStorage(session.id));
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    saveSessionsToStorage(updated);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`withgod_ai_messages_${userId}_${sessionId}`);
    }

    if (currentSessionId === sessionId) {
      if (updated.length > 0) {
        handleSelectSession(updated[0]);
      } else {
        handleStartNewChat();
      }
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const handleSaveInlineKey = () => {
    if (!inlineKeyInput.trim()) return;
    setGeminiApiKey(inlineKeyInput.trim());
    setShowKeyForm(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isThinking) return;

    setInputText('');

    // Ensure session exists
    let activeSessionId = currentSessionId;
    let updatedSessions = [...sessions];

    if (!activeSessionId) {
      const newSessionId = `session_${Date.now()}`;
      const title = query.length > 35 ? `${query.slice(0, 35)}...` : query;
      const newSession: ChatSession = {
        id: newSessionId,
        title,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      activeSessionId = newSessionId;
      setCurrentSessionId(newSessionId);
      setCurrentSessionTitle(title);
      updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      saveSessionsToStorage(updatedSessions);
    } else {
      // update timestamp
      updatedSessions = updatedSessions.map((s) =>
        s.id === activeSessionId ? { ...s, updated_at: Date.now() } : s
      );
      setSessions(updatedSessions);
      saveSessionsToStorage(updatedSessions);
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: query,
      created_at: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveMessagesToStorage(activeSessionId, newMessages);
    setIsThinking(true);

    try {
      const apiKey =
        geminiApiKey ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
        (typeof window !== 'undefined' ? localStorage.getItem('withgod_gemini_api_key') : '');

      if (!apiKey) {
        const warning =
          "No Gemini API key configured. You can configure your personal Gemini API key in 'Profile & Settings' > 'Gemini AI API Key' or enter it below to begin chatting with Shalom.";
        const botMsg: ChatMessage = {
          id: `msg_${Date.now()}_a`,
          role: 'assistant',
          content: warning,
          created_at: Date.now(),
        };
        const finalMsgs = [...newMessages, botMsg];
        setMessages(finalMsgs);
        saveMessagesToStorage(activeSessionId, finalMsgs);
        setShowKeyForm(true);
        setIsThinking(false);
        return;
      }

      const systemInstruction = {
        parts: [
          {
            text: `You are the Shema AI Assistant ("Shalom") — a knowledgeable, warm, and spiritually grounded Bible & Torah companion powered by Google Gemini.
Your expertise includes:
- Holy Scripture (Tanakh / Old Testament & New Testament)
- Original Hebrew roots, Greek terms, and theological nuances
- The 7 Biblical Feasts (Leviticus 23: Passover, Unleavened Bread, Firstfruits, Shavuot, Yom Teruah, Yom Kippur, Sukkot)
- Weekly Torah Portions (Parashiot) and prophetic Haftarah connections
- Daily prayer, devotions, encouragement, and scripture reflection
Always format your answers nicely using markdown:
- Use **bold** for key concepts and terms
- Use *italic* for translations or emphasis
- Use bullet points (•) and numbered lists (1., 2.) for structured thoughts
- Use blockquotes (>) for Scripture citations (e.g. > John 3:16)
Keep responses uplifting, clear, well-structured, and focused on God's Word.`,
          },
        ],
      };

      const historyContext = newMessages.slice(-10).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      // Use gemini-3.8-flash matching mobile implementation
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: systemInstruction,
          contents: historyContext,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errDetail = errorData.error?.message || res.statusText;
        throw new Error(`AI API Error: ${errDetail}`);
      }

      const data = await res.json();
      const aiReply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I could not formulate a response at this moment. Please try again.";

      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: aiReply,
        created_at: Date.now(),
      };

      const finalMsgs = [...newMessages, botMsg];
      setMessages(finalMsgs);
      saveMessagesToStorage(activeSessionId, finalMsgs);
    } catch (err: any) {
      console.warn('[Shalom AI] Inference error:', err);
      const errorMsg = `Unable to get answer: ${err.message || 'Network error'}. Please verify your Gemini API key in Profile & Settings.`;
      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: errorMsg,
        created_at: Date.now(),
      };
      const finalMsgs = [...newMessages, botMsg];
      setMessages(finalMsgs);
      saveMessagesToStorage(activeSessionId, finalMsgs);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Safe lightweight markdown parser for chat bubbles
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Blockquote
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '');
        return (
          <blockquote
            key={idx}
            className="my-2 pl-3 py-1.5 border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 rounded-r-lg font-serif italic text-xs leading-relaxed"
          >
            {quoteText}
          </blockquote>
        );
      }

      // Heading 3 or 4
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-2 mb-1">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }

      // Bullet points
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^([•\-\*]\s*)/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-amber-500 text-xs font-bold leading-5">•</span>
            <span className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed">
              {renderInlineStyles(bulletText)}
            </span>
          </div>
        );
      }

      // Numbered lists
      const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-amber-600 dark:text-amber-400 text-xs font-bold shrink-0">
              {numMatch[1]}.
            </span>
            <span className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed">
              {renderInlineStyles(numMatch[2])}
            </span>
          </div>
        );
      }

      // Empty line spacer
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }

      // Normal paragraph
      return (
        <p key={idx} className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed my-1">
          {renderInlineStyles(line)}
        </p>
      );
    });
  };

  const renderInlineStyles = (text: string) => {
    // Parse **bold** and *italic*
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-stone-900 dark:text-stone-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="font-serif italic text-amber-800 dark:text-amber-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  if (!isAiModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full h-full sm:h-[88vh] sm:max-h-[720px] sm:max-w-2xl bg-white dark:bg-stone-900 sm:rounded-3xl border-0 sm:border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-label="Shalom AI Assistant"
      >
        {/* Header Bar */}
        <div className="h-16 px-4 sm:px-6 border-b border-stone-100 dark:border-stone-800/90 flex items-center justify-between shrink-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <AiAnimatedEye size={22} glowColor="#F59E0B" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm tracking-tight text-stone-900 dark:text-stone-100">
                  Shalom AI
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Theological Guide
                </span>
              </div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate max-w-[200px] sm:max-w-xs">
                {currentSessionTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                isHistoryOpen ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' : ''
              }`}
              title="Conversation History"
              aria-label="Conversation History"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleStartNewChat}
              className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="New Conversation"
              aria-label="New Conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsAiModalOpen(false)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ml-1"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Drawer Overlay */}
        {isHistoryOpen && (
          <div className="absolute inset-x-0 top-16 bottom-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto space-y-3 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Saved Conversations ({sessions.length})
              </span>
              <button
                type="button"
                onClick={handleStartNewChat}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Chat
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-amber-500" />
                <p>No saved conversations yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      sess.id === currentSessionId
                        ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 hover:border-amber-500/40 bg-white dark:bg-stone-800/60'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs truncate">{sess.title}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {new Date(sess.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inline API Key Banner if unconfigured */}
        {!geminiApiKey && (
          <div className="p-3 px-4 sm:px-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
              <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Configure your Gemini API key to activate AI responses.</span>
            </div>
            <div className="flex items-center gap-2">
              {showKeyForm ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="password"
                    placeholder="Paste AI key..."
                    value={inlineKeyInput}
                    onChange={(e) => setInlineKeyInput(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    onClick={handleSaveInlineKey}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowKeyForm(true)}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                  >
                    Enter Key
                  </button>
                  <span className="text-stone-300">·</span>
                  <Link
                    href="/profile"
                    onClick={() => setIsAiModalOpen(false)}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                  >
                    Profile Settings →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="py-8 sm:py-12 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-sm">
                <AiAnimatedEye size={32} glowColor="#F59E0B" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Shalom, how may I assist your study?
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-serif leading-relaxed">
                  Ask questions about scripture, Hebrew and Greek meanings, the Biblical Feasts, or request theological context.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="pt-2 max-w-md mx-auto space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Suggested Questions
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-stone-600 dark:text-stone-300 shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <AiAnimatedEye size={16} glowColor="#F59E0B" isPulsing={false} />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs ${
                      isUser
                        ? 'bg-amber-500 text-white shadow-sm rounded-tr-xs'
                        : 'bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60 shadow-xs rounded-tl-xs group'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    ) : (
                      <>
                        <div className="space-y-1">{renderFormattedContent(m.content)}</div>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m.id, m.content)}
                          className="absolute right-2 top-2 p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy message"
                        >
                          {copiedMsgId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Thinking State */}
          {isThinking && (
            <div className="flex items-center gap-2.5 text-xs text-amber-600 dark:text-amber-400">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AiAnimatedEye size={16} glowColor="#F59E0B" />
              </div>
              <span className="font-medium animate-pulse">
                Shalom is reflecting on God&apos;s Word...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-100 dark:border-stone-800/90 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Ask Shalom anything about Scripture..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-3.5 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none max-h-32 leading-relaxed"
                style={{ minHeight: '42px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isThinking || !inputText.trim()}
              className="w-10 h-10 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white flex items-center justify-center shadow-sm shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-center text-stone-400 dark:text-stone-500 mt-2">
            Shalom is an AI theology companion. Always verify teachings against the Holy Scriptures.
          </p>
        </div>
      </div>
    </div>
  );
};
