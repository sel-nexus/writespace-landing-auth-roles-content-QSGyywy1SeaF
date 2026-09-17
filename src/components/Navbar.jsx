import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession } from '../utils/auth';
import { getAvatar } from './Avatar';

const BASE_LINK_CLASSES =
  'inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2';

function getNavLinkClasses({ isActive }) {
  return `${BASE_LINK_CLASSES} ${
    isActive
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;
}

export default function Navbar({ session, onLogout = null }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const homePath = session.role === 'admin' ? '/admin' : '/blogs';

  const closeMenus = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const handleMenuToggle = () => {
    setMenuOpen((isOpen) => !isOpen);
    setDropdownOpen(false);
  };

  const handleDropdownToggle = () => {
    setDropdownOpen((isOpen) => !isOpen);
    setLogoutError('');
  };

  const handleLogout = () => {
    const result = clearSession();

    if (!result.ok) {
      setLogoutError(
        result.message || 'Unable to log out. Please try again.',
      );
      return;
    }

    closeMenus();
    setLogoutError('');

    if (onLogout) {
      onLogout();
    }

    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav
        aria-label="Authenticated navigation"
        className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 md:flex-nowrap lg:px-8"
      >
        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-md text-lg font-bold tracking-tight text-slate-900 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={closeMenus}
          to={homePath}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-base font-bold text-white"
          >
            W
          </span>
          <span>WriteSpace</span>
        </Link>

        <button
          aria-controls="authenticated-navigation-menu"
          aria-expanded={menuOpen}
          aria-label={
            menuOpen ? 'Close navigation menu' : 'Open navigation menu'
          }
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 md:hidden"
          onClick={handleMenuToggle}
          type="button"
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>

        <div
          className={`${
            menuOpen ? 'flex' : 'hidden'
          } w-full flex-col gap-3 border-t border-slate-100 pt-3 md:flex md:w-auto md:flex-1 md:flex-row md:items-center md:justify-between md:border-0 md:pt-0`}
          id="authenticated-navigation-menu"
        >
          <div className="flex flex-col gap-1 md:ml-6 md:flex-row md:items-center md:gap-2">
            <NavLink
              className={getNavLinkClasses}
              end
              onClick={closeMenus}
              to="/blogs"
            >
              All Blogs
            </NavLink>
            <NavLink
              className={getNavLinkClasses}
              onClick={closeMenus}
              to="/write"
            >
              Write
            </NavLink>
            {session.role === 'admin' && (
              <NavLink
                className={getNavLinkClasses}
                onClick={closeMenus}
                to="/users"
              >
                Users
              </NavLink>
            )}
          </div>

          <div className="relative border-t border-slate-100 pt-3 md:border-0 md:pt-0">
            <button
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              aria-label={`Account menu for ${session.displayName}`}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 md:w-auto"
              onClick={handleDropdownToggle}
              type="button"
            >
              {getAvatar(session.role, 'sm')}
              <span className="min-w-0 flex-1 md:max-w-40">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {session.displayName}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  @{session.username}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`text-xs text-slate-500 transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            {dropdownOpen && (
              <div
                aria-label="Account actions"
                className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg md:absolute md:right-0 md:top-full md:z-50 md:w-64"
                role="menu"
              >
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {session.displayName}
                  </p>
                  <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                    {session.role}
                  </p>
                </div>

                <button
                  className="mt-2 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  onClick={handleLogout}
                  role="menuitem"
                  type="button"
                >
                  Logout
                </button>

                {logoutError && (
                  <p
                    className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                    role="alert"
                  >
                    {logoutError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

Navbar.propTypes = {
  onLogout: PropTypes.func,
  session: PropTypes.shape({
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['admin', 'user']).isRequired,
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
};

Navbar.defaultProps = {
  onLogout: null,
};