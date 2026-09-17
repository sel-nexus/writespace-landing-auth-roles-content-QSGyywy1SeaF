import { useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { getAvatar } from '../components/Avatar';
import { getSession } from '../utils/auth';
import {
  deletePost,
  getPostById,
} from '../utils/storage';

const DEFAULT_ADMIN_ID = 'admin-fixed-id';

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function canManagePost(session, post) {
  return Boolean(
    session &&
      post &&
      (session.role === 'admin' ||
        session.userId === post.authorId),
  );
}

export default function ReadBlog() {
  const navigate = useNavigate();
  const { id: postId } = useParams();
  const [session] = useState(() => getSession());
  const [post] = useState(() =>
    typeof postId === 'string' && postId.length > 0
      ? getPostById(postId)
      : null,
  );
  const [deleteError, setDeleteError] = useState('');

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (!post) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
        <section
          aria-labelledby="post-not-found-heading"
          className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10"
        >
          <span
            aria-hidden="true"
            className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700"
          >
            ?
          </span>
          <h1
            className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
            id="post-not-found-heading"
          >
            Post not found
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            This post may have been removed, or the link may no longer be
            valid.
          </p>
          <Link
            className="mt-7 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            to="/blogs"
          >
            Back to all blogs
          </Link>
        </section>
      </main>
    );
  }

  const canManage = canManagePost(session, post);
  const authorRole =
    post.authorId === DEFAULT_ADMIN_ID ? 'admin' : 'user';
  const editPath = `/edit/${encodeURIComponent(post.id)}`;
  const authorName =
    typeof post.authorName === 'string' && post.authorName.trim()
      ? post.authorName
      : 'WriteSpace author';
  const title =
    typeof post.title === 'string' && post.title.trim()
      ? post.title
      : 'Untitled post';
  const content =
    typeof post.content === 'string' ? post.content : '';
  const createdAt =
    typeof post.createdAt === 'string' ? post.createdAt : '';

  const handleDelete = () => {
    setDeleteError('');

    const confirmed =
      typeof globalThis.confirm === 'function' &&
      globalThis.confirm(
        `Delete "${title}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      const result = deletePost(post.id, session);

      if (!result.ok) {
        if (
          result.errorCode === 'FORBIDDEN' ||
          result.errorCode === 'POST_NOT_FOUND'
        ) {
          navigate(result.redirectTo || '/blogs', {
            replace: true,
          });
          return;
        }

        setDeleteError(
          result.message ||
            'Unable to delete this post. Please try again.',
        );
        return;
      }

      navigate(result.redirectTo || '/blogs', {
        replace: true,
      });
    } catch {
      setDeleteError(
        'Unable to delete this post right now. Please try again.',
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Link
          className="inline-flex items-center rounded-md text-sm font-semibold text-indigo-700 transition hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          to="/blogs"
        >
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          Back to all blogs
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Local story
            </p>
            <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                {getAvatar(authorRole, 'md')}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {authorName}
                  </p>
                  <time
                    className="mt-1 block text-sm text-slate-500"
                    dateTime={createdAt || undefined}
                  >
                    {formatDate(createdAt)}
                  </time>
                </div>
              </div>

              {canManage && (
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    to={editPath}
                  >
                    Edit
                  </Link>
                  <button
                    className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                    onClick={handleDelete}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {deleteError && (
              <p
                className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                role="alert"
              >
                {deleteError}
              </p>
            )}
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="whitespace-pre-wrap break-words text-base leading-8 text-slate-700 sm:text-lg">
              {content}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}