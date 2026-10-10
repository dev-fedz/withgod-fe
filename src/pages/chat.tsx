import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  MessageCircle,
  Users,
  Plus,
  Send,
  Search,
  UserPlus,
  Lock,
  ArrowLeft,
  Clock,
  Sparkles,
  Phone,
  Video,
  Check,
  CheckCheck,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { VideoCallModal } from '../components/VideoCallModal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface DirectoryUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  display_name?: string;
  avatar_color?: string;
}

interface ChatMessageItem {
  id: string;
  sender: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    display_name?: string;
  };
  content: string;
  message_type: string;
  media_url?: string;
  created_at: string;
}

interface ConversationItem {
  id: string;
  name?: string;
  title?: string;
  display_name?: string;
  description?: string;
  is_group: boolean;
  avatar_color: string;
  call_active?: boolean;
  call_type?: 'video' | 'audio';
  call_room_id?: string;
  unread_count: number;
  last_message: ChatMessageItem | null;
  participants: any[];
  other_user?: any;
  updated_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { user } = useApp();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Calling state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [isCaller, setIsCaller] = useState(true);

  // Modals
  const [isNewDirectModalOpen, setIsNewDirectModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Group creation form
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Add members form
  const [addMemberIds, setAddMemberIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getDirectoryUserName = (u: DirectoryUser): string => {
    return (
      u.full_name ||
      u.display_name ||
      `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
      u.email ||
      'Member'
    );
  };

  const getConversationTitle = (conv: ConversationItem): string => {
    if (conv.display_name) return conv.display_name;
    if (conv.title) return conv.title;
    if (conv.name) return conv.name;
    if (conv.other_user) {
      return (
        conv.other_user.full_name ||
        conv.other_user.display_name ||
        `${conv.other_user.first_name || ''} ${conv.other_user.last_name || ''}`.trim() ||
        conv.other_user.email
      );
    }
    return conv.is_group ? 'Group Chat' : 'Direct Chat';
  };

  const getSenderName = (sender?: any): string => {
    if (!sender) return 'Member';
    return (
      sender.full_name ||
      sender.display_name ||
      `${sender.first_name || ''} ${sender.last_name || ''}`.trim() ||
      sender.email ||
      'Member'
    );
  };

  // 1. Fetch Conversations List
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getChatConversations();
      const list = Array.isArray(res) ? res : (res?.conversations || res?.results || []);
      if (Array.isArray(list)) {
        setConversations((prev) => {
          // Keep active conversation visible even if it has 0 messages yet
          if (activeConv && !list.some((c: any) => c.id === activeConv.id)) {
            return [activeConv, ...list];
          }
          return list;
        });

        // Update activeConv call status if changed
        if (activeConv) {
          const updatedActive = list.find((c: any) => c.id === activeConv.id);
          if (updatedActive && updatedActive.call_active !== activeConv.call_active) {
            setActiveConv(updatedActive);
          }
        }
      }
    } catch (err) {
      console.error('[Chat] fetchConversations error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 2. Fetch Messages for active conversation
  const fetchMessages = async (convId: string, since?: string) => {
    try {
      const res = await api.getChatMessages(convId, since, 50);
      const list = Array.isArray(res) ? res : (res?.messages || res?.results || []);
      if (Array.isArray(list)) {
        if (since) {
          if (list.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const fresh = list.filter((m: ChatMessageItem) => !existingIds.has(m.id));
              return [...prev, ...fresh];
            });
            setTimeout(scrollToBottom, 100);
          }
        } else {
          setMessages(list);
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (err) {
      console.error('[Chat] fetchMessages error:', err);
    }
  };

  // 3. Load Community Directory (Non-admin users only)
  const fetchCommunityUsers = async (query = '') => {
    setLoadingUsers(true);
    try {
      const res = await api.getChatUsers(query);
      const list = Array.isArray(res) ? res : (res?.users || res?.results || []);
      if (Array.isArray(list)) {
        setDirectoryUsers(list);
      }
    } catch (err) {
      console.error('[Chat] fetchCommunityUsers error:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      const interval = setInterval(() => {
        fetchConversations(true);
      }, 8000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user]);

  // When active conversation changes, load messages and start delta polling
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    // Mark as read
    api.markConversationAsRead(activeConv.id).catch(() => {});

    setLoadingMessages(true);
    fetchMessages(activeConv.id).finally(() => setLoadingMessages(false));

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      const latestMsg = messages[messages.length - 1];
      const since = latestMsg ? latestMsg.created_at : undefined;
      fetchMessages(activeConv.id, since);
    }, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeConv?.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConv || !inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await api.sendChatMessage(activeConv.id, textToSend);
      const msg = res?.message || (res?.id ? res : null);
      if (msg) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('[Chat] send error:', err);
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleStartDirectChat = async (targetUser: DirectoryUser) => {
    setIsNewDirectModalOpen(false);
    try {
      const res = await api.startDirectChat(targetUser.id);
      const conv = res?.conversation || (res?.id ? res : null);
      if (conv) {
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conv.id);
          return exists ? prev : [conv, ...prev];
        });
        setActiveConv(conv);
      }
    } catch (err) {
      console.error('[Chat] startDirectChat error:', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || creatingGroup) return;

    setCreatingGroup(true);
    try {
      const res = await api.createGroupChat(groupName.trim(), selectedUserIds, groupDescription.trim());
      const conv = res?.conversation || (res?.id ? res : null);
      if (conv) {
        setIsNewGroupModalOpen(false);
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conv.id);
          return exists ? prev : [conv, ...prev];
        });
        setActiveConv(conv);
      }
    } catch (err) {
      console.error('[Chat] createGroup error:', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || addMemberIds.length === 0 || addingMembers) return;

    setAddingMembers(true);
    try {
      const res = await api.addGroupParticipants(activeConv.id, addMemberIds);
      const updatedConv = res?.conversation || (res?.id ? res : null);
      if (updatedConv) {
        setActiveConv(updatedConv);
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
      }
      setIsAddMemberModalOpen(false);
      setAddMemberIds([]);
      fetchConversations(true);
    } catch (err) {
      console.error('[Chat] addMembers error:', err);
    } finally {
      setAddingMembers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const toggleAddMemberSelection = (userId: string) => {
    if (addMemberIds.includes(userId)) {
      setAddMemberIds(addMemberIds.filter((id) => id !== userId));
    } else {
      setAddMemberIds([...addMemberIds, userId]);
    }
  };

  const handleStartCall = async (type: 'video' | 'audio' = 'video') => {
    if (!activeConv) return;
    setCallType(type);
    setIsCaller(true);
    setIsCallModalOpen(true);
    try {
      await api.startChatCall(activeConv.id, type);
    } catch (e) {
      console.warn('Call start API error:', e);
    }
  };

  const handleJoinCall = () => {
    if (!activeConv) return;
    setCallType(activeConv.call_type || 'video');
    setIsCaller(false);
    setIsCallModalOpen(true);
  };

  if (!user) {
    return (
      <>
        <PageLayout title="Chats" items={[{ label: 'Chats' }]} />
        <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">Sign in to Access Chats</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            Join the community to chat directly with other members, join study groups, and connect.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            Sign In / Register
          </button>
        </div>
      </>
    );
  }

  const activeTitle = activeConv ? getConversationTitle(activeConv) : '';

  return (
    <>
      <PageLayout title="Chats" items={[{ label: 'Chats' }]} />
      <Head>
        <title>Chats | Shema Bible & Journal</title>
      </Head>

      <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-stone-200 dark:border-stone-800 ${
            activeConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
            <div>
              <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-500" />
                Chats
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">Direct & study group conversations</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsNewGroupModalOpen(true);
                  fetchCommunityUsers('');
                  setGroupName('');
                  setGroupDescription('');
                  setSelectedUserIds([]);
                }}
                title="Create Group Chat"
                className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
              >
                <Users className="w-4 h-4 text-amber-600" />
              </button>
              <button
                onClick={() => {
                  setIsNewDirectModalOpen(true);
                  fetchCommunityUsers('');
                }}
                title="New Direct Chat"
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60">
            {loading ? (
              <div className="p-8 text-center text-sm text-stone-400">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">No chats yet</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Start a new conversation with brethren or create a study group.
                </p>
                <button
                  onClick={() => {
                    setIsNewDirectModalOpen(true);
                    fetchCommunityUsers('');
                  }}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors"
                >
                  Start Chatting
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                const title = getConversationTitle(conv);
                const initial = title.substring(0, 1).toUpperCase();
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/30'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 relative"
                      style={{ backgroundColor: conv.avatar_color || '#3B82F6' }}
                    >
                      {conv.is_group ? <Users className="w-5 h-5" /> : initial}
                      {conv.call_active && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-900 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {title}
                        </p>
                        {conv.last_message && (
                          <span className="text-[10px] text-stone-400">
                            {new Date(conv.last_message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {conv.call_active ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Call in progress
                            </span>
                          ) : (
                            conv.last_message?.content || (conv.is_group ? 'Group conversation' : 'Direct message')
                          )}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat Room */}
        <div
          className={`flex-1 flex flex-col bg-stone-50/40 dark:bg-stone-950/30 ${
            !activeConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Active Room Header */}
              <div className="p-3 px-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-1.5 -ml-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: activeConv.avatar_color || '#3B82F6' }}
                  >
                    {activeConv.is_group ? <Users className="w-5 h-5" /> : activeTitle.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">{activeTitle}</h2>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {activeConv.is_group
                        ? `${activeConv.participants?.length || 2} members`
                        : 'Direct conversation'}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons: Calling & Add Members */}
                <div className="flex items-center gap-1.5">
                  {activeConv.is_group && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMemberModalOpen(true);
                        fetchCommunityUsers('');
                        setAddMemberIds([]);
                      }}
                      title="Add Members to Group"
                      className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-xs font-medium"
                    >
                      <UserPlus className="w-4 h-4 text-amber-600" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  )}

                  {/* Audio Call Button */}
                  <button
                    type="button"
                    onClick={() => handleStartCall('audio')}
                    title="Start Voice Call"
                    className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  {/* Video Call Button */}
                  <button
                    type="button"
                    onClick={() => handleStartCall('video')}
                    title="Start Video Call"
                    className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Call In Progress Banner */}
              {activeConv.call_active && (
                <div className="bg-emerald-500 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Call is actively in progress</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleJoinCall}
                    className="px-3 py-1 rounded-lg bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors"
                  >
                    Join Call
                  </button>
                </div>
              )}

              {/* Messages Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {loadingMessages ? (
                  <div className="text-center py-10 text-xs text-stone-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    No messages yet. Send a greeting to begin!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender?.id === user.id;
                    const senderName = getSenderName(m.sender);
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {!isMe && (
                          <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 ml-1 mb-0.5">
                            {senderName}
                          </span>
                        )}
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-amber-500 text-white rounded-br-xs shadow-sm'
                              : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/60 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          <span
                            className={`text-[9px] block text-right mt-1 ${
                              isMe ? 'text-amber-100' : 'text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-stone-100 dark:bg-stone-800 border-none rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">Select a Conversation</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
                Choose a conversation from the sidebar or start a new direct message or group chat.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Video / Voice Call Modal */}
      {activeConv && (
        <VideoCallModal
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            fetchConversations(true);
          }}
          conversationId={activeConv.id}
          callerTitle={activeTitle}
          avatarColor={activeConv.avatar_color}
          isGroup={activeConv.is_group}
          isCaller={isCaller}
          callType={callType}
        />
      )}

      {/* Modal: New Direct Message */}
      <Modal
        isOpen={isNewDirectModalOpen}
        onClose={() => setIsNewDirectModalOpen(false)}
        title="New Direct Message"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              value={searchUserQuery}
              onChange={(e) => {
                setSearchUserQuery(e.target.value);
                fetchCommunityUsers(e.target.value);
              }}
              placeholder="Search community members..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
            {loadingUsers ? (
              <div className="py-6 text-center text-xs text-stone-400">Loading members...</div>
            ) : directoryUsers.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">No members found.</div>
            ) : (
              directoryUsers.map((u) => {
                const name = getDirectoryUserName(u);
                return (
                  <button
                    key={u.id}
                    onClick={() => handleStartDirectChat(u)}
                    className="w-full py-2.5 px-3 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: u.avatar_color || '#3B82F6' }}
                    >
                      {name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{name}</p>
                      <p className="text-xs text-stone-400 truncate">{u.email}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: New Group Chat */}
      <Modal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
        title="Create Group Chat"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Fellowship & Torah Study"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Purpose of this group..."
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
              Select Members ({selectedUserIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-xl divide-y divide-stone-100 dark:divide-stone-800 p-1">
              {directoryUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                const name = getDirectoryUserName(u);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUserSelection(u.id)}
                    className={`w-full py-2 px-3 flex items-center justify-between rounded-lg transition-colors text-left ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: u.avatar_color || '#3B82F6' }}
                      >
                        {name.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                        {name}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-600' : 'text-stone-400'}`}>
                      {isSelected ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewGroupModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim() || creatingGroup}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              {creatingGroup ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Members to Existing Group */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add Members to Group"
      >
        <form onSubmit={handleAddMembers} className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              value={searchUserQuery}
              onChange={(e) => {
                setSearchUserQuery(e.target.value);
                fetchCommunityUsers(e.target.value);
              }}
              placeholder="Search members to add..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
              Select Brethren ({addMemberIds.length} selected)
            </label>
            <div className="max-h-56 overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-xl divide-y divide-stone-100 dark:divide-stone-800 p-1">
              {directoryUsers
                .filter((u) => {
                  // Filter out users already in activeConv.participants
                  const existingIds = new Set(activeConv?.participants?.map((p: any) => p.user?.id || p.user_id));
                  return !existingIds.has(u.id);
                })
                .map((u) => {
                  const isSelected = addMemberIds.includes(u.id);
                  const name = getDirectoryUserName(u);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAddMemberSelection(u.id)}
                      className={`w-full py-2 px-3 flex items-center justify-between rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/40'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: u.avatar_color || '#3B82F6' }}
                        >
                          {name.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">{name}</p>
                          <p className="text-[10px] text-stone-400 truncate">{u.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-amber-600' : 'text-stone-400'}`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddMemberModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMemberIds.length === 0 || addingMembers}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              {addingMembers ? 'Adding...' : `Add to Group (${addMemberIds.length})`}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
