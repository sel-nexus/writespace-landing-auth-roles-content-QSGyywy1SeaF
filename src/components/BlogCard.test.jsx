import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BlogCard from './BlogCard';

const POST = {
  id: 'post-1',
  title: 'Writing locally with confidence',
  content: 'A practical guide to keeping blog content in the browser.',
  createdAt: '2026-09-17T12:00:00.000Z',
  authorId: 'user-1',
  authorName: 'Local Writer',
};

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

function renderBlogCard({
  post = POST,
  index = 0,
  session = null,
  onEdit = null,
} = {}) {
  return render(
    <MemoryRouter>
      <BlogCard
        index={index}
        onEdit={onEdit}
        post={post}
        session={session}
      />
    </MemoryRouter>,
  );
}

describe('BlogCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders post metadata, content, author, and read link', () => {
    renderBlogCard();

    expect(
      screen.getByRole('heading', {
        name: 'Writing locally with confidence',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'A practical guide to keeping blog content in the browser.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Sep 17, 2026')).toHaveAttribute(
      'datetime',
      POST.createdAt,
    );
    expect(screen.getByText('Local Writer')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'User avatar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Read post' }),
    ).toHaveAttribute('href', '/blog/post-1');
  });

  it('normalizes whitespace in a short excerpt', () => {
    renderBlogCard({
      post: {
        ...POST,
        content: '  First paragraph\n\n   second paragraph.  ',
      },
    });

    expect(
      screen.getByText('First paragraph second paragraph.'),
    ).toBeInTheDocument();
  });

  it('truncates excerpts longer than 120 characters', () => {
    const longContent = 'x'.repeat(121);

    renderBlogCard({
      post: {
        ...POST,
        content: longContent,
      },
    });

    expect(
      screen.getByText(`${'x'.repeat(120)}…`),
    ).toBeInTheDocument();
    expect(screen.queryByText(longContent)).not.toBeInTheDocument();
  });

  it('renders a safe fallback for an invalid post date', () => {
    renderBlogCard({
      post: {
        ...POST,
        createdAt: 'invalid-date',
      },
    });

    expect(screen.getByText('Date unavailable')).toBeInTheDocument();
  });

  it.each([
    [0, 'border-t-indigo-500'],
    [1, 'border-t-violet-500'],
    [2, 'border-t-sky-500'],
    [3, 'border-t-emerald-500'],
    [4, 'border-t-indigo-500'],
    [5, 'border-t-violet-500'],
    [-1, 'border-t-indigo-500'],
  ])(
    'uses the expected cycling accent class for index %s',
    (index, expectedClass) => {
      renderBlogCard({ index });

      expect(screen.getByRole('article')).toHaveClass(expectedClass);
    },
  );

  it('encodes the post identifier in read and owner edit links', () => {
    renderBlogCard({
      post: {
        ...POST,
        id: 'post/with spaces',
      },
      session: OWNER_SESSION,
    });

    expect(
      screen.getByRole('link', { name: 'Read post' }),
    ).toHaveAttribute('href', '/blog/post%2Fwith%20spaces');
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/edit/post%2Fwith%20spaces',
    );
  });

  it.each([
    ['the post owner', OWNER_SESSION],
    ['an administrator', ADMIN_SESSION],
  ])('shows the edit link to %s', (_, session) => {
    renderBlogCard({ session });

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/edit/post-1',
    );
  });

  it.each([
    ['a guest', null],
    ['a user who does not own the post', OTHER_USER_SESSION],
  ])('hides the edit action from %s', (_, session) => {
    renderBlogCard({ session });

    expect(
      screen.queryByRole('link', { name: 'Edit' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit' }),
    ).not.toBeInTheDocument();
  });

  it('calls the edit callback with the post identifier', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    renderBlogCard({
      session: OWNER_SESSION,
      onEdit,
    });

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(POST.id);
  });
});