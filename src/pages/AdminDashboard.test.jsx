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
  getPosts,
  savePosts,
  saveUsers,
} from '../utils/storage';
import AdminDashboard from './AdminDashboard';

const ADMIN_SESSION = {
  userId: 'admin-fixed-id',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

const USER_SESSION = {
  userId: 'user-1',
  username: 'writer',
  displayName: 'Local Writer',
  role: 'user',
};

const POST = {
  id: 'post-1',
  title: 'Writing locally with confidence',
  content: 'A practical guide to keeping content in the browser.',
  createdAt: '2026-09-17T12:00:00.000Z',
  authorId: USER_SESSION.userId,
  authorName: USER_SESSION.displayName,
};

const POSTS = Array.from({ length: 6 }, (_, index) => ({
  id: `post-${index + 1}`,
  title: `Post ${index + 1}`,
  content: `Content for post ${index + 1}.`,
  createdAt: `2026-09-${String(index + 10).padStart(
    2,
    '0',
  )}T12:00:00.000Z`,
  authorId: USER_SESSION.userId,
  authorName: USER_SESSION.displayName,
}));

function renderAdminDashboard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/blogs" element={<h1>Blogs page</h1>} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/write" element={<h1>Write page</h1>} />
        <Route path="/users" element={<h1>Users page</h1>} />
        <Route path="/blog/:id" element={<h1>Post page</h1>} />
        <Route path="/edit/:id" element={<h1>Edit page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

function expectStatValue(label, value) {
  const labelElement = screen.getByText(label);
  const statCard = labelElement.closest('article');

  expect(statCard).not.toBeNull();
  expect(within(statCard).getByText(String(value))).toBeInTheDocument();
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  it('renders all dashboard statistics from valid local posts and users', () => {
    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });
    expect(
      savePosts([
        POST,
        {
          ...POST,
          id: 'post-2',
          title: 'A second local post',
        },
        {
          ...POST,
          id: '',
          title: 'Malformed post',
        },
      ]),
    ).toEqual({ ok: true });
    expect(
      saveUsers([
        {
          id: 'managed-admin-1',
          displayName: 'Managed Admin',
          username: 'managed_admin',
          password: 'local-password',
          role: 'admin',
          createdAt: '2026-09-15T12:00:00.000Z',
        },
        {
          id: 'user-2',
          displayName: 'Second Writer',
          username: 'second_writer',
          password: 'local-password',
          role: 'user',
          createdAt: '2026-09-16T12:00:00.000Z',
        },
        {
          id: 'unsupported-user',
          displayName: 'Unsupported User',
          username: 'unsupported',
          password: 'local-password',
          role: 'editor',
          createdAt: '2026-09-16T12:00:00.000Z',
        },
        null,
      ]),
    ).toEqual({ ok: true });

    renderAdminDashboard();

    expect(
      screen.getByRole('heading', { name: 'Admin Dashboard' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Welcome back, Admin. Review local activity and manage WriteSpace from one place.',
      ),
    ).toBeInTheDocument();
    expectStatValue('Total Posts', 2);
    expectStatValue('Total Users', 3);
    expectStatValue('Administrators', 2);
    expectStatValue('Standard Users', 1);
  });

  it('renders each quick action with the expected destination', () => {
    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });

    renderAdminDashboard();

    expect(
      screen.getByRole('link', { name: 'Write a Post' }),
    ).toHaveAttribute('href', '/write');
    expect(
      screen.getByRole('link', { name: 'Manage Users' }),
    ).toHaveAttribute('href', '/users');
    expect(
      screen.getByRole('link', { name: 'View All Blogs' }),
    ).toHaveAttribute('href', '/blogs');
  });

  it('shows only the five newest posts in newest-first order', () => {
    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });
    expect(savePosts(POSTS)).toEqual({ ok: true });

    renderAdminDashboard();

    const recentPostsHeading = screen.getByRole('heading', {
      name: 'Recent Posts',
    });
    const recentPostsSection = recentPostsHeading.closest('section');
    const postItems =
      within(recentPostsSection).getAllByRole('listitem');

    expect(postItems).toHaveLength(5);
    expect(
      postItems.map(
        (item) => within(item).getAllByRole('link')[0].textContent,
      ),
    ).toEqual(['Post 6', 'Post 5', 'Post 4', 'Post 3', 'Post 2']);
    expect(
      within(recentPostsSection).queryByRole('link', {
        name: 'Post 1',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(recentPostsSection).getAllByRole('link', {
        name: 'Edit',
      }),
    ).toHaveLength(5);
    expect(
      within(recentPostsSection).getAllByRole('button', {
        name: /^Delete Post /,
      }),
    ).toHaveLength(5);
  });

  it('renders admin edit and delete controls for another user post', () => {
    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });
    expect(savePosts([POST])).toEqual({ ok: true });

    renderAdminDashboard();

    expect(screen.getByRole('link', { name: POST.title })).toHaveAttribute(
      'href',
      '/blog/post-1',
    );
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/edit/post-1',
    );
    expect(
      screen.getByRole('button', {
        name: `Delete ${POST.title}`,
      }),
    ).toBeInTheDocument();
  });

  it('keeps a post when the administrator cancels deletion', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValue(false);

    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });
    expect(savePosts([POST])).toEqual({ ok: true });

    renderAdminDashboard();

    await user.click(
      screen.getByRole('button', {
        name: `Delete ${POST.title}`,
      }),
    );

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith(
      `Delete "${POST.title}"? This action cannot be undone.`,
    );
    expect(getPosts()).toEqual([POST]);
    expect(
      screen.getByRole('link', { name: POST.title }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('deletes a post after confirmation and updates the dashboard', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValue(true);

    expect(setSession(ADMIN_SESSION)).toEqual({ ok: true });
    expect(savePosts([POST])).toEqual({ ok: true });

    renderAdminDashboard();

    await user.click(
      screen.getByRole('button', {
        name: `Delete ${POST.title}`,
      }),
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      `Delete "${POST.title}"? This action cannot be undone.`,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      `"${POST.title}" was deleted.`,
    );
    expect(getPosts()).toEqual([]);
    expectStatValue('Total Posts', 0);
    expect(
      screen.getByRole('heading', { name: 'No posts yet' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: POST.title }),
    ).not.toBeInTheDocument();
  });

  it('redirects guests and standard users away from the dashboard', () => {
    const guestRender = renderAdminDashboard();

    expect(
      screen.getByRole('heading', { name: 'Login page' }),
    ).toBeInTheDocument();

    guestRender.unmount();

    expect(setSession(USER_SESSION)).toEqual({ ok: true });

    renderAdminDashboard();

    expect(
      screen.getByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Admin Dashboard' }),
    ).not.toBeInTheDocument();
  });
});