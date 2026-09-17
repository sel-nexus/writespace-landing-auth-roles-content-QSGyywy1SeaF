import { useState } from 'react';
import { Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import { getSession } from '../utils/auth';
import { getPosts } from '../utils/storage';

function isDisplayablePost(post) {
  return Boolean(
    post &&
      typeof post === 'object' &&
      typeof post.id === 'string' &&
      post.id.length > 0 &&
      typeof post.title === 'string' &&
      post.title.trim().length > 0 &&
      typeof post.content === 'string' &&
      typeof post.createdAt === 'string' &&
      typeof post.authorId === 'string' &&
      post.authorId.length > 0 &&
      typeof post.authorName === 'string' &&
      post.authorName.trim().length > 0,
  );
}

function getTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
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

export default function Home() {
  const [posts] = useState(loadPosts);
  const [session] = useState(() => getSession());

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section
        aria-labelledby="blogs-heading"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Local stories
            </p>
            <h1
              className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
              id="blogs-heading"
            >
              All Blogs
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Discover the latest ideas and stories saved in this browser.
            </p>
          </div>

          <Link
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            to="/write"
          >
            Write a Post
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <BlogCard
                index={index}
                key={post.id}
                post={post}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl text-indigo-700"
            >
              ✍
            </span>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">
              No posts yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Your local writing space is ready. Create the first post and
              give your ideas a place to grow.
            </p>
            <Link
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              to="/write"
            >
              Write your first post
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}