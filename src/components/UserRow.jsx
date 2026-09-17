import PropTypes from 'prop-types';
import { getAvatar } from './Avatar';

const DEFAULT_ADMIN_ID = 'admin-fixed-id';

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

function getDeleteProtection(user, currentSession) {
  if (user.id === DEFAULT_ADMIN_ID) {
    return 'Default admin cannot be deleted.';
  }

  if (currentSession && currentSession.userId === user.id) {
    return 'You cannot delete your own account.';
  }

  return '';
}

export default function UserRow({ user, currentSession, onDelete }) {
  const deleteProtection = getDeleteProtection(user, currentSession);
  const deleteDisabled = deleteProtection.length > 0;
  const deleteLabel = `Delete ${user.displayName}`;
  const deleteTitle = deleteDisabled
    ? deleteProtection
    : `Delete ${user.displayName}`;
  const roleLabel = user.role === 'admin' ? 'Admin' : 'User';
  const roleClasses =
    user.role === 'admin'
      ? 'bg-violet-100 text-violet-700 ring-violet-200'
      : 'bg-indigo-100 text-indigo-700 ring-indigo-200';
  const joinedDate = formatDate(user.createdAt);

  const handleDelete = () => {
    if (!deleteDisabled) {
      onDelete(user.id);
    }
  };

  const deleteButton = (
    <span className="inline-flex" title={deleteTitle}>
      <button
        aria-label={deleteLabel}
        className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        disabled={deleteDisabled}
        onClick={handleDelete}
        type="button"
      >
        Delete
      </button>
    </span>
  );

  return (
    <>
      <tr className="hidden border-b border-slate-100 last:border-b-0 md:table-row">
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            {getAvatar(user.role, 'sm')}
            <span className="font-medium text-slate-900">
              {user.displayName}
            </span>
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-slate-600">
          @{user.username}
        </td>
        <td className="px-5 py-4">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleClasses}`}
          >
            {roleLabel}
          </span>
        </td>
        <td className="px-5 py-4 text-sm text-slate-600">
          <time dateTime={user.createdAt || undefined}>{joinedDate}</time>
        </td>
        <td className="px-5 py-4 text-right">{deleteButton}</td>
      </tr>

      <tr className="border-b border-slate-100 last:border-b-0 md:hidden">
        <td className="p-4" colSpan={5}>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              {getAvatar(user.role, 'md')}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {user.displayName}
                </p>
                <p className="mt-1 truncate text-sm text-slate-500">
                  @{user.username}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleClasses}`}
              >
                {roleLabel}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Joined
                </p>
                <time
                  className="mt-1 block text-sm text-slate-600"
                  dateTime={user.createdAt || undefined}
                >
                  {joinedDate}
                </time>
              </div>
              {deleteButton}
            </div>
          </article>
        </td>
      </tr>
    </>
  );
}

UserRow.propTypes = {
  currentSession: PropTypes.shape({
    displayName: PropTypes.string,
    role: PropTypes.oneOf(['admin', 'user']),
    userId: PropTypes.string.isRequired,
    username: PropTypes.string,
  }),
  onDelete: PropTypes.func.isRequired,
  user: PropTypes.shape({
    createdAt: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['admin', 'user']).isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
};

UserRow.defaultProps = {
  currentSession: null,
};