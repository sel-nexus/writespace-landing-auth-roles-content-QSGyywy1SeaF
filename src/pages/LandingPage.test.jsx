import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  getSession,
  redirectPathForRole,
} from '../utils/auth';
import { getPosts } from '../utils/storage';
import LandingPage from './LandingPage';

vi.mock('../utils/auth', () => ({
  getSession: vi.fn(),
  redirectPathForRole: vi.fn(),
}));

vi.mock('../utils/storage', () => ({
  getPosts: vi.fn(),
}));

const POSTS = [
  {
    id: 'post-oldest',
    title: 'Oldest post',
    content: 'This post should not appear in the latest preview.',
    createdAt: '2026-09-13T12:00:00.000Z',
    authorId: 'user-1',
    authorName: 'First Writer',
  },
  {
    id: 'post-newest',
    title: 'Newest post',
    content: 'The newest local story.',
    createdAt: '2026-09-17T12:00:00.000Z',
    authorId: 'user-2',
    authorName: 'Newest Writer',
  },
  {
    id: 'post-third',
    title: 'Third newest post',
    content: 'The third newest local story.',
    createdAt: '2026-09-15T12:00:00.000Z',
    authorId: 'user-3',
    authorName: 'Third Writer',
  },
  {
    id: 'post-second',
    title: 'Second newest post',
    content: 'The second newest local story.',
    createdAt: '2026-09-16T12:00:00.000Z',
    authorId: 'user-4',
    authorName: 'Second Writer',
  },
];

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    getSession.mockReturnValue(null);
    getPosts.mockReturnValue([]);
    redirectPathForRole.mockImplementation((role) =>
      role === 'admin' ? '/admin' : '/blogs',
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders public branding and guest calls to action', () => {
    renderLandingPage();

    expect(
      screen.getByRole('heading', {
        name: 'A quiet place to turn thoughts into stories.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /WriteSpace is a local-first blogging experience/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Start Writing' }),
    ).toHaveAttribute('href', '/register');
    expect(
      screen.getByRole('link', { name: 'Explore WriteSpace' }),
    ).toHaveAttribute('href', '/login');
    expect(
      screen.getByRole('link', { name: 'Get Started Free' }),
    ).toHaveAttribute('href', '/register');
    expect(
      screen.getByRole('link', { name: 'WriteSpace' }),
    ).toHaveAttribute('href', '/');
  });

  it('uses role-aware destinations for an authenticated visitor', () => {
    getSession.mockReturnValue({
      userId: 'admin-fixed-id',
      username: 'admin',
      displayName: 'Admin',
      role: 'admin',
    });

    renderLandingPage();

    expect(redirectPathForRole).toHaveBeenCalledWith('admin');
    expect(
      screen.getByText('Welcome back, Admin.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Open Admin Dashboard' }),
    ).toHaveAttribute('href', '/admin');
    expect(
      screen.getByRole('link', { name: 'Browse All Posts' }),
    ).toHaveAttribute('href', '/blogs');
    expect(
      screen.getByRole('link', { name: 'Write a Post' }),
    ).toHaveAttribute('href', '/write');
  });

  it('shows only the three newest posts in newest-first order', () => {
    getPosts.mockReturnValue(POSTS);

    renderLandingPage();

    const latestPostsHeading = screen.getByRole('heading', {
      name: 'Latest posts',
    });
    const latestPostsSection = latestPostsHeading.closest('section');
    const previewHeadings = within(latestPostsSection).getAllByRole(
      'heading',
      { level: 3 },
    );

    expect(previewHeadings.map((heading) => heading.textContent)).toEqual([
      'Newest post',
      'Second newest post',
      'Third newest post',
    ]);
    expect(
      within(latestPostsSection).queryByText('Oldest post'),
    ).not.toBeInTheDocument();
  });

  it('routes guest post previews to login instead of protected blog pages', () => {
    getPosts.mockReturnValue([POSTS[1]]);

    renderLandingPage();

    expect(
      screen.getByRole('link', { name: 'Newest post' }),
    ).toHaveAttribute('href', '/login');
    expect(
      screen.getByRole('link', { name: 'Read Newest post' }),
    ).toHaveAttribute('href', '/login');
    expect(
      screen.getByRole('link', { name: 'View all posts' }),
    ).toHaveAttribute('href', '/login');
  });

  it('renders the empty-state copy and registration action when no posts exist', () => {
    renderLandingPage();

    expect(
      screen.getByRole('heading', { name: 'No posts yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This browser does not have any saved posts. Be the first to give WriteSpace a story.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/register');
    expect(
      screen.queryByRole('link', { name: 'View all posts' }),
    ).not.toBeInTheDocument();
  });
});