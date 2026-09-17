import {
  createManagedUser,
  createPost,
  deleteManagedUser,
  deletePost,
  getPostById,
  getPosts,
  getUsers,
  safeReadArray,
  safeWriteArray,
  savePosts,
  updatePost,
} from './storage';

describe('storage utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  describe('safe storage access', () => {
    it.each([
      ['malformed JSON', '{not-valid-json'],
      ['a non-array JSON value', JSON.stringify({ id: 'not-an-array' })],
    ])('returns an empty array for %s', (_, storedValue) => {
      globalThis.localStorage.setItem('test_key', storedValue);

      expect(safeReadArray('test_key')).toEqual([]);
    });

    it('returns an empty array when localStorage is unavailable', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      expect(safeReadArray('test_key')).toEqual([]);
      expect(getPosts()).toEqual([]);
      expect(getUsers()).toEqual([]);
    });

    it('writes and reads arrays successfully', () => {
      const value = [{ id: 'record-1' }];

      expect(safeWriteArray('test_key', value)).toEqual({ ok: true });
      expect(safeReadArray('test_key')).toEqual(value);
    });

    it('rejects non-array values without writing to storage', () => {
      const result = safeWriteArray('test_key', { id: 'record-1' });

      expect(result).toEqual({
        ok: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Storage value must be an array.',
      });
      expect(globalThis.localStorage.getItem('test_key')).toBeNull();
    });

    it('returns a storage error when localStorage cannot persist data', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(savePosts([{ id: 'post-1' }])).toEqual({
        ok: false,
        errorCode: 'STORAGE_UNAVAILABLE',
        message: 'Browser storage is unavailable.',
      });
    });
  });

  describe('post persistence', () => {
    const authorSession = {
      userId: 'user-1',
      username: 'writer',
      displayName: 'Local Writer',
      role: 'user',
    };

    it('creates, retrieves, updates, and deletes an owned post', () => {
      const createResult = createPost(
        {
          title: '  A local-first post  ',
          content: 'This content is stored in the browser.',
        },
        authorSession,
      );

      expect(createResult.ok).toBe(true);
      expect(createResult.post).toEqual(
        expect.objectContaining({
          title: 'A local-first post',
          content: 'This content is stored in the browser.',
          authorId: authorSession.userId,
          authorName: authorSession.displayName,
        }),
      );
      expect(createResult.post.id).toEqual(expect.any(String));
      expect(createResult.post.createdAt).toEqual(expect.any(String));
      expect(createResult.redirectTo).toBe(
        `/blog/${createResult.post.id}`,
      );
      expect(getPosts()).toEqual([createResult.post]);
      expect(getPostById(createResult.post.id)).toEqual(createResult.post);

      const updateResult = updatePost(
        createResult.post.id,
        {
          title: '  Updated title  ',
          content: 'Updated browser content.',
        },
        authorSession,
      );

      expect(updateResult).toEqual({
        ok: true,
        post: {
          ...createResult.post,
          title: 'Updated title',
          content: 'Updated browser content.',
        },
        redirectTo: `/blog/${createResult.post.id}`,
      });
      expect(getPostById(createResult.post.id)).toEqual(updateResult.post);

      const deleteResult = deletePost(createResult.post.id, authorSession);

      expect(deleteResult).toEqual({
        ok: true,
        deletedId: createResult.post.id,
        redirectTo: '/blogs',
      });
      expect(getPosts()).toEqual([]);
      expect(getPostById(createResult.post.id)).toBeNull();
    });

    it('rejects invalid post input without changing persisted posts', () => {
      const result = createPost(
        {
          title: '   ',
          content: '',
        },
        authorSession,
      );

      expect(result).toEqual({
        ok: false,
        errorCode: 'VALIDATION_ERROR',
        fieldErrors: {
          title: 'Title is required.',
          content: 'Content is required.',
        },
      });
      expect(getPosts()).toEqual([]);
    });

    it('prevents a user from updating or deleting another user post', () => {
      const createResult = createPost(
        {
          title: 'Owned post',
          content: 'Only the owner or an admin can manage this.',
        },
        authorSession,
      );
      const otherSession = {
        userId: 'user-2',
        username: 'other',
        displayName: 'Other User',
        role: 'user',
      };

      const updateResult = updatePost(
        createResult.post.id,
        {
          title: 'Unauthorized update',
          content: 'This must not be saved.',
        },
        otherSession,
      );
      const deleteResult = deletePost(
        createResult.post.id,
        otherSession,
      );

      expect(updateResult).toEqual({
        ok: false,
        errorCode: 'FORBIDDEN',
        message: 'You are not allowed to edit this post.',
        redirectTo: '/blogs',
      });
      expect(deleteResult).toEqual({
        ok: false,
        errorCode: 'FORBIDDEN',
        message: 'You are not allowed to delete this post.',
        redirectTo: '/blogs',
      });
      expect(getPosts()).toEqual([createResult.post]);
    });

    it('allows an admin to update and delete any post', () => {
      const createResult = createPost(
        {
          title: 'User post',
          content: 'An admin can manage this post.',
        },
        authorSession,
      );
      const adminSession = {
        userId: 'admin-fixed-id',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin',
      };

      const updateResult = updatePost(
        createResult.post.id,
        {
          title: 'Admin updated title',
          content: 'Admin updated content.',
        },
        adminSession,
      );

      expect(updateResult.ok).toBe(true);
      expect(updateResult.post.authorId).toBe(authorSession.userId);
      expect(updateResult.post.title).toBe('Admin updated title');

      const deleteResult = deletePost(
        createResult.post.id,
        adminSession,
      );

      expect(deleteResult.ok).toBe(true);
      expect(getPosts()).toEqual([]);
    });

    it('returns not-found results for missing posts', () => {
      expect(getPostById('missing-post')).toBeNull();
      expect(
        updatePost(
          'missing-post',
          {
            title: 'Valid title',
            content: 'Valid content',
          },
          authorSession,
        ),
      ).toEqual({
        ok: false,
        errorCode: 'POST_NOT_FOUND',
        message: 'Post not found.',
        redirectTo: '/blogs',
      });
      expect(deletePost('missing-post', authorSession)).toEqual({
        ok: false,
        errorCode: 'POST_NOT_FOUND',
        message: 'Post not found.',
        redirectTo: '/blogs',
      });
    });
  });

  describe('managed user persistence', () => {
    it('creates and deletes a managed user', () => {
      const createResult = createManagedUser({
        displayName: '  Alex Example  ',
        username: '  alex_demo  ',
        password: 'local-password',
        role: 'user',
      });

      expect(createResult.ok).toBe(true);
      expect(createResult.user).toEqual(
        expect.objectContaining({
          displayName: 'Alex Example',
          username: 'alex_demo',
          password: 'local-password',
          role: 'user',
        }),
      );
      expect(createResult.user.id).toEqual(expect.any(String));
      expect(createResult.user.createdAt).toEqual(expect.any(String));
      expect(getUsers()).toEqual([createResult.user]);

      const deleteResult = deleteManagedUser(createResult.user.id, {
        userId: 'admin-fixed-id',
      });

      expect(deleteResult).toEqual({
        ok: true,
        deletedId: createResult.user.id,
      });
      expect(getUsers()).toEqual([]);
    });

    it('rejects duplicate usernames without adding another user', () => {
      const firstResult = createManagedUser({
        displayName: 'First User',
        username: 'ExampleUser',
        password: 'first-password',
        role: 'user',
      });
      const duplicateResult = createManagedUser({
        displayName: 'Second User',
        username: ' exampleuser ',
        password: 'second-password',
        role: 'admin',
      });

      expect(firstResult.ok).toBe(true);
      expect(duplicateResult).toEqual({
        ok: false,
        errorCode: 'VALIDATION_ERROR',
        fieldErrors: {
          username: 'Username already exists.',
        },
      });
      expect(getUsers()).toHaveLength(1);
    });

    it('blocks deletion of the default admin and current user', () => {
      const createResult = createManagedUser({
        displayName: 'Managed Admin',
        username: 'managed_admin',
        password: 'local-password',
        role: 'admin',
      });

      expect(
        deleteManagedUser('admin-fixed-id', {
          userId: createResult.user.id,
        }),
      ).toEqual({
        ok: false,
        errorCode: 'DELETE_BLOCKED',
        message: 'Default admin cannot be deleted.',
      });
      expect(
        deleteManagedUser(createResult.user.id, {
          userId: createResult.user.id,
        }),
      ).toEqual({
        ok: false,
        errorCode: 'DELETE_BLOCKED',
        message: 'You cannot delete your own account.',
      });
      expect(getUsers()).toEqual([createResult.user]);
    });

    it('returns a not-found error when deleting an unknown user', () => {
      expect(
        deleteManagedUser('missing-user', {
          userId: 'admin-fixed-id',
        }),
      ).toEqual({
        ok: false,
        errorCode: 'USER_NOT_FOUND',
        message: 'User not found.',
      });
    });
  });
});