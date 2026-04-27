import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getConversations, getConversation, sendMessage, searchUsers } from '../services/api';
import { useAuth } from '../hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OtherUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface ConversationItem {
  other_user: OtherUser;
  last_message: string;
  last_message_at: string;
  is_read: boolean;
  is_virtual?: boolean;
}

interface MessageItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  Sender?: OtherUser;
  Receiver?: OtherUser;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activePeer, setActivePeer] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OtherUser[]>([]);
  const [searching, setSearching] = useState(false);

  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load conversations ──────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await getConversations();
      setConversations(data.data.conversations || []);
    } catch {
      setError('Failed to load conversations.');
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Load messages for active peer ──────────────────────────────────────────

  const loadMessages = useCallback(async (peerId: string) => {
    setLoadingMsgs(true);
    try {
      const { data } = await getConversation(peerId);
      setMessages(data.data.messages || []);
      // Refresh conversation list so last_message updates
      loadConversations();
    } catch {
      setError('Failed to load messages.');
    } finally {
      setLoadingMsgs(false);
    }
  }, [loadConversations]);

  const handleSelectPeer = async (peer: OtherUser) => {
    setActivePeer(peer);
    setSearchResults([]);
    setSearchQuery('');
    setError('');
    await loadMessages(peer.id);
  };

  // ── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Polling for new messages ───────────────────────────────────────────────

  useEffect(() => {
    if (!activePeer) return;
    pollRef.current = setInterval(() => loadMessages(activePeer.id), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activePeer, loadMessages]);

  // ── Search ─────────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await searchUsers({ email: searchQuery.trim() });
      const filtered = (data.data.users as OtherUser[]).filter(u => u.id !== user?.id);
      setSearchResults(filtered);
    } catch {
      setError('User search failed.');
    } finally {
      setSearching(false);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!draft.trim() || !activePeer || sending) return;
    setSending(true);
    const optimisticMsg: MessageItem = {
      id: `tmp-${Date.now()}`,
      sender_id: user!.id,
      receiver_id: activePeer.id,
      content: draft.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, optimisticMsg]);
    const sentContent = draft.trim();
    setDraft('');

    try {
      await sendMessage({ receiver_id: activePeer.id, content: sentContent });
      // Replace optimistic with real after reload
      await loadMessages(activePeer.id);
    } catch {
      setError('Failed to send message.');
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages: { date: string; items: MessageItem[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.items.push(msg);
    else groupedMessages.push({ date, items: [msg] });
  }

  const roleColor = (role: string) => {
    if (role === 'officer') return 'text-blue-600';
    if (role === 'detective') return 'text-purple-600';
    if (role === 'admin') return 'text-red-600';
    return 'text-green-600';
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-gray-50 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── LEFT PANEL: Conversations ────────────────────────────────────────── */}
      <div className="w-80 flex flex-col bg-white border-r border-gray-100 shrink-0">

        {/* Header + Search */}
        <div className="px-5 py-5 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900 mb-4">Messages</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by email..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {searching ? '...' : 'Find'}
            </button>
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden shadow-lg">
              {searchResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectPeer(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(u.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{u.full_name}</p>
                    <p className={`text-xs font-medium capitalize ${roleColor(u.role)}`}>{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              No conversations yet.<br />Search for a user to start chatting.
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = activePeer?.id === conv.other_user.id;
              return (
                <button
                  key={conv.other_user.id}
                  onClick={() => handleSelectPeer(conv.other_user)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left border-b border-gray-50 ${
                    isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {initials(conv.other_user.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {conv.other_user.full_name}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                      {!conv.is_read && !isActive && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 ml-1" />
                      )}
                    </div>
                    <p className={`text-[10px] font-medium capitalize ${roleColor(conv.other_user.role)}`}>
                      {conv.other_user.role}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Chat ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">
        {activePeer ? (
          <>
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-white shadow-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {initials(activePeer.full_name)}
              </div>
              <div>
                <p className="font-black text-gray-900">{activePeer.full_name}</p>
                <p className={`text-xs font-medium capitalize ${roleColor(activePeer.role)}`}>{activePeer.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : groupedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.date}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                      {group.items.map(msg => {
                        const isMine = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {!isMine && (
                              <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center font-bold mr-2 mt-1 shrink-0">
                                {initials(activePeer.full_name)}
                              </div>
                            )}
                            <div className={`max-w-[68%] px-4 py-2.5 rounded-2xl shadow-sm ${
                              isMine
                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {formatTime(msg.created_at)}
                                {isMine && <span className="ml-1">{msg.is_read ? '✓✓' : '✓'}</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Error bar */}
            {error && (
              <div className="px-6 py-2 bg-red-50 border-t border-red-100 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Input bar */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${activePeer.full_name}...`}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-600">Select a conversation</p>
              <p className="text-sm text-gray-400">Choose from the list or search for someone to chat with</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
