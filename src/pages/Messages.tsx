import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Inbox,
  MessageCircle,
  PhoneCall,
  RotateCw,
  Search,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Alert } from '../components/ui/Alert';
import { Avatar } from '../components/ui/Avatar';
import { buttonClasses } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SetupNotice } from '../components/ui/SetupNotice';
import { Skeleton } from '../components/ui/Skeleton';
import { Spinner } from '../components/ui/Spinner';
import {
  fetchConversations,
  fetchMessages,
  fetchRecentMessages,
  sendMessage,
} from '../lib/api/conversations';
import { getSupabase } from '../lib/supabase';
import type { ConversationView, Message } from '../types';
import type { TranslationKey } from '../translations';
import { errorMessageKey } from '../utils/errors';
import { formatRelativeLabel, formatTime } from '../utils/format';
import { validateMessage } from '../utils/validators';
import { cn } from '../utils/cn';

const CONVERSATION_POLL_MS = 20000;
const MESSAGE_POLL_MS = 8000;

export function Messages() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { session, profile, configMissing } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const userId = session?.user.id ?? null;
  const isNgo = profile?.role === 'ngo';

  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [previews, setPreviews] = useState<Record<string, Message>>({});
  const [convLoading, setConvLoading] = useState(true);
  const [convErrorKey, setConvErrorKey] = useState<TranslationKey | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgErrorKey, setMsgErrorKey] = useState<TranslationKey | null>(null);
  const [sendErrorKey, setSendErrorKey] = useState<TranslationKey | null>(null);

  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [counterpartOnline, setCounterpartOnline] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(
    async (quiet = false) => {
      if (!userId) return;
      if (!quiet) setConvLoading(true);
      setConvErrorKey(null);
      try {
        const rows = await fetchConversations(userId);
        setConversations(rows);
        const recent = await fetchRecentMessages(rows.map((row) => row.conversation.id));
        const map: Record<string, Message> = {};
        for (const message of recent) {
          if (!map[message.conversation_id]) map[message.conversation_id] = message;
        }
        setPreviews(map);
      } catch (error) {
        setConvErrorKey(errorMessageKey(error));
      } finally {
        if (!quiet) setConvLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void loadConversations();
    const interval = window.setInterval(() => void loadConversations(true), CONVERSATION_POLL_MS);
    return () => window.clearInterval(interval);
  }, [loadConversations]);

  const active = useMemo(
    () => conversations.find((row) => row.conversation.id === conversationId) ?? null,
    [conversations, conversationId],
  );

  // Land on the most recent conversation when none is selected.
  useEffect(() => {
    if (!conversationId && !convLoading && conversations.length > 0) {
      navigate(`/messages/${conversations[0].conversation.id}`, { replace: true });
    }
  }, [conversationId, conversations, convLoading, navigate]);

  const loadMessages = useCallback(
    async (quiet = false) => {
      if (!conversationId) return;
      if (!quiet) {
        setMsgLoading(true);
        setMsgErrorKey(null);
      }
      try {
        setMessages(await fetchMessages(conversationId));
      } catch (error) {
        if (!quiet) setMsgErrorKey(errorMessageKey(error));
      } finally {
        if (!quiet) setMsgLoading(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    setMessages([]);
    setDraft('');
    setSendErrorKey(null);
    setCounterpartOnline(false);
    if (!conversationId) return undefined;
    void loadMessages();
    const interval = window.setInterval(() => void loadMessages(true), MESSAGE_POLL_MS);
    return () => window.clearInterval(interval);
  }, [conversationId, loadMessages]);

  // Presence: real online status of the other participant in this conversation.
  useEffect(() => {
    if (!conversationId || !userId || configMissing) return undefined;
    const sb = getSupabase();
    if (!sb) return undefined;

    setCounterpartOnline(false);
    const channel = sb.channel(`presence:conversation:${conversationId}`);
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ user_id?: string }>>;
        const seen = Object.values(state)
          .flat()
          .some((entry) => entry.user_id !== userId);
        setCounterpartOnline(seen);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ user_id: userId });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setCounterpartOnline(false);
        }
      });

    return () => {
      setCounterpartOnline(false);
      void sb.removeChannel(channel);
    };
  }, [conversationId, userId, configMissing]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((row) => {
      const name =
        (row.counterparty?.org_name || row.counterparty?.full_name || '').toLowerCase();
      const listing = (row.listing?.title ?? '').toLowerCase();
      const preview = (previews[row.conversation.id]?.body ?? '').toLowerCase();
      return name.includes(query) || listing.includes(query) || preview.includes(query);
    });
  }, [conversations, previews, search]);

  const displayName = active
    ? (active.counterparty?.org_name ||
      active.counterparty?.full_name ||
      (isNgo ? active.listing?.provider_name : null) ||
      (isNgo ? t('role.provider') : t('role.ngo')))
    : '';

  const counterPhone = active
    ? (isNgo
        ? active.listing?.provider_phone || active.counterparty?.phone
        : active.counterparty?.phone) ?? null
    : null;

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = validateMessage(draft);
    if (invalid || !conversationId || !userId) {
      if (invalid) setSendErrorKey(invalid);
      return;
    }
    setSending(true);
    setSendErrorKey(null);
    try {
      const created = await sendMessage(conversationId, userId, draft.trim());
      setMessages((current) => [...current, created]);
      setDraft('');
      void loadConversations(true);
    } catch (error) {
      setSendErrorKey(errorMessageKey(error));
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (id: string) => {
    navigate(`/messages/${id}`);
    setMobileThreadOpen(true);
  };

  if (configMissing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SetupNotice />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="flex h-[78vh] min-h-[540px] overflow-hidden">
        {/* Chat list */}
        <aside
          className={cn(
            'flex w-full flex-col border-r border-slate-200 dark:border-slate-800 md:w-80 md:shrink-0 lg:w-96',
            mobileThreadOpen && 'hidden',
          )}
          aria-label={t('msg.title')}
        >
          <div className="border-b border-slate-200 px-5 pb-4 pt-5 dark:border-slate-800">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {t('msg.title')}
            </h1>
            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="chat-search" className="sr-only">
                {t('msg.searchPlaceholder')}
              </label>
              <input
                id="chat-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('msg.searchPlaceholder')}
                className="field-control py-2.5 pl-10 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : convErrorKey ? (
              <div className="p-4">
                <Alert variant="error" onDismiss={() => void loadConversations()}>
                  {t(convErrorKey)}
                </Alert>
                <button
                  type="button"
                  onClick={() => void loadConversations()}
                  className={buttonClasses({ variant: 'outline', className: 'mt-3 w-full' })}
                >
                  <RotateCw className="size-4" aria-hidden="true" />
                  {t('common.retry')}
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={t('msg.emptyChats')}
                text={t('msg.emptyChatsText')}
                action={
                  <Link to="/browse" className={buttonClasses({ variant: 'soft' })}>
                    {t('msg.browseLink')}
                  </Link>
                }
              />
            ) : filteredConversations.length === 0 ? (
              <EmptyState icon={Search} title={t('browse.emptyTitle')} text={t('browse.emptyText')} />
            ) : (
              <ul>
                {filteredConversations.map((row) => {
                  const id = row.conversation.id;
                  const name =
                    row.counterparty?.org_name ||
                    row.counterparty?.full_name ||
                    (isNgo ? row.listing?.provider_name : t('role.ngo'));
                  const preview =
                    previews[id]?.body ?? row.listing?.title ?? t('msg.emptyMessages');
                  const timestamp = previews[id]?.created_at ?? row.conversation.last_message_at;
                  const selected = id === conversationId;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => selectConversation(id)}
                        aria-current={selected || undefined}
                        className={cn(
                          'w-full border-l-4 px-5 py-4 text-left transition',
                          selected
                            ? 'border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/30'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60',
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[15px] font-bold text-slate-900 dark:text-slate-100">
                            {name}
                          </span>
                          <span
                            className={cn(
                              'shrink-0 text-xs',
                              selected
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-slate-400',
                            )}
                          >
                            {formatRelativeLabel(timestamp, new Date(), lang, t)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                          {preview}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Thread */}
        <section
          className={cn('flex min-w-0 flex-1 flex-col', !mobileThreadOpen && 'hidden md:flex')}
          aria-label={displayName || t('msg.selectChat')}
        >
          {!conversationId || (!active && !convLoading) ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                icon={MessageCircle}
                title={t('msg.selectChat')}
                text={t('msg.selectChatText')}
              />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-6 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMobileThreadOpen(false)}
                  aria-label={t('common.back')}
                  className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>

                <Avatar name={displayName} size="md" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
                    {displayName}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        counterpartOnline ? 'bg-green-500' : 'bg-slate-400',
                      )}
                      aria-hidden="true"
                    />
                    <span className={counterpartOnline ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}>
                      {counterpartOnline ? t('msg.online') : t('msg.offline')}
                    </span>
                  </p>
                </div>

                {counterPhone ? (
                  <a
                    href={`tel:${counterPhone}`}
                    className={buttonClasses({ shape: 'pill', className: 'shrink-0' })}
                  >
                    <PhoneCall className="size-4" aria-hidden="true" />
                    {isNgo ? t('msg.callProvider') : t('msg.callNgo')}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title={t('msg.noPhone')}
                    className={buttonClasses({ shape: 'pill', className: 'shrink-0' })}
                  >
                    <PhoneCall className="size-4" aria-hidden="true" />
                    {isNgo ? t('msg.callProvider') : t('msg.callNgo')}
                  </button>
                )}
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 dark:bg-slate-950/50">
                {msgLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner label={t('common.loading')} />
                  </div>
                ) : msgErrorKey ? (
                  <Alert variant="error" onDismiss={() => void loadMessages()}>
                    {t(msgErrorKey)}
                  </Alert>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('msg.emptyMessages')}
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender_id === userId;
                    return (
                      <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-6 shadow-sm',
                            mine
                              ? 'rounded-br-md bg-green-600 text-white'
                              : 'rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <span
                            className={cn(
                              'mt-1 block text-right text-[11px]',
                              mine ? 'text-green-100' : 'text-slate-400',
                            )}
                          >
                            {formatTime(message.created_at, lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="border-t border-slate-200 px-4 py-4 sm:px-6 dark:border-slate-800"
              >
                {sendErrorKey ? (
                  <Alert variant="error" className="mb-3" onDismiss={() => setSendErrorKey(null)}>
                    {t(sendErrorKey)}
                  </Alert>
                ) : null}
                <div className="flex items-center gap-3">
                  <label htmlFor="message-draft" className="sr-only">
                    {t('msg.inputPlaceholder')}
                  </label>
                  <input
                    id="message-draft"
                    type="text"
                    value={draft}
                    maxLength={2000}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setSendErrorKey(null);
                    }}
                    placeholder={t('msg.inputPlaceholder')}
                    className="field-control rounded-full py-2.5"
                  />
                  <button
                    type="submit"
                    disabled={sending || draft.trim() === ''}
                    aria-label={t('msg.send')}
                    aria-busy={sending || undefined}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="size-5" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </Card>
    </div>
  );
}
