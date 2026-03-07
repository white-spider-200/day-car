import { useEffect, useMemo, useState } from 'react';
import { apiJson } from '../utils/api';

type MessageItem = {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

type MessageCenterProps = {
  title?: string;
  className?: string;
  allowedPartnerIds?: string[];
  partnerNames?: Record<string, string>;
  initialPartnerId?: string | null;
};

type ChatMessage = MessageItem & {
  isOutgoing: boolean;
  partnerId: string;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fallbackPartnerLabel(partnerId: string): string {
  return `User #${partnerId.slice(0, 8)}`;
}

export default function MessageCenter({
  title = 'Messages',
  className = '',
  allowedPartnerIds,
  partnerNames,
  initialPartnerId = null
}: MessageCenterProps) {
  const [inbox, setInbox] = useState<MessageItem[]>([]);
  const [outbox, setOutbox] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [receiverInput, setReceiverInput] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadMessages = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    if (!silent) {
      setErrorMessage(null);
    }
    try {
      const [inboxPayload, outboxPayload] = await Promise.all([
        apiJson<MessageItem[]>('/messages?box=inbox', undefined, true, 'Failed to load inbox'),
        apiJson<MessageItem[]>('/messages?box=outbox', undefined, true, 'Failed to load outbox')
      ]);
      setInbox(inboxPayload);
      setOutbox(outboxPayload);
    } catch (error) {
      if (!silent) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load chat messages');
        setInbox([]);
        setOutbox([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadMessages(true);
    }, 3000);
    const onFocus = () => {
      void loadMessages(true);
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const conversations = useMemo(() => {
    const all: ChatMessage[] = [
      ...inbox.map((item) => ({ ...item, isOutgoing: false, partnerId: item.sender_user_id })),
      ...outbox.map((item) => ({ ...item, isOutgoing: true, partnerId: item.receiver_user_id }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const allowed = allowedPartnerIds ? new Set(allowedPartnerIds) : null;

    const byPartner = new Map<
      string,
      {
        partnerId: string;
        messages: ChatMessage[];
        unreadIncoming: number;
      }
    >();

    for (const message of all) {
      if (allowed && !allowed.has(message.partnerId)) {
        continue;
      }
      const current = byPartner.get(message.partnerId) ?? {
        partnerId: message.partnerId,
        messages: [],
        unreadIncoming: 0
      };
      current.messages.push(message);
      if (!message.isOutgoing && !message.read_at) {
        current.unreadIncoming += 1;
      }
      byPartner.set(message.partnerId, current);
    }

    if (allowed) {
      for (const partnerId of allowed) {
        if (!byPartner.has(partnerId)) {
          byPartner.set(partnerId, {
            partnerId,
            messages: [],
            unreadIncoming: 0
          });
        }
      }
    }

    return [...byPartner.values()].sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1];
      const bLast = b.messages[b.messages.length - 1];
      if (!aLast && !bLast) return 0;
      if (!aLast) return 1;
      if (!bLast) return -1;
      return new Date(bLast.created_at).getTime() - new Date(aLast.created_at).getTime();
    });
  }, [inbox, outbox, allowedPartnerIds]);

  useEffect(() => {
    if (initialPartnerId && conversations.some((item) => item.partnerId === initialPartnerId)) {
      setSelectedPartnerId(initialPartnerId);
      return;
    }
    if (!selectedPartnerId && conversations.length > 0) {
      setSelectedPartnerId(conversations[0].partnerId);
    }
    if (selectedPartnerId && !conversations.some((item) => item.partnerId === selectedPartnerId)) {
      setSelectedPartnerId(conversations[0]?.partnerId ?? null);
    }
  }, [conversations, selectedPartnerId, initialPartnerId]);

  const selectedConversation = conversations.find((item) => item.partnerId === selectedPartnerId) ?? null;

  const sendMessage = async () => {
    const receiver = (selectedPartnerId ?? receiverInput).trim();
    const content = body.trim();
    if (!receiver || !content) return;
    if (allowedPartnerIds && !allowedPartnerIds.includes(receiver)) return;

    setIsSending(true);
    setErrorMessage(null);
    try {
      await apiJson(
        '/messages',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver_user_id: receiver,
            subject: null,
            body: content
          })
        },
        true,
        'Failed to send message'
      );
      setBody('');
      setReceiverInput('');
      setSelectedPartnerId(receiver);
      await loadMessages();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const markConversationRead = async () => {
    if (!selectedConversation) return;
    const unreadIds = selectedConversation.messages
      .filter((item) => !item.isOutgoing && !item.read_at)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    try {
      await Promise.all(
        unreadIds.map((id) =>
          apiJson(`/messages/${id}/read`, { method: 'PATCH' }, true, 'Failed to mark message as read')
        )
      );
      setInbox((prev) => prev.map((item) => (unreadIds.includes(item.id) ? { ...item, read_at: new Date().toISOString() } : item)));
    } catch {
      // non-blocking
    }
  };

  return (
    <section className={`rounded-hero border border-borderGray bg-white p-6 shadow-card ${className}`}>
      {title ? (
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-textMain">{title}</h2>
        </div>
      ) : null}

      {errorMessage && (
        <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
      )}

      <div className={`${title ? 'mt-4' : ''} grid gap-4 lg:grid-cols-[320px_1fr]`}>
        <aside className="rounded-2xl border border-borderGray bg-[#f0f2f5] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Chats</p>
          {isLoading ? (
            <p className="mt-3 text-sm text-muted">Loading chats...</p>
          ) : conversations.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {conversations.map((conversation) => {
                const last = conversation.messages[conversation.messages.length - 1];
                const active = selectedPartnerId === conversation.partnerId;
                const partnerLabel = partnerNames?.[conversation.partnerId] ?? fallbackPartnerLabel(conversation.partnerId);
                return (
                  <li key={conversation.partnerId}>
                    <button
                      type="button"
                      onClick={() => setSelectedPartnerId(conversation.partnerId)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? 'border-primary/40 bg-[#d9fdd3] text-textMain'
                          : 'border-borderGray bg-white text-textMain hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-textMain">{partnerLabel}</p>
                        {conversation.unreadIncoming > 0 && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                            {conversation.unreadIncoming}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-muted">{last?.body ?? 'No messages yet.'}</p>
                      <p className="mt-1 text-[11px] text-muted">{last ? formatDate(last.created_at) : 'Ready to chat'}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="rounded-2xl border border-borderGray bg-[#efeae2] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-borderGray bg-white px-3 py-2">
            <p className="text-sm font-bold text-textMain">
              {selectedConversation
                ? `Chat with ${partnerNames?.[selectedConversation.partnerId] ?? fallbackPartnerLabel(selectedConversation.partnerId)}`
                : 'Start a new chat'}
            </p>
            {selectedConversation && selectedConversation.unreadIncoming > 0 && (
              <button
                type="button"
                onClick={() => void markConversationRead()}
                className="rounded-lg border border-borderGray bg-white px-2 py-1 text-[11px] font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
              >
                Mark as read
              </button>
            )}
          </div>

          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-borderGray bg-[#e5ddd5] p-3">
            {selectedConversation ? (
              selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        message.isOutgoing
                          ? 'rounded-br-md border border-primary/30 bg-[#dcf8c6] text-textMain'
                          : 'rounded-bl-md border border-borderGray bg-white text-textMain'
                      }`}
                    >
                      <p>{message.body}</p>
                      <p className="mt-1 text-[10px] text-muted">
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No messages yet. Send the first message.</p>
              )
            ) : (
              <p className="text-sm text-muted">
                {allowedPartnerIds ? 'No chat available for your current allowed contacts.' : 'Select a chat or enter a user ID to start chatting.'}
              </p>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {!selectedConversation && !allowedPartnerIds && (
              <input
                value={receiverInput}
                onChange={(event) => setReceiverInput(event.target.value)}
                placeholder="Receiver User ID"
                className="w-full rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
              />
            )}
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={
                  isSending ||
                  !(selectedPartnerId || (!allowedPartnerIds && receiverInput.trim())) ||
                  !body.trim()
                }
                className="self-end rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
