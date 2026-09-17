import { Link } from 'react-router-dom';
import {
  getSession,
  redirectPathForRole,
} from '../utils/auth';
import { getPosts } from '../utils/storage';

const FEATURES = [
  {
    icon: '✍',
    title: 'Write without distractions',
    description:
      'Create and edit focused blog posts in a clean writing space designed to keep your ideas moving.',
    accent: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: '⌂',
    title: 'Keep everything local',
    description:
      'Your posts and account data stay in this browser, with no remote service or complicated setup required.',
    accent: 'bg-violet-100 text-violet-700',
  },
  {
    icon: '✦',
    title: 'Publish at your pace',
    description:
      'Build a personal collection, revisit earlier work, and manage every post from one simple dashboard.',
    accent: 'bg-sky-100 text-sky-700',
  },
];

const PREVIEW_ACCENTS = [
  'border-t-indigo-500',
  'border-t-violet-500',
  'border-t-sky-500',
];

function isDisplayablePost(post) {
  return Boolean(
    post &&
      typeof post === 'object' &&
      typeof post.id === 'string' &&
      post.id.length > 0 &&
      typeof post.title === 'string' &&
      post.title.trim().length > 0 &&
      typeof post.content === 'string',
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

function createExcerpt(content) {
  const normalizedContent =
    typeof content === 'string'
      ? content.trim().replace(/\s+/g, ' ')
      : '';

  if (normalizedContent.length <= 140) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, 140).trimEnd()}…`;
}

export default function LandingPage() {
  const session = getSession();
  const dashboardPath = session
    ? redirectPathForRole(session.role)
    : '/register';
  const discoveryPath = session ? '/blogs' : '/login';
  const latestPosts = getPosts()
    .filter(isDisplayablePost)
    .sort(
      (firstPost, secondPost) =>
        getTimestamp(secondPost.createdAt) -
        getTimestamp(firstPost.createdAt),
    )
    .slice(0, 3);

  const primaryCtaLabel = session
    ? session.role === 'admin'
      ? 'Open Admin Dashboard'
      : 'Go to Your Dashboard'
    : 'Start Writing';
  const secondaryCtaLabel = session
    ? 'Browse All Posts'
    : 'Explore WriteSpace';

  return (
    <div className="bg-white">
      <main>
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-100">
          <div
            aria-hidden="true"
            className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                Your ideas, your browser, your space
              </span>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                A quiet place to turn thoughts into stories.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                WriteSpace is a local-first blogging experience for
                discovering, writing, and managing posts without sending
                your work to a remote service.
              </p>

              {session && (
                <p className="mt-5 text-sm font-semibold text-indigo-700">
                  Welcome back, {session.displayName}.
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  to={dashboardPath}
                >
                  {primaryCtaLabel}
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  to={discoveryPath}
                >
                  {secondaryCtaLabel}
                </Link>
              </div>

              {!session && (
                <p className="mt-4 text-sm text-slate-500">
                  Already have a local account?{' '}
                  <Link
                    className="font-semibold text-indigo-700 hover:text-indigo-500 focus:outline-none focus:underline"
                    to="/login"
                  >
                    Log in
                  </Link>
                </p>
              )}
            </div>

            <div
              aria-hidden="true"
              className="relative mx-auto h-80 w-full max-w-lg sm:h-96"
            >
              <div className="absolute inset-x-8 top-7 rotate-3 rounded-2xl border border-violet-200 bg-violet-100/80 p-6 shadow-lg sm:inset-x-12">
                <div className="h-3 w-24 rounded-full bg-violet-300" />
                <div className="mt-4 h-2 w-full rounded-full bg-violet-200" />
                <div className="mt-2 h-2 w-4/5 rounded-full bg-violet-200" />
              </div>

              <div className="absolute inset-x-3 top-24 -rotate-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:inset-x-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">
                    W
                  </span>
                  <div className="flex-1">
                    <div className="h-3 w-32 rounded-full bg-slate-300" />
                    <div className="mt-2 h-2 w-20 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="mt-7 h-4 w-4/5 rounded-full bg-indigo-200" />
                <div className="mt-4 space-y-3">
                  <div className="h-2 w-full rounded-full bg-slate-200" />
                  <div className="h-2 w-11/12 rounded-full bg-slate-200" />
                  <div className="h-2 w-3/4 rounded-full bg-slate-200" />
                </div>
                <div className="mt-7 flex items-center justify-between">
                  <div className="h-8 w-24 rounded-lg bg-indigo-600" />
                  <div className="h-8 w-8 rounded-full bg-indigo-100" />
                </div>
              </div>

              <div className="absolute bottom-1 right-0 animate-bounce rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg sm:right-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-700">
                    ✓
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    Saved locally
                  </span>
                </div>
              </div>

              <div className="absolute bottom-10 left-0 animate-pulse rounded-xl border border-indigo-200 bg-white px-4 py-3 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  New idea
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Ready when you are
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="bg-slate-50 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                Simple by design
              </p>
              <h2
                className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                id="features-heading"
              >
                Everything you need to keep writing
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                No servers, subscriptions, or complicated publishing
                workflows—just a focused space for your words.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-8"
                  key={feature.title}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold ${feature.accent}`}
                  >
                    {feature.icon}
                  </span>
                  <h3 className="mt-6 text-xl font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="latest-posts-heading"
          className="py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                  From the community
                </p>
                <h2
                  className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                  id="latest-posts-heading"
                >
                  Latest posts
                </h2>
                <p className="mt-3 max-w-2xl text-base text-slate-600">
                  Discover the newest ideas saved in this browser.
                </p>
              </div>

              {latestPosts.length > 0 && (
                <Link
                  className="inline-flex items-center text-sm font-semibold text-indigo-700 transition hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  to={discoveryPath}
                >
                  View all posts
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </Link>
              )}
            </div>

            {latestPosts.length > 0 ? (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post, index) => {
                  const postPath = session
                    ? `/blog/${encodeURIComponent(post.id)}`
                    : '/login';

                  return (
                    <article
                      className={`flex min-h-64 flex-col rounded-xl border border-slate-200 border-t-4 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${PREVIEW_ACCENTS[index]}`}
                      key={post.id}
                    >
                      <time
                        className="text-sm font-medium text-slate-500"
                        dateTime={
                          typeof post.createdAt === 'string'
                            ? post.createdAt
                            : undefined
                        }
                      >
                        {formatDate(post.createdAt)}
                      </time>
                      <h3 className="mt-4 text-xl font-semibold leading-snug text-slate-900">
                        <Link
                          className="rounded-sm transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          to={postPath}
                        >
                          {post.title.trim()}
                        </Link>
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                        {createExcerpt(post.content) ||
                          'Open this post to start reading.'}
                      </p>
                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <span className="truncate text-sm font-medium text-slate-700">
                          {typeof post.authorName === 'string' &&
                          post.authorName.trim()
                            ? post.authorName
                            : 'WriteSpace author'}
                        </span>
                        <Link
                          aria-label={`Read ${post.title.trim()}`}
                          className="shrink-0 text-sm font-semibold text-indigo-700 transition hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          to={postPath}
                        >
                          Read
                          <span aria-hidden="true" className="ml-1">
                            →
                          </span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <span
                  aria-hidden="true"
                  className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl text-indigo-700"
                >
                  ✍
                </span>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">
                  No posts yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  This browser does not have any saved posts. Be the first
                  to give WriteSpace a story.
                </p>
                <Link
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  to={session ? '/write' : '/register'}
                >
                  {session ? 'Write the first post' : 'Create an account'}
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="bg-indigo-600">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Make room for your next idea.
              </h2>
              <p className="mt-2 text-indigo-100">
                Open your local writing space and start with a single
                sentence.
              </p>
            </div>
            <Link
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
              to={session ? '/write' : '/register'}
            >
              {session ? 'Write a Post' : 'Get Started Free'}
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <Link
              className="inline-flex items-center gap-2 rounded-md text-lg font-bold text-white transition hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              to="/"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-base font-bold text-slate-950"
              >
                W
              </span>
              WriteSpace
            </Link>
            <p className="mt-3 text-sm text-slate-400">
              A local-first place for thoughtful writing.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold"
          >
            <Link
              className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              to="/"
            >
              Home
            </Link>
            <Link
              className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              to={discoveryPath}
            >
              Blogs
            </Link>
            {session ? (
              <Link
                className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                to={dashboardPath}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  to="/login"
                >
                  Login
                </Link>
                <Link
                  className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  to="/register"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
            WriteSpace stores demo content locally in your browser.
          </div>
        </div>
      </footer>
    </div>
  );
}