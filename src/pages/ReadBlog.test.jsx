import {
  cleanup,
  render,
  screen,
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
} from '../utils/storage';
import ReadBlog from './ReadBlog';

const OWNER_SESSION = {
  userId: 'user-1',
  username: 'writer',
  displayName: 'Local Writer',
  role: 'user',
};

const OTHER_USER_SESSION = {
  userId: 'user-2',
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

const POST = {
  id: 'post-1',
  title: 'Writing locally with confidence',
  content:
    'First paragraph of the local story.\n\nSecond paragraph keeps its spacing.',
  createdAt: '2026-09-17T12:00:00.000Z',
  authorId: OWNER_SESSION.userId,
  authorName: OWNER_SESSION.displayName,
};

function renderReadBlog(initialPath = '/blog/post-1') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/blogs" element={<h1>Blogs page</h1>} />
        <Route path="/blog/:id" element={<ReadBlog />} />
        <Route path="/edit/:id" element={<h1>Edit page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ReadBlog', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  it('renders the complete post content, author, date, and navigation', () => {
    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });
    expect(savePosts([POST])).toEqual({ ok: true });

    renderReadBlog();

    expect(
      screen.getByRole('heading', {
        name: 'Writing locally with confidence',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Local Writer')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'User avatar' }),
    ).toBeInTheDocument();
    expect(screen.getByText('September 17, 2026')).toHaveAttribute(
      'datetime',
      POST.createdAt,
    );
    expect(
      screen.getByRole('link', { name: 'Back to all blogs' }),
    ).toHaveAttribute('href', '/blogs');

    const contentElement = screen.getByText(
      (_, element) =>
        element?.tagName === 'DIV' &&
        element.textContent === POST.content,
    );

    expect(contentElement).toHaveTextContent(
      'First paragraph of the local story. Second paragraph keeps its spacing.',
    );
    expect(contentElement).toHaveClass('whitespace-pre-wrap');
  });

  it('shows a safe not-found state when the requested post does not exist', () => {
    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });

    renderReadBlog('/blog/missing-post');

    expect(
      screen.getByRole('heading', { name: 'Post not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This post may have been removed, or the link may no longer be valid.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to all blogs' }),
    ).toHaveAttribute('href', '/blogs');
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('redirects a guest to login without displaying the post', () => {
    expect(savePosts([POST])).toEqual({ ok: true });

    renderReadBlog();

    expect(
      screen.getByRole('heading', { name: 'Login page' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: POST.title,
      }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['the post owner', OWNER_SESSION],
    ['an administrator', ADMIN_SESSION],
  ])('shows edit and delete actions to %s', (_, session) => {
    expect(setSession(session)).toEqual({ ok: true });
    expect(savePosts([POST])).toEqual({ ok: true });

    renderReadBlog();

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/edit/post-1',
    );
    expect(
      screen.getByRole('button', { name: 'Delete' }),
    ).toBeInTheDocument();
  });

  it('hides management actions from a user who does not own the post', () => {
    expect(setSession(OTHER_USER_SESSION)).toEqual({ ok: true });
    expect(savePosts([POST])).toEqual({ ok: true });

    renderReadBlog();

    expect(
      screen.getByRole('heading', { name: POST.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Edit' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
    expect(getPosts()).toEqual([POST]);
  });

  it('keeps the post when the owner cancels deletion confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValue(false);

    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });
    expect(savePosts([POST])).toEqual({ ok: true });

    renderReadBlog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith(
      `Delete "${POST.title}"? This action cannot be undone.`,
    );
    expect(getPosts()).toEqual([POST]);
    expect(
      screen.getByRole('heading', { name: POST.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Blogs page' }),
    ).not.toBeInTheDocument();
  });

  it('deletes the post and redirects to blogs after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValue(true);

    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });
    expect(savePosts([POST])).toEqual({ ok: true });

    renderReadBlog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalledWith(
      `Delete "${POST.title}"? This action cannot be undone.`,
    );
    expect(
      await screen.findByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();
    expect(getPosts()).toEqual([]);
    expect(
      screen.queryByRole('heading', { name: POST.title }),
    ).not.toBeInTheDocument();
  });
});