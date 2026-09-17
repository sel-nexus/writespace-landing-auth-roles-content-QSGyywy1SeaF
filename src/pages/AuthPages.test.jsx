import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import {
  getSession,
  setSession,
} from '../utils/auth';
import {
  getUsers,
  saveUsers,
} from '../utils/storage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

const STORED_USER = {
  id: 'user-1',
  displayName: 'Local Writer',
  username: 'writer',
  password: 'local-password',
  role: 'user',
  createdAt: '2026-09-17T10:00:00.000Z',
};

const USER_SESSION = {
  userId: STORED_USER.id,
  username: STORED_USER.username,
  displayName: STORED_USER.displayName,
  role: 'user',
};

const ADMIN_SESSION = {
  userId: 'admin-fixed-id',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

function renderAuthPage(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/blogs" element={<h1>Blogs page</h1>} />
        <Route path="/admin" element={<h1>Admin dashboard</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function completeRegistrationForm(
  user,
  {
    displayName = 'Jane Demo',
    username = 'jane_demo',
    password = 'local-password',
  } = {},
) {
  await user.type(
    screen.getByRole('textbox', { name: 'Display name' }),
    displayName,
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Username' }),
    username,
  );
  await user.type(
    screen.getByLabelText('Password'),
    password,
  );
  await user.type(
    screen.getByLabelText('Confirm password'),
    password,
  );
}

describe('authentication pages', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  it('shows an error and does not create a session for invalid login credentials', async () => {
    const user = userEvent.setup();

    renderAuthPage('/login');

    await user.type(
      screen.getByRole('textbox', { name: 'Username' }),
      'unknown-user',
    );
    await user.type(
      screen.getByLabelText('Password'),
      'incorrect-password',
    );
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Invalid username or password.');
    expect(getSession()).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
  });

  it('logs in a stored user and routes to the blogs page', async () => {
    const user = userEvent.setup();

    expect(saveUsers([STORED_USER])).toEqual({ ok: true });
    renderAuthPage('/login');

    await user.type(
      screen.getByRole('textbox', { name: 'Username' }),
      '  WRITER  ',
    );
    await user.type(
      screen.getByLabelText('Password'),
      STORED_USER.password,
    );
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();
    expect(getSession()).toEqual(USER_SESSION);
  });

  it('logs in the default administrator and routes to the admin dashboard', async () => {
    const user = userEvent.setup();

    renderAuthPage('/login');

    await user.type(
      screen.getByRole('textbox', { name: 'Username' }),
      'admin',
    );
    await user.type(
      screen.getByLabelText('Password'),
      'admin',
    );
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Admin dashboard',
      }),
    ).toBeInTheDocument();
    expect(getSession()).toEqual(ADMIN_SESSION);
  });

  it('prevents registration with an existing username', async () => {
    const user = userEvent.setup();

    expect(saveUsers([STORED_USER])).toEqual({ ok: true });
    renderAuthPage('/register');

    await completeRegistrationForm(user, {
      username: ' WRITER ',
    });
    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(
      await screen.findByText('Username already exists.'),
    ).toBeInTheDocument();
    expect(getUsers()).toEqual([STORED_USER]);
    expect(getSession()).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument();
  });

  it('registers a user, persists the account and session, and routes to blogs', async () => {
    const user = userEvent.setup();

    renderAuthPage('/register');

    await completeRegistrationForm(user, {
      displayName: '  Jane Demo  ',
      username: '  jane_demo  ',
      password: 'new-local-password',
    });
    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();

    const storedUsers = getUsers();

    expect(storedUsers).toHaveLength(1);
    expect(storedUsers[0]).toEqual({
      id: expect.any(String),
      displayName: 'Jane Demo',
      username: 'jane_demo',
      password: 'new-local-password',
      role: 'user',
      createdAt: expect.any(String),
    });
    expect(getSession()).toEqual({
      userId: storedUsers[0].id,
      username: 'jane_demo',
      displayName: 'Jane Demo',
      role: 'user',
    });
  });

  it.each([
    [
      'login page for an administrator',
      '/login',
      ADMIN_SESSION,
      'Admin dashboard',
    ],
    [
      'registration page for a standard user',
      '/register',
      USER_SESSION,
      'Blogs page',
    ],
  ])(
    'redirects away from the %s when a session already exists',
    async (_, initialPath, session, destinationHeading) => {
      expect(setSession(session)).toEqual({ ok: true });

      renderAuthPage(initialPath);

      expect(
        await screen.findByRole('heading', {
          name: destinationHeading,
        }),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', {
            name:
              initialPath === '/login'
                ? 'Welcome back'
                : 'Create your account',
          }),
        ).not.toBeInTheDocument();
      });
    },
  );
});