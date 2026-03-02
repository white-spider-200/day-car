import { useEffect, useState } from 'react';
import { ApiError, apiJson } from '../utils/api';
import { getStoredAuthRole } from '../utils/auth';

type TimelinePost = {
  id: string;
  doctor_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  liked_by_me: boolean;
};

type TimelineFeedProps = {
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

export default function TimelineFeed({ title = 'Medical Timeline', className = '' }: TimelineFeedProps) {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [composeText, setComposeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyLikeId, setBusyLikeId] = useState<string | null>(null);

  const authRole = getStoredAuthRole();

  const loadPosts = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = await apiJson<TimelinePost[]>('/posts', undefined, false, 'Failed to load timeline');
      setPosts(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load timeline');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const publishPost = async () => {
    const content = composeText.trim();
    if (!content) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await apiJson(
        '/posts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        },
        true,
        'Failed to publish post'
      );
      setComposeText('');
      await loadPosts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const likePost = async (postId: string) => {
    setBusyLikeId(postId);
    setErrorMessage(null);
    try {
      const payload = await apiJson<{ post_id: string; likes_count: number }>(
        `/posts/${postId}/like`,
        { method: 'POST' },
        true,
        'Failed to like post'
      );
      setPosts((previous) =>
        previous.map((item) =>
          item.id === postId
            ? {
                ...item,
                likes_count: payload.likes_count,
                liked_by_me: true
              }
            : item
        )
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage('Please sign in to like posts.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to like post');
      }
    } finally {
      setBusyLikeId(null);
    }
  };

  return (
    <section className={`rounded-hero border border-borderGray bg-white p-6 shadow-card ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-textMain">{title}</h2>
        <button
          type="button"
          onClick={() => void loadPosts()}
          className="rounded-lg border border-borderGray px-3 py-1.5 text-xs font-semibold text-textMain transition hover:border-primary/30 hover:text-primary"
        >
          Refresh
        </button>
      </div>

      {authRole === 'DOCTOR' && (
        <div className="mt-4 rounded-xl border border-borderGray bg-slate-50 p-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">Share a professional update</label>
          <textarea
            rows={3}
            value={composeText}
            onChange={(event) => setComposeText(event.target.value)}
            className="mt-2 w-full rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
          />
          <button
            type="button"
            onClick={() => void publishPost()}
            disabled={isSubmitting}
            className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
          >
            {isSubmitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="mt-4 text-sm text-muted">Loading timeline...</p>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No posts yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
              <p className="text-xs text-muted">Doctor #{post.doctor_id.slice(0, 8)}</p>
              <p className="mt-2 text-sm leading-6 text-textMain">{post.content}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">{formatDate(post.created_at)}</p>
                <button
                  type="button"
                  onClick={() => void likePost(post.id)}
                  disabled={busyLikeId === post.id}
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                    post.liked_by_me
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-borderGray bg-white text-textMain hover:border-primary/40 hover:text-primary'
                  } disabled:opacity-60`}
                >
                  {busyLikeId === post.id ? 'Liking...' : `Like (${post.likes_count})`}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
