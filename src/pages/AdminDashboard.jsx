import { useState } from 'react';
import {
  Link,
  Navigate,
} from 'react-router-dom';
import StatCard from '../components/StatCard';
import { getSession } from '../utils/auth';
import {
  deletePost,
  getPosts,
  getUsers,
} from '../utils/storage';

function isDisplayablePost(post) {
  return Boolean(
    post &&
      typeof post === 'object' &&
      typeof post.id === 'string' &&
      post.id.length > 0 &&
      typeof post.title === 'string' &&
      post.title.trim().length > 0 &&
      typeof post.createdAt === 'string',
  );
}

function isCountableUser(user) {
  return Boolean(
    user &&
      typeof user === 'object' &&
      typeof user.id === 'string' &&
      user.id.length > 0 &&
      (user.role === 'admin' || user.role === 'user'),
  );
}

function getTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function loadPosts() {
  return getPosts()
    .filter(isDisplayablePost)
    .sort(
      (firstPost, secondPost) =>
        getTimestamp(secondPost.createdAt) -
        getTimestamp(firstPost.createdAt),
    );
}

function loadUsers() {
  return getUsers().filter(isCountableUser);
}

export default function AdminDashboard() {
  const [session] = useState(() => getSession());
  const [posts, setPosts] = useState(loadPosts);
  const [users] = useState(loadUsers);
  const [deleteError, setDeleteError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (session.role !== 'admin') {
    return <Navigate replace to="/blogs" />;
  }

  const administratorCount =
    1 + users.filter((user) => user.role === 'admin').length;
  const standardUserCount = users.filter(
    (user) => user.role === 'user',
  ).length;
  const totalUserCount = administratorCount + standardUserCount;
  const recentPosts = posts.slice(0, 5);

  const handleDelete = (post) => {
    setDeleteError('');
    setStatusMessage('');

    const title = post.title.trim();
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
        if (result.errorCode === 'POST_NOT_FOUND') {
          setPosts((currentPosts) =>
            currentPosts.filter(
              (currentPost) => currentPost.id !== post.id,
            ),
          );
        }

        setDeleteError(
          result.message ||
            'Unable to delete this post. Please try again.',
        );
        return;
      }

      setPosts((currentPosts) =>
        currentPosts.filter(
          (currentPost) => currentPost.id !== post.id,
        ),
      );
      setStatusMessage(`"${title}" was deleted.`);
    } catch {
      setDeleteError(
        'Unable to delete this post right now. Please try again.',
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section
        aria-labelledby="admin-dashboard-heading"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-violet-100">
                Administration
              </p>
              <h1
                className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
                id="admin-dashboard-heading"
              >
                Admin Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                Welcome back, {session.displayName}. Review local activity
                and manage WriteSpace from one place.
              </p>
            </div>

            <span
              aria-hidden="true"
              className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl ring-1 ring-inset ring-white/20"
            >
              ♛
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            accent="indigo"
            icon="✍"
            label="Total Posts"
            value={posts.length}
          />
          <StatCard
            accent="sky"
            icon="♟"
            label="Total Users"
            value={totalUserCount}
          />
          <StatCard
            accent="violet"
            icon="♛"
            label="Administrators"
            value={administratorCount}
          />
          <StatCard
            accent="emerald"
            icon="📖"
            label="Standard Users"
            value={standardUserCount}
          />
        </div>

        <section
          aria-labelledby="quick-actions-heading"
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2
            className="text-xl font-semibold text-slate-900"
            id="quick-actions-heading"
          >
            Quick Actions
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create content, review posts, or manage local accounts.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              to="/write"
            >
              Write a Post
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-5 py-2.5 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              to="/users"
            >
              Manage Users
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              to="/blogs"
            >
              View All Blogs
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="recent-posts-heading"
          className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                className="text-xl font-semibold text-slate-900"
                id="recent-posts-heading"
              >
                Recent Posts
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                The five newest stories saved in this browser.
              </p>
            </div>

            {posts.length > 0 && (
              <Link
                className="inline-flex shrink-0 items-center text-sm font-semibold text-indigo-700 transition hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                to="/blogs"
              >
                View all posts
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
            )}
          </div>

          {deleteError && (
            <div
              className="mx-6 mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              role="alert"
            >
              {deleteError}
            </div>
          )}

          {statusMessage && (
            <div
              className="mx-6 mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
              role="status"
            >
              {statusMessage}
            </div>
          )}

          {recentPosts.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {recentPosts.map((post) => {
                const title = post.title.trim();
                const readPath = `/blog/${encodeURIComponent(post.id)}`;
                const editPath = `/edit/${encodeURIComponent(post.id)}`;

                return (
                  <li
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                    key={post.id}
                  >
                    <div className="min-w-0">
                      <Link
                        className="block truncate rounded-sm font-semibold text-slate-900 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        to={readPath}
                      >
                        {title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                        <time dateTime={post.createdAt}>
                          {formatDate(post.createdAt)}
                        </time>
                        <span aria-hidden="true">•</span>
                        <span className="truncate">
                          {typeof post.authorName === 'string' &&
                          post.authorName.trim()
                            ? post.authorName
                            : 'WriteSpace author'}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        to={editPath}
                      >
                        Edit
                      </Link>
                      <button
                        aria-label={`Delete ${title}`}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                        onClick={() => handleDelete(post)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <span
                aria-hidden="true"
                className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl text-indigo-700"
              >
                ✍
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No posts yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Create the first local story to begin filling the
                dashboard.
              </p>
              <Link
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                to="/write"
              >
                Write the first post
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}