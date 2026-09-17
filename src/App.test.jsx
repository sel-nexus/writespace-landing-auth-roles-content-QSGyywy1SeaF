import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { setSession } from './utils/auth';

const USER_SESSION = {
  userId: 'user-1',
  username: 'writer',
  displayName: 'Local Writer',
  role: 'user',
};

const ADMIN_SESSION = {
  userId: 'admin-fixed-id',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

function renderApp(initialPath) {
  globalThis.history.replaceState({}, '', initialPath);
  return render(<App />);
}

describe('App routing', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
    globalThis.history.replaceState({}, '', '/');
  });

  it.each([
    ['/', 'A quiet place to turn thoughts into stories.'],
    ['/login', 'Welcome back'],
    ['/register', 'Create your account'],
  ])(
    'allows guests to access the public route %s',
    (path, headingName) => {
      renderApp(path);

      expect(
        screen.getByRole('heading', { name: headingName }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('navigation', {
          name: 'Public navigation',
        }),
      ).toBeInTheDocument();
    },
  );

  it.each(['/blogs', '/write', '/blog/missing-post', '/admin', '/users'])(
    'redirects a guest from protected route %s to login',
    async (path) => {
      renderApp(path);

      expect(
        await screen.findByRole('heading', {
          name: 'Welcome back',
        }),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(globalThis.location.pathname).toBe('/login');
      });

      expect(
        screen.getByRole('navigation', {
          name: 'Public navigation',
        }),
      ).toBeInTheDocument();
    },
  );

  it.each(['/admin', '/users'])(
    'redirects a standard user from admin-only route %s to blogs',
    async (path) => {
      expect(setSession(USER_SESSION)).toEqual({ ok: true });

      renderApp(path);

      expect(
        await screen.findByRole('heading', {
          name: 'All Blogs',
        }),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(globalThis.location.pathname).toBe('/blogs');
      });

      expect(
        screen.getByRole('navigation', {
          name: 'Authenticated navigation',
        }),
      ).toBeInTheDocument();
    },
  );

  it.each([
    ['/login', ADMIN_SESSION, 'Admin Dashboard', '/admin'],
    ['/register', USER_SESSION, 'All Blogs', '/blogs'],
  ])(
    'redirects an authenticated visitor away from auth route %s',
    async (path, session, destinationHeading, destinationPath) => {
      expect(setSession(session)).toEqual({ ok: true });

      renderApp(path);

      expect(
        await screen.findByRole('heading', {
          name: destinationHeading,
        }),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(globalThis.location.pathname).toBe(destinationPath);
      });

      expect(
        screen.getByRole('navigation', {
          name: 'Authenticated navigation',
        }),
      ).toBeInTheDocument();
    },
  );

  it('switches from public to authenticated navigation after entering the user dashboard', async () => {
    const user = userEvent.setup();

    expect(setSession(USER_SESSION)).toEqual({ ok: true });

    renderApp('/');

    expect(
      screen.getByRole('navigation', {
        name: 'Public navigation',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Go to Dashboard',
      }),
    ).toHaveAttribute('href', '/blogs');

    await user.click(
      screen.getByRole('link', {
        name: 'Go to Dashboard',
      }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'All Blogs',
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', {
          name: 'Authenticated navigation',
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('navigation', {
          name: 'Public navigation',
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('allows an administrator to access the admin dashboard', () => {
    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });

    renderApp('/admin');

    expect(
      screen.getByRole('heading', {
        name: 'Admin Dashboard',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', {
        name: 'Authenticated navigation',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Users' }),
    ).toHaveAttribute('href', '/users');
  });

  it('redirects an unknown route to the landing page', async () => {
    renderApp('/route-that-does-not-exist');

    expect(
      await screen.findByRole('heading', {
        name: 'A quiet place to turn thoughts into stories.',
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(globalThis.location.pathname).toBe('/');
    });

    expect(
      screen.getByRole('navigation', {
        name: 'Public navigation',
      }),
    ).toBeInTheDocument();
  });
});