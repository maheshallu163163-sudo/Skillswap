import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Conversation, Message, UserProfile } from '../types';
import { DatabaseService, subscribeToChannel } from '../services/db';
import { GeminiService } from '../services/gemini';
import { UserAvatar } from '../components/UserAvatar';
import {
  Send,
  Sparkles,
  Bot,
  Calendar,
  Languages,
  Smile,
  Briefcase,
  Loader2,
  CheckCheck,
  Check,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react';

interface MessagesPageProps {
  initialConversationId?: string;
  onNavigate: (path: string) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  initialConversationId,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = async () => {
    if (!currentUser) return;
    try {
      setLoadingConv(true);
      const list = await DatabaseService.getConversations(currentUser.id);
      setConversations(list);
      if (!activeConversationId && list.length > 0) {
        setActiveConversationId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversations();

    const unsubConv = subscribeToChannel('conversations', () => {
      loadConversations();
    });

    return () => {
      unsubConv();
    };
  }, [currentUser?.id]);

  // Load messages for active conversation
  const loadActiveMessages = async () => {
    if (!activeConversationId) return;
    const msgs = await DatabaseService.getMessages(activeConversationId);
    setMessages(msgs);
  };

  useEffect(() => {
    loadActiveMessages();

    if (activeConversationId) {
      const unsubMsgs = subscribeToChannel(`messages-${activeConversationId}`, (newMsg: Message) => {
        setMessages((prev) => [...prev, newMsg]);
      });
      return () => {
        unsubMsgs();
      };
    }
  }, [activeConversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentUser) return null;

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const partner = activeConv?.otherUser;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeConversationId || !partner) return;

    const content = messageInput.trim();
    setMessageInput('');
    setAiSuggestion(null);

    await DatabaseService.sendMessage(
      activeConversationId,
      currentUser.id,
      partner.id,
      content
    );
  };

  // AI Assistant Actions
  const handleAiAction = async (action: 'improve' | 'suggest_reply' | 'professional' | 'friendly' | 'suggest_schedule' | 'translate') => {
    if (!partner) return;
    try {
      setLoadingAi(true);
      const res = await GeminiService.assistantAction({
        action,
        draft: messageInput,
        conversationContext: messages.slice(-5),
        partnerName: partner.fullName.split(' ')[0],
        targetLanguage: 'Spanish',
      });
      if (res) {
        setAiSuggestion(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs animate-fade-in">
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Conversation List */}
        <div
          className={`w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="font-extrabold text-lg text-slate-900 tracking-tight">Messages</h2>
            <p className="text-xs text-slate-500">Live chat with your skill exchange partners</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations yet. Accept a swap request to start chatting!
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === activeConversationId;
                const other = c.otherUser;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <UserAvatar
                      src={other?.avatarUrl}
                      name={other?.fullName}
                      size="md"
                      showOnlineStatus
                      className="shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {other?.fullName || 'Community Member'}
                        </h4>
                        {c.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Window */}
        {activeConv && partner ? (
          <div
            className={`flex-1 flex flex-col bg-white ${
              !activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Chat Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveConversationId(null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <UserAvatar
                  src={partner.avatarUrl}
                  name={partner.fullName}
                  size="md"
                />
                <div>
                  <h3
                    onClick={() => onNavigate(`/profile/${partner.id}`)}
                    className="font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                  >
                    {partner.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Active Now • {partner.city || 'Online'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/sessions')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Schedule Session</span>
                </button>
              </div>
            </div>

            {/* Conversation Starter Callout (if chat is short) */}
            {messages.length <= 2 && (
              <div className="m-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Need help getting started? Click AI to draft a warm introductory message.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAiAction('suggest_schedule')}
                  className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 font-bold rounded-lg text-[11px] hover:bg-purple-100/50"
                >
                  Suggest Schedule
                </button>
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
              {messages.map((m) => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium shadow-2xs leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {m.content}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-indigo-600" />}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Assistant Output Preview (if generated) */}
            {aiSuggestion && (
              <div className="p-3 bg-purple-50 border-t border-purple-200 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    ✨ AI Suggested Message
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMessageInput(aiSuggestion);
                        setAiSuggestion(null);
                      }}
                      className="px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px] hover:bg-purple-700"
                    >
                      Use This Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiSuggestion(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-purple-100 italic">
                  "{aiSuggestion}"
                </p>
              </div>
            )}

            {/* AI Assistant Toolbox Buttons */}
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1 mr-1">
                <Bot className="w-3.5 h-3.5 text-purple-600" />
                AI Assistant:
              </span>

              <button
                type="button"
                disabled={loadingAi || !messageInput}
                onClick={() => handleAiAction('improve')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 transition-colors shrink-0"
              >
                ✨ Improve Draft
              </button>

              <button
                type="button"
                disabled={loadingAi}
                onClick={() => handleAiAction('suggest_reply')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 transition-colors shrink-0"
              >
                💡 Suggest Reply
              </button>

              <button
                type="button"
                disabled={loadingAi || !messageInput}
                onClick={() => handleAiAction('professional')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 transition-colors shrink-0"
              >
                📝 Professional
              </button>

              <button
                type="button"
                disabled={loadingAi || !messageInput}
                onClick={() => handleAiAction('friendly')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 transition-colors shrink-0"
              >
                😊 Friendly
              </button>

              <button
                type="button"
                disabled={loadingAi}
                onClick={() => handleAiAction('suggest_schedule')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 transition-colors shrink-0"
              >
                🗓️ Suggest Schedule
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message ${partner.fullName.split(' ')[0]}...`}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:opacity-95 shadow-md shadow-indigo-500/20 disabled:opacity-40 transition-all cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center p-8 text-center text-slate-400 space-y-2">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700">Select a conversation</h3>
              <p className="text-xs text-slate-400">Choose a chat from the left panel to message your peer.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
