import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { redirectPathForRole } from '../utils/auth';
import { getAvatar } from './Avatar';

export default function PublicNavbar({ session = null }) {
  const dashboardPath = session
    ? redirectPathForRole(session.role)
    : '/blogs';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav
        aria-label="Public navigation"
        className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-md text-lg font-bold tracking-tight text-slate-900 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          to="/"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-base font-bold text-white"
          >
            W
          </span>
          <span>WriteSpace</span>
        </Link>

        {session ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              {getAvatar(session.role, 'sm')}
              <span className="max-w-40 truncate text-sm font-medium text-slate-700">
                {session.displayName}
              </span>
            </div>

            <Link
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              to={dashboardPath}
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-4"
              to="/login"
            >
              Login
            </Link>
            <Link
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-4"
              to="/register"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

PublicNavbar.propTypes = {
  session: PropTypes.shape({
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['admin', 'user']).isRequired,
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }),
};

PublicNavbar.defaultProps = {
  session: null,
};