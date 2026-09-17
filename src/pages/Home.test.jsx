import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getSession } from '../utils/auth';
import { getPosts } from '../utils/storage';
import Home from './Home';

vi.mock('../utils/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('../utils/storage', () => ({
  getPosts: vi.fn(),
}));

const POSTS = [
  {
    id: 'post-oldest',
    title: 'Oldest post',
    content: 'The oldest local story.',
    createdAt: '2026-09-15T12:00:00.000Z',
    authorId: 'user-1',
    authorName: 'Local Writer',
  },
  {
    id: 'post-newest',
    title: 'Newest post',
    content: 'The newest local story.',
    createdAt: '2026-09-17T12:00:00.000Z',
    authorId: 'user-2',
    authorName: 'Second Writer',
  },
  {
    id: 'post-middle',
    title: 'Middle post',
    content: 'The middle local story.',
    createdAt: '2026-09-16T12:00:00.000Z',
    authorId: 'user-1',
    authorName: 'Local Writer',
  },
];

const OWNER_SESSION = {
  userId: 'user-1',
  username: 'writer',
  displayName: 'Local Writer',
  role: 'user',
};

const OTHER_USER_SESSION = {
  userId: 'user-3',
  username: 'reader',
  displayName: 'Local Reader',
  role: 'user',
};

const ADMIN_SESSION = {
  userId: 'admin-fixed-id',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home', () => {
  beforeEach(() => {
    getSession.mockReturnValue(null);
    getPosts.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders posts newest-first as semantic cards in a responsive grid', () => {
    getPosts.mockReturnValue(POSTS);

    renderHome();

    const articles = screen.getAllByRole('article');

    expect(articles).toHaveLength(3);
    expect(
      articles.map(
        (article) =>
          within(article).getByRole('heading', { level: 2 }).textContent,
      ),
    ).toEqual(['Newest post', 'Middle post', 'Oldest post']);

    const grid = articles[0].parentElement;

    expect(grid).toHaveClass(
      'grid',
      'sm:grid-cols-2',
      'lg:grid-cols-3',
    );

    expect(
      within(articles[0]).getByRole('link', { name: 'Read post' }),
    ).toHaveAttribute('href', '/blog/post-newest');
  });

  it('filters malformed posts without preventing valid cards from rendering', () => {
    getPosts.mockReturnValue([
      null,
      {
        id: '',
        title: 'Missing identifier',
        content: 'Invalid post content.',
        createdAt: '2026-09-18T12:00:00.000Z',
        authorId: 'user-1',
        authorName: 'Local Writer',
      },
      POSTS[1],
    ]);

    renderHome();

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: 'Newest post' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Missing identifier'),
    ).not.toBeInTheDocument();
  });

  it('shows edit actions only for posts owned by the signed-in user', () => {
    getSession.mockReturnValue(OWNER_SESSION);
    getPosts.mockReturnValue(POSTS);

    renderHome();

    const editLinks = screen.getAllByRole('link', { name: 'Edit' });

    expect(editLinks).toHaveLength(2);
    expect(editLinks[0]).toHaveAttribute('href', '/edit/post-middle');
    expect(editLinks[1]).toHaveAttribute('href', '/edit/post-oldest');

    const newestPost = screen
      .getByRole('heading', { name: 'Newest post' })
      .closest('article');

    expect(
      within(newestPost).queryByRole('link', { name: 'Edit' }),
    ).not.toBeInTheDocument();
  });

  it('shows edit actions for every post to an administrator', () => {
    getSession.mockReturnValue(ADMIN_SESSION);
    getPosts.mockReturnValue(POSTS);

    renderHome();

    expect(screen.getAllByRole('link', { name: 'Edit' })).toHaveLength(
      POSTS.length,
    );
  });

  it('hides edit actions from a user who owns none of the posts', () => {
    getSession.mockReturnValue(OTHER_USER_SESSION);
    getPosts.mockReturnValue(POSTS);

    renderHome();

    expect(
      screen.queryByRole('link', { name: 'Edit' }),
    ).not.toBeInTheDocument();
  });

  it('renders an empty state with a write call to action when no posts exist', () => {
    renderHome();

    expect(
      screen.getByRole('heading', { name: 'No posts yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your local writing space is ready. Create the first post and give your ideas a place to grow.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Write your first post' }),
    ).toHaveAttribute('href', '/write');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});