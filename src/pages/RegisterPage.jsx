import { useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import {
  getSession,
  redirectPathForRole,
  registerUser,
} from '../utils/auth';

const INITIAL_FORM = {
  displayName: '',
  username: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [existingSession] = useState(() => getSession());
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  if (existingSession) {
    return (
      <Navigate
        replace
        to={redirectPathForRole(existingSession.role)}
      />
    );
  }

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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFieldErrors({});
    setSubmitError('');

    try {
      const result = registerUser(form);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setSubmitError(result.message ?? '');
        return;
      }

      navigate(result.redirectTo || '/blogs', { replace: true });
    } catch {
      setSubmitError(
        'Unable to create your account right now. Please try again.',
      );
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-12 sm:px-6">
      <section
        aria-labelledby="register-heading"
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <div className="text-center">
            <span
              aria-hidden="true"
              className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white"
            >
              W
            </span>
            <h1
              className="mt-5 text-3xl font-bold tracking-tight text-slate-950"
              id="register-heading"
            >
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Set up a local account and start writing in your browser.
            </p>
          </div>

          {submitError && (
            <div
              className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <form
            className="mt-7 space-y-5"
            noValidate
            onSubmit={handleSubmit}
          >
            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="displayName"
              >
                Display name
              </label>
              <input
                aria-describedby={
                  fieldErrors.displayName
                    ? 'display-name-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.displayName)}
                autoComplete="name"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="displayName"
                name="displayName"
                onChange={handleChange}
                placeholder="Enter your display name"
                type="text"
                value={form.displayName}
              />
              {fieldErrors.displayName && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="display-name-error"
                >
                  {fieldErrors.displayName}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="username"
              >
                Username
              </label>
              <input
                aria-describedby={
                  fieldErrors.username
                    ? 'register-username-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.username)}
                autoCapitalize="none"
                autoComplete="username"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="username"
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
                  id="register-username-error"
                >
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="password"
              >
                Password
              </label>
              <input
                aria-describedby={
                  fieldErrors.password
                    ? 'register-password-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="new-password"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="password"
                name="password"
                onChange={handleChange}
                placeholder="Create a password"
                type="password"
                value={form.password}
              />
              {fieldErrors.password && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="register-password-error"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="confirmPassword"
              >
                Confirm password
              </label>
              <input
                aria-describedby={
                  fieldErrors.confirmPassword
                    ? 'confirm-password-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                autoComplete="new-password"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="confirmPassword"
                name="confirmPassword"
                onChange={handleChange}
                placeholder="Enter your password again"
                type="password"
                value={form.confirmPassword}
              />
              {fieldErrors.confirmPassword && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="confirm-password-error"
                >
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              type="submit"
            >
              Create account
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            Demo only: account details and passwords are stored locally in
            this browser without encryption. Do not use a real password.
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have a local account?{' '}
            <Link
              className="font-semibold text-indigo-700 transition hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              to="/login"
            >
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          WriteSpace stores demo account data only in this browser.
        </p>
      </section>
    </main>
  );
}