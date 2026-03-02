import { useEffect, useState } from 'react';
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
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function MessageCenter({ title = 'Messages', className = '' }: MessageCenterProps) {
  const [box, setBox] = useState<'inbox' | 'outbox'>('inbox');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiverUserId, setReceiverUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadMessages = async (nextBox: 'inbox' | 'outbox' = box) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = await apiJson<MessageItem[]>(
        `/messages?box=${nextBox}`,
        undefined,
        true,
        'Failed to load messages'
      );
      setMessages(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const sendMessage = async () => {
    const receiver = receiverUserId.trim();
    const content = body.trim();
    if (!receiver || !content) {
      return;
    }
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
            subject: subject.trim() || null,
            body: content
          })
        },
        true,
        'Failed to send message'
      );
      setReceiverUserId('');
      setSubject('');
      setBody('');
      setBox('outbox');
      await loadMessages('outbox');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const markRead = async (messageId: string) => {
    try {
      await apiJson(
        `/messages/${messageId}/read`,
        { method: 'PATCH' },
        true,
        'Failed to mark message as read'
      );
      setMessages((previous) =>
        previous.map((item) => (item.id === messageId ? { ...item, read_at: new Date().toISOString() } : item))
      );
    } catch {
      // Non-blocking action.
    }
  };

  return (
    <section className={`rounded-hero border border-borderGray bg-white p-6 shadow-card ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-textMain">{title}</h2>
        <div className="inline-flex rounded-xl border border-borderGray bg-white p-1">
          <button
            type="button"
            onClick={() => {
              setBox('inbox');
              void loadMessages('inbox');
            }}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              box === 'inbox' ? 'bg-primary text-white' : 'text-textMain hover:text-primary'
            }`}
          >
            Inbox
          </button>
          <button
            type="button"
            onClick={() => {
              setBox('outbox');
              void loadMessages('outbox');
            }}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              box === 'outbox' ? 'bg-primary text-white' : 'text-textMain hover:text-primary'
            }`}
          >
            Outbox
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-borderGray bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Compose Message</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={receiverUserId}
            onChange={(event) => setReceiverUserId(event.target.value)}
            placeholder="Receiver User ID"
            className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
          />
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject (optional)"
            className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
          />
        </div>
        <textarea
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write your message..."
          className="mt-2 w-full rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
        />
        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={isSending}
          className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>

      {errorMessage && (
        <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="mt-4 text-sm text-muted">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No messages in this mailbox.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {messages.map((item) => (
            <article key={item.id} className="rounded-xl border border-borderGray bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">
                  {box === 'inbox' ? `From #${item.sender_user_id.slice(0, 8)}` : `To #${item.receiver_user_id.slice(0, 8)}`}
                </p>
                <p className="text-xs text-muted">{formatDate(item.created_at)}</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-textMain">{item.subject ?? 'No subject'}</p>
              <p className="mt-1 text-sm text-textMain">{item.body}</p>
              {box === 'inbox' && !item.read_at && (
                <button
                  type="button"
                  onClick={() => void markRead(item.id)}
                  className="mt-2 rounded-lg border border-borderGray bg-white px-3 py-1 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
                >
                  Mark read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
