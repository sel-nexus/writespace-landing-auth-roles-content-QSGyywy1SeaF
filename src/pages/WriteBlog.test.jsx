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
  useParams,
} from 'react-router-dom';
import { setSession } from '../utils/auth';
import {
  getPosts,
  savePosts,
} from '../utils/storage';
import WriteBlog from './WriteBlog';

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

const EXISTING_POST = {
  id: 'post-1',
  title: 'Original title',
  content: 'Original browser content.',
  createdAt: '2026-09-17T12:00:00.000Z',
  authorId: OWNER_SESSION.userId,
  authorName: OWNER_SESSION.displayName,
};

function PostPageStub() {
  const { id } = useParams();

  return <h1>Post page {id}</h1>;
}

function renderWriteBlog(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/blogs" element={<h1>Blogs page</h1>} />
        <Route path="/blog/:id" element={<PostPageStub />} />
        <Route path="/write" element={<WriteBlog />} />
        <Route path="/edit/:id" element={<WriteBlog />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WriteBlog', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  it('creates a post with trimmed title and session author metadata', async () => {
    const user = userEvent.setup();

    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });
    renderWriteBlog('/write');

    await user.type(
      screen.getByRole('textbox', { name: 'Title' }),
      '  My local post  ',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Content' }),
      'This content stays in the browser.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Publish Post' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: /^Post page /,
      }),
    ).toBeInTheDocument();

    const posts = getPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      id: expect.any(String),
      title: 'My local post',
      content: 'This content stays in the browser.',
      createdAt: expect.any(String),
      authorId: OWNER_SESSION.userId,
      authorName: OWNER_SESSION.displayName,
    });
    expect(posts[0].id).not.toHaveLength(0);
    expect(
      Number.isNaN(new Date(posts[0].createdAt).getTime()),
    ).toBe(false);
    expect(
      screen.getByRole('heading', {
        name: `Post page ${posts[0].id}`,
      }),
    ).toBeInTheDocument();
  });

  it('updates the character counter and shows validation errors without saving', async () => {
    const user = userEvent.setup();

    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });
    renderWriteBlog('/write');

    const contentInput = screen.getByRole('textbox', {
      name: 'Content',
    });

    expect(screen.getByText('0 characters')).toBeInTheDocument();

    await user.type(contentInput, 'A');

    expect(screen.getByText('1 character')).toBeInTheDocument();

    await user.type(contentInput, ' story');

    expect(screen.getByText('7 characters')).toBeInTheDocument();

    await user.clear(contentInput);
    await user.click(
      screen.getByRole('button', { name: 'Publish Post' }),
    );

    expect(
      screen.getByText('Title is required.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Content is required.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(contentInput).toHaveAttribute('aria-invalid', 'true');
    expect(getPosts()).toEqual([]);
  });

  it('prefills an owned post and updates it without replacing immutable metadata', async () => {
    const user = userEvent.setup();

    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });
    expect(savePosts([EXISTING_POST])).toEqual({ ok: true });
    renderWriteBlog('/edit/post-1');

    const titleInput = screen.getByRole('textbox', {
      name: 'Title',
    });
    const contentInput = screen.getByRole('textbox', {
      name: 'Content',
    });

    expect(
      screen.getByRole('heading', { name: 'Edit Post' }),
    ).toBeInTheDocument();
    expect(titleInput).toHaveValue(EXISTING_POST.title);
    expect(contentInput).toHaveValue(EXISTING_POST.content);
    expect(
      screen.getByText(
        `${EXISTING_POST.content.length} characters`,
      ),
    ).toBeInTheDocument();

    await user.clear(titleInput);
    await user.type(titleInput, '  Updated title  ');
    await user.clear(contentInput);
    await user.type(contentInput, 'Updated browser content.');
    await user.click(
      screen.getByRole('button', { name: 'Save Changes' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Post page post-1',
      }),
    ).toBeInTheDocument();
    expect(getPosts()).toEqual([
      {
        ...EXISTING_POST,
        title: 'Updated title',
        content: 'Updated browser content.',
      },
    ]);
  });

  it('redirects a user who does not own the post without changing it', () => {
    expect(setSession(OTHER_USER_SESSION)).toEqual({ ok: true });
    expect(savePosts([EXISTING_POST])).toEqual({ ok: true });

    renderWriteBlog('/edit/post-1');

    expect(
      screen.getByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Edit Post' }),
    ).not.toBeInTheDocument();
    expect(getPosts()).toEqual([EXISTING_POST]);
  });

  it('redirects safely when the requested edit post does not exist', () => {
    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });

    renderWriteBlog('/edit/missing-post');

    expect(
      screen.getByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Edit Post' }),
    ).not.toBeInTheDocument();
    expect(getPosts()).toEqual([]);
  });

  it('cancels post creation without persisting entered content', async () => {
    const user = userEvent.setup();

    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });
    expect(savePosts([EXISTING_POST])).toEqual({ ok: true });
    renderWriteBlog('/write');

    await user.type(
      screen.getByRole('textbox', { name: 'Title' }),
      'Discarded title',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Content' }),
      'This content must not be persisted.',
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      await screen.findByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();
    expect(getPosts()).toEqual([EXISTING_POST]);
  });

  it('cancels post editing without persisting changes', async () => {
    const user = userEvent.setup();

    expect(setSession(OWNER_SESSION)).toEqual({ ok: true });
    expect(savePosts([EXISTING_POST])).toEqual({ ok: true });
    renderWriteBlog('/edit/post-1');

    const titleInput = screen.getByRole('textbox', {
      name: 'Title',
    });
    const contentInput = screen.getByRole('textbox', {
      name: 'Content',
    });

    await user.clear(titleInput);
    await user.type(titleInput, 'Discarded update');
    await user.clear(contentInput);
    await user.type(contentInput, 'Discarded edited content.');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Post page post-1',
      }),
    ).toBeInTheDocument();
    expect(getPosts()).toEqual([EXISTING_POST]);
  });
});