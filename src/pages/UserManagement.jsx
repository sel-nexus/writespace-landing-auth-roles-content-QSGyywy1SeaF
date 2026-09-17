import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import UserRow from '../components/UserRow';
import {
  ADMIN_USER,
  getSession,
} from '../utils/auth';
import {
  createManagedUser,
  deleteManagedUser,
  getUsers,
} from '../utils/storage';

const INITIAL_FORM = {
  displayName: '',
  username: '',
  password: '',
  role: 'user',
};

const DEFAULT_ADMIN = {
  id: ADMIN_USER.userId,
  displayName: ADMIN_USER.displayName,
  username: ADMIN_USER.username,
  role: ADMIN_USER.role,
  createdAt: '',
};

function isDisplayableUser(user) {
  return Boolean(
    user &&
      typeof user === 'object' &&
      typeof user.id === 'string' &&
      user.id.length > 0 &&
      user.id !== ADMIN_USER.userId &&
      typeof user.displayName === 'string' &&
      user.displayName.trim().length > 0 &&
      typeof user.username === 'string' &&
      user.username.trim().length > 0 &&
      (user.role === 'admin' || user.role === 'user'),
  );
}

function loadUsers() {
  return getUsers().filter(isDisplayableUser);
}

export default function UserManagement() {
  const [session] = useState(() => getSession());
  const [users, setUsers] = useState(loadUsers);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (session.role !== 'admin') {
    return <Navigate replace to="/blogs" />;
  }

  const displayedUsers = [DEFAULT_ADMIN, ...users];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
    setSubmitError('');
    setStatusMessage('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFieldErrors({});
    setSubmitError('');
    setDeleteError('');
    setStatusMessage('');

    try {
      const result = createManagedUser(form);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setSubmitError(
          result.message ||
            'Unable to create this user. Please try again.',
        );
        return;
      }

      setUsers((currentUsers) => [...currentUsers, result.user]);
      setForm(INITIAL_FORM);
      setStatusMessage(
        `${result.user.displayName} was created successfully.`,
      );
    } catch {
      setSubmitError(
        'Unable to create this user right now. Please try again.',
      );
    }
  };

  const handleDelete = (userId) => {
    setDeleteError('');
    setSubmitError('');
    setStatusMessage('');

    const targetUser =
      displayedUsers.find((user) => user.id === userId) ?? null;

    if (!targetUser) {
      setDeleteError('User not found.');
      return;
    }

    const confirmed =
      typeof globalThis.confirm === 'function' &&
      globalThis.confirm(
        `Delete "${targetUser.displayName}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      const result = deleteManagedUser(userId, session);

      if (!result.ok) {
        if (result.errorCode === 'USER_NOT_FOUND') {
          setUsers((currentUsers) =>
            currentUsers.filter((user) => user.id !== userId),
          );
        }

        setDeleteError(
          result.message ||
            'Unable to delete this user. Please try again.',
        );
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userId),
      );
      setStatusMessage(`${targetUser.displayName} was deleted.`);
    } catch {
      setDeleteError(
        'Unable to delete this user right now. Please try again.',
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section
        aria-labelledby="user-management-heading"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Administration
            </p>
            <h1
              className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
              id="user-management-heading"
            >
              User Management
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Create local accounts, assign roles, and manage users stored
              in this browser.
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-lg text-violet-700"
            >
              ♟
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                Total accounts
              </p>
              <p className="text-xl font-bold text-violet-800">
                {displayedUsers.length}
              </p>
            </div>
          </div>
        </div>

        <section
          aria-labelledby="create-user-heading"
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2
            className="text-xl font-semibold text-slate-900"
            id="create-user-heading"
          >
            Create User
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add a standard user or administrator to this local
            WriteSpace installation.
          </p>

          {submitError && (
            <div
              className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <form
            className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
            noValidate
            onSubmit={handleSubmit}
          >
            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="managed-display-name"
              >
                Display name
              </label>
              <input
                aria-describedby={
                  fieldErrors.displayName
                    ? 'managed-display-name-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.displayName)}
                autoComplete="off"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="managed-display-name"
                name="displayName"
                onChange={handleChange}
                placeholder="Enter a display name"
                type="text"
                value={form.displayName}
              />
              {fieldErrors.displayName && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="managed-display-name-error"
                >
                  {fieldErrors.displayName}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="managed-username"
              >
                Username
              </label>
              <input
                aria-describedby={
                  fieldErrors.username
                    ? 'managed-username-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.username)}
                autoCapitalize="none"
                autoComplete="off"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="managed-username"
                name="username"
                onChange={handleChange}
                placeholder="Choose a username"
                spellCheck={false}
                type="text"
                value={form.username}
              />
              {fieldErrors.username && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="managed-username-error"
                >
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="managed-password"
              >
                Password
              </label>
              <input
                aria-describedby={
                  fieldErrors.password
                    ? 'managed-password-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="new-password"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="managed-password"
                name="password"
                onChange={handleChange}
                placeholder="Create a password"
                type="password"
                value={form.password}
              />
              {fieldErrors.password && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="managed-password-error"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="managed-role"
              >
                Role
              </label>
              <select
                aria-describedby={
                  fieldErrors.role ? 'managed-role-error' : undefined
                }
                aria-invalid={Boolean(fieldErrors.role)}
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="managed-role"
                name="role"
                onChange={handleChange}
                value={form.role}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {fieldErrors.role && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="managed-role-error"
                >
                  {fieldErrors.role}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 xl:col-span-4">
              <button
                className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                type="submit"
              >
                Create User
              </button>
            </div>
          </form>

          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            Demo only: account details and passwords are stored locally
            without encryption. Do not use a real password.
          </p>
        </section>

        <section
          aria-labelledby="accounts-heading"
          className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-6 py-5">
            <h2
              className="text-xl font-semibold text-slate-900"
              id="accounts-heading"
            >
              Local Accounts
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The built-in administrator is always available and cannot be
              deleted.
            </p>
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                WriteSpace local user accounts
              </caption>
              <thead className="hidden bg-slate-50 md:table-header-group">
                <tr className="border-b border-slate-200">
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    scope="col"
                  >
                    Name
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    scope="col"
                  >
                    Username
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    scope="col"
                  >
                    Role
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    scope="col"
                  >
                    Joined
                  </th>
                  <th
                    className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                    scope="col"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((user) => (
                  <UserRow
                    currentSession={session}
                    key={user.id}
                    onDelete={handleDelete}
                    user={user}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}