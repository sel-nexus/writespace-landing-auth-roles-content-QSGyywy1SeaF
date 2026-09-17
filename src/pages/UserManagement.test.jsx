import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import { setSession } from '../utils/auth';
import {
  getUsers,
  saveUsers,
} from '../utils/storage';
import UserManagement from './UserManagement';

const ADMIN_SESSION = {
  userId: 'admin-fixed-id',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

const MANAGED_ADMIN = {
  id: 'managed-admin-1',
  displayName: 'Managed Admin',
  username: 'managed_admin',
  password: 'local-password',
  role: 'admin',
  createdAt: '2026-09-16T12:00:00.000Z',
};

const STORED_USER = {
  id: 'user-1',
  displayName: 'Local Writer',
  username: 'writer',
  password: 'local-password',
  role: 'user',
  createdAt: '2026-09-17T12:00:00.000Z',
};

function renderUserManagement() {
  return render(
    <MemoryRouter initialEntries={['/users']}>
      <Routes>
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/blogs" element={<h1>Blogs page</h1>} />
        <Route path="/users" element={<UserManagement />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function completeCreateUserForm(
  user,
  {
    displayName = 'Jane Demo',
    username = 'jane_demo',
    password = 'local-password',
    role = 'user',
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
  await user.type(screen.getByLabelText('Password'), password);
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Role' }),
    role,
  );
}

describe('UserManagement', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  it('shows required-field validation errors without creating a user', async () => {
    const user = userEvent.setup();

    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });

    renderUserManagement();

    await user.click(
      screen.getByRole('button', { name: 'Create User' }),
    );

    expect(
      screen.getByText('Display name is required.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Username is required.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Password is required.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Display name' }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByRole('textbox', { name: 'Username' }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(getUsers()).toEqual([]);
  });

  it('rejects a duplicate username without changing persisted users', async () => {
    const user = userEvent.setup();

    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });
    expect(saveUsers([STORED_USER])).toEqual({ ok: true });

    renderUserManagement();

    await completeCreateUserForm(user, {
      displayName: 'Duplicate Writer',
      username: '  WRITER  ',
      password: 'another-password',
    });
    await user.click(
      screen.getByRole('button', { name: 'Create User' }),
    );

    expect(
      screen.getByText('Username already exists.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Username' }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(getUsers()).toEqual([STORED_USER]);
  });

  it('creates and persists a user with normalized fields and the selected role', async () => {
    const user = userEvent.setup();

    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });

    renderUserManagement();

    await completeCreateUserForm(user, {
      displayName: '  Jane Demo  ',
      username: '  jane_demo  ',
      password: 'new-local-password',
      role: 'admin',
    });
    await user.click(
      screen.getByRole('button', { name: 'Create User' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Jane Demo was created successfully.',
    );

    const storedUsers = getUsers();

    expect(storedUsers).toHaveLength(1);
    expect(storedUsers[0]).toEqual({
      id: expect.any(String),
      displayName: 'Jane Demo',
      username: 'jane_demo',
      password: 'new-local-password',
      role: 'admin',
      createdAt: expect.any(String),
    });
    expect(screen.getAllByText('Jane Demo')).toHaveLength(2);
    expect(
      screen.getByRole('textbox', { name: 'Display name' }),
    ).toHaveValue('');
    expect(
      screen.getByRole('textbox', { name: 'Username' }),
    ).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(
      screen.getByRole('combobox', { name: 'Role' }),
    ).toHaveValue('user');
  });

  it('presents each account as a desktop row and a mobile card', () => {
    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });
    expect(saveUsers([STORED_USER])).toEqual({ ok: true });

    renderUserManagement();

    const accountsTable = screen.getByRole('table', {
      name: 'WriteSpace local user accounts',
    });
    const userNames = within(accountsTable).getAllByText(
      STORED_USER.displayName,
    );

    expect(userNames).toHaveLength(2);

    const desktopRow = userNames[0].closest('tr');
    const mobileCard = userNames[1].closest('article');
    const mobileRow = mobileCard?.closest('tr');

    expect(desktopRow).not.toBeNull();
    expect(desktopRow).toHaveClass('hidden', 'md:table-row');
    expect(mobileCard).not.toBeNull();
    expect(mobileCard).toHaveClass(
      'rounded-xl',
      'border',
      'bg-white',
    );
    expect(mobileRow).not.toBeNull();
    expect(mobileRow).toHaveClass('md:hidden');
    expect(
      within(accountsTable).getAllByText('@writer'),
    ).toHaveLength(2);
    expect(
      within(accountsTable).getAllByText('Sep 17, 2026'),
    ).toHaveLength(2);
  });

  it('disables default administrator deletion with an explanatory tooltip', () => {
    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });

    renderUserManagement();

    const deleteButtons = screen.getAllByRole('button', {
      name: 'Delete Admin',
    });

    expect(deleteButtons).toHaveLength(2);

    deleteButtons.forEach((button) => {
      expect(button).toBeDisabled();
      expect(button.parentElement).toHaveAttribute(
        'title',
        'Default admin cannot be deleted.',
      );
    });
  });

  it('prevents a managed administrator from deleting their own account', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(globalThis, 'confirm');

    expect(
      setSession({
        userId: MANAGED_ADMIN.id,
        username: MANAGED_ADMIN.username,
        displayName: MANAGED_ADMIN.displayName,
        role: MANAGED_ADMIN.role,
      }),
    ).toEqual({ ok: true });
    expect(saveUsers([MANAGED_ADMIN])).toEqual({ ok: true });

    renderUserManagement();

    const deleteButtons = screen.getAllByRole('button', {
      name: `Delete ${MANAGED_ADMIN.displayName}`,
    });

    expect(deleteButtons).toHaveLength(2);

    deleteButtons.forEach((button) => {
      expect(button).toBeDisabled();
      expect(button.parentElement).toHaveAttribute(
        'title',
        'You cannot delete your own account.',
      );
    });

    await user.click(deleteButtons[0]);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(getUsers()).toEqual([MANAGED_ADMIN]);
  });

  it('deletes an eligible user after confirmation and updates persistence', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValue(true);

    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });
    expect(saveUsers([STORED_USER])).toEqual({ ok: true });

    renderUserManagement();

    await user.click(
      screen.getAllByRole('button', {
        name: `Delete ${STORED_USER.displayName}`,
      })[0],
    );

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith(
      `Delete "${STORED_USER.displayName}"? This action cannot be undone.`,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      `${STORED_USER.displayName} was deleted.`,
    );
    expect(getUsers()).toEqual([]);
    expect(
      screen.queryByRole('button', {
        name: `Delete ${STORED_USER.displayName}`,
      }),
    ).not.toBeInTheDocument();
  });

  it('redirects guests and standard users away from user management', () => {
    const guestRender = renderUserManagement();

    expect(
      screen.getByRole('heading', { name: 'Login page' }),
    ).toBeInTheDocument();

    guestRender.unmount();

    expect(
      setSession({
        userId: STORED_USER.id,
        username: STORED_USER.username,
        displayName: STORED_USER.displayName,
        role: STORED_USER.role,
      }),
    ).toEqual({ ok: true });

    renderUserManagement();

    expect(
      screen.getByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'User Management' }),
    ).not.toBeInTheDocument();
  });
});