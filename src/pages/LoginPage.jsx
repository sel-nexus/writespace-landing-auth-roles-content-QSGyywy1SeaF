import { useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import {
  getSession,
  login,
  redirectPathForRole,
} from '../utils/auth';

const INITIAL_FORM = {
  username: '',
  password: '',
};

export default function LoginPage() {
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
      const result = login(form);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setSubmitError(result.message ?? '');
        return;
      }

      const destination =
        result.redirectTo ||
        redirectPathForRole(result.session?.role);

      navigate(destination, { replace: true });
    } catch {
      setSubmitError(
        'Unable to log in right now. Please try again.',
      );
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-12 sm:px-6">
      <section
        aria-labelledby="login-heading"
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
              id="login-heading"
            >
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Log in to continue to your local writing space.
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
                htmlFor="username"
              >
                Username
              </label>
              <input
                aria-describedby={
                  fieldErrors.username
                    ? 'username-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.username)}
                autoComplete="username"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="username"
                name="username"
                onChange={handleChange}
                placeholder="Enter your username"
                type="text"
                value={form.username}
              />
              {fieldErrors.username && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="username-error"
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
                    ? 'password-error'
                    : undefined
                }
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="current-password"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="password"
                name="password"
                onChange={handleChange}
                placeholder="Enter your password"
                type="password"
                value={form.password}
              />
              {fieldErrors.password && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="password-error"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              type="submit"
            >
              Log in
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-center text-xs leading-5 text-slate-500">
            Demo administrator credentials:{' '}
            <span className="font-semibold text-slate-700">
              admin / admin
            </span>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Do not have a local account?{' '}
            <Link
              className="font-semibold text-indigo-700 transition hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              to="/register"
            >
              Create one
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