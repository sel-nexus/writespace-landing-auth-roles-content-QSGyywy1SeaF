import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { getAvatar } from './Avatar';

const ACCENT_CLASSES = [
  'border-t-indigo-500',
  'border-t-violet-500',
  'border-t-sky-500',
  'border-t-emerald-500',
];

function createExcerpt(content) {
  const normalizedContent =
    typeof content === 'string' ? content.trim().replace(/\s+/g, ' ') : '';

  if (normalizedContent.length <= 120) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, 120).trimEnd()}…`;
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

export default function BlogCard({ post, index, session, onEdit }) {
  const normalizedIndex =
    Number.isInteger(index) && index >= 0 ? index : 0;
  const accentClass =
    ACCENT_CLASSES[normalizedIndex % ACCENT_CLASSES.length];
  const canEdit =
    session &&
    (session.role === 'admin' || session.userId === post.authorId);
  const authorRole =
    post.authorId === 'admin-fixed-id' ? 'admin' : 'user';
  const readPath = `/blog/${encodeURIComponent(post.id)}`;
  const editPath = `/edit/${encodeURIComponent(post.id)}`;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(post.id);
    }
  };

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 border-t-4 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${accentClass}`}
    >
      <div className="flex flex-1 flex-col p-6">
        <time
          className="text-sm font-medium text-slate-500"
          dateTime={post.createdAt}
        >
          {formatDate(post.createdAt)}
        </time>

        <h2 className="mt-3 text-xl font-semibold leading-snug text-slate-900">
          <Link
            className="rounded-sm transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            to={readPath}
          >
            {post.title}
          </Link>
        </h2>

        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
          {createExcerpt(post.content)}
        </p>

        <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
          {getAvatar(authorRole, 'sm')}
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
            {post.authorName}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Link
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            to={readPath}
          >
            Read post
          </Link>

          {canEdit &&
            (onEdit ? (
              <button
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={handleEdit}
                type="button"
              >
                Edit
              </button>
            ) : (
              <Link
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                to={editPath}
              >
                Edit
              </Link>
            ))}
        </div>
      </div>
    </article>
  );
}

BlogCard.propTypes = {
  index: PropTypes.number,
  onEdit: PropTypes.func,
  post: PropTypes.shape({
    authorId: PropTypes.string.isRequired,
    authorName: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  session: PropTypes.shape({
    displayName: PropTypes.string,
    role: PropTypes.oneOf(['admin', 'user']).isRequired,
    userId: PropTypes.string.isRequired,
    username: PropTypes.string,
  }),
};

BlogCard.defaultProps = {
  index: 0,
  onEdit: null,
  session: null,
};