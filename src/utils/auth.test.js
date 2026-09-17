import {
  ADMIN_USER,
  clearSession,
  getSession,
  login,
  maskUserForLog,
  redirectPathForRole,
  registerUser,
  setSession,
} from './auth';
import { getUsers, saveUsers } from './storage';

describe('authentication utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
  });

  describe('session persistence', () => {
    const validSession = {
      userId: 'user-1',
      username: 'writer',
      displayName: 'Local Writer',
      role: 'user',
    };

    it('stores, reads, and clears a valid session', () => {
      expect(setSession(validSession)).toEqual({ ok: true });
      expect(getSession()).toEqual(validSession);

      expect(clearSession()).toEqual({ ok: true });
      expect(getSession()).toBeNull();
      expect(
        globalThis.localStorage.getItem('writespace_session'),
      ).toBeNull();
    });

    it('normalizes whitespace before storing a session', () => {
      expect(
        setSession({
          userId: '  user-1  ',
          username: '  writer  ',
          displayName: '  Local Writer  ',
          role: 'user',
        }),
      ).toEqual({ ok: true });

      expect(getSession()).toEqual(validSession);
    });

    it.each([
      ['a missing value', null],
      ['a primitive value', 'invalid'],
      [
        'an incomplete object',
        {
          userId: 'user-1',
          username: 'writer',
          role: 'user',
        },
      ],
      [
        'an unsupported role',
        {
          userId: 'user-1',
          username: 'writer',
          displayName: 'Local Writer',
          role: 'editor',
        },
      ],
    ])('rejects %s when setting a session', (_, value) => {
      expect(setSession(value)).toEqual({
        ok: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'A valid session is required.',
      });
      expect(getSession()).toBeNull();
    });

    it.each([
      ['malformed JSON', '{not-valid-json'],
      ['a JSON primitive', JSON.stringify('invalid')],
      [
        'an incomplete session',
        JSON.stringify({
          userId: 'user-1',
          username: 'writer',
          role: 'user',
        }),
      ],
      [
        'a session with an unsupported role',
        JSON.stringify({
          userId: 'user-1',
          username: 'writer',
          displayName: 'Local Writer',
          role: 'editor',
        }),
      ],
    ])('returns null for %s', (_, storedValue) => {
      globalThis.localStorage.setItem('writespace_session', storedValue);

      expect(getSession()).toBeNull();
    });

    it('returns null when localStorage cannot be read', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      expect(getSession()).toBeNull();
    });

    it('returns a storage error when a session cannot be saved', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(setSession(validSession)).toEqual({
        ok: false,
        errorCode: 'STORAGE_UNAVAILABLE',
        message: 'Browser storage is unavailable.',
      });
    });

    it('returns a storage error when a session cannot be cleared', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      expect(clearSession()).toEqual({
        ok: false,
        errorCode: 'STORAGE_UNAVAILABLE',
        message: 'Browser storage is unavailable.',
      });
    });
  });

  describe('login', () => {
    it('logs in the fixed admin before evaluating stored users', () => {
      expect(
        saveUsers([
          {
            id: 'stored-admin-id',
            displayName: 'Stored Admin',
            username: 'admin',
            password: 'admin',
            role: 'user',
            createdAt: '2026-09-17T10:00:00.000Z',
          },
        ]),
      ).toEqual({ ok: true });

      const result = login({
        username: '  ADMIN  ',
        password: 'admin',
      });

      expect(result).toEqual({
        ok: true,
        session: ADMIN_USER,
        redirectTo: '/admin',
      });
      expect(getSession()).toEqual(ADMIN_USER);
    });

    it('logs in a stored user with a case-insensitive trimmed username', () => {
      const storedUser = {
        id: 'user-1',
        displayName: 'Local Writer',
        username: 'Writer',
        password: 'local-password',
        role: 'user',
        createdAt: '2026-09-17T10:00:00.000Z',
      };

      expect(saveUsers([storedUser])).toEqual({ ok: true });

      const result = login({
        username: '  WRITER  ',
        password: 'local-password',
      });

      expect(result).toEqual({
        ok: true,
        session: {
          userId: storedUser.id,
          username: storedUser.username,
          displayName: storedUser.displayName,
          role: storedUser.role,
        },
        redirectTo: '/blogs',
      });
      expect(getSession()).toEqual(result.session);
    });

    it('redirects a stored admin user to the admin dashboard', () => {
      const storedAdmin = {
        id: 'managed-admin-1',
        displayName: 'Managed Admin',
        username: 'managed_admin',
        password: 'local-password',
        role: 'admin',
        createdAt: '2026-09-17T10:00:00.000Z',
      };

      expect(saveUsers([storedAdmin])).toEqual({ ok: true });

      expect(
        login({
          username: storedAdmin.username,
          password: storedAdmin.password,
        }),
      ).toEqual({
        ok: true,
        session: {
          userId: storedAdmin.id,
          username: storedAdmin.username,
          displayName: storedAdmin.displayName,
          role: storedAdmin.role,
        },
        redirectTo: '/admin',
      });
    });

    it('returns field errors when credentials are missing', () => {
      expect(login({ username: '   ', password: '' })).toEqual({
        ok: false,
        errorCode: 'VALIDATION_ERROR',
        fieldErrors: {
          username: 'Username is required.',
          password: 'Password is required.',
        },
      });
      expect(getSession()).toBeNull();
    });

    it('rejects an incorrect password without creating a session', () => {
      expect(
        saveUsers([
          {
            id: 'user-1',
            displayName: 'Local Writer',
            username: 'writer',
            password: 'correct-password',
            role: 'user',
            createdAt: '2026-09-17T10:00:00.000Z',
          },
        ]),
      ).toEqual({ ok: true });

      expect(
        login({
          username: 'writer',
          password: 'incorrect-password',
        }),
      ).toEqual({
        ok: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password.',
      });
      expect(getSession()).toBeNull();
    });

    it('ignores malformed stored user records during login', () => {
      expect(
        saveUsers([
          null,
          {
            id: '',
            displayName: 'Invalid User',
            username: 'invalid',
            password: 'password',
            role: 'user',
          },
          {
            id: 'user-1',
            displayName: 'Unsupported Role',
            username: 'editor',
            password: 'password',
            role: 'editor',
          },
        ]),
      ).toEqual({ ok: true });

      expect(
        login({
          username: 'invalid',
          password: 'password',
        }),
      ).toEqual({
        ok: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password.',
      });
    });

    it('returns a specific error when login cannot persist the session', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(
        login({
          username: 'admin',
          password: 'admin',
        }),
      ).toEqual({
        ok: false,
        errorCode: 'STORAGE_UNAVAILABLE',
        message:
          'Login is unavailable because browser storage could not be accessed.',
      });
    });
  });

  describe('registration', () => {
    it('registers a user, persists credentials, and creates a session', () => {
      const result = registerUser({
        displayName: '  Jane Demo  ',
        username: '  demo_user  ',
        password: 'local-password',
        confirmPassword: 'local-password',
      });

      expect(result.ok).toBe(true);
      expect(result.user).toEqual({
        id: expect.any(String),
        displayName: 'Jane Demo',
        username: 'demo_user',
        role: 'user',
        createdAt: expect.any(String),
      });
      expect(result.session).toEqual({
        userId: result.user.id,
        username: 'demo_user',
        displayName: 'Jane Demo',
        role: 'user',
      });
      expect(result.redirectTo).toBe('/blogs');
      expect(getUsers()).toEqual([
        {
          ...result.user,
          password: 'local-password',
        },
      ]);
      expect(getSession()).toEqual(result.session);
    });

    it('returns required-field errors without persisting a user', () => {
      expect(
        registerUser({
          displayName: '   ',
          username: '',
          password: '',
          confirmPassword: '',
        }),
      ).toEqual({
        ok: false,
        errorCode: 'VALIDATION_ERROR',
        fieldErrors: {
          displayName: 'Display name is required.',
          username: 'Username is required.',
          password: 'Password is required.',
          confirmPassword: 'Confirm password is required.',
        },
      });
      expect(getUsers()).toEqual([]);
      expect(getSession()).toBeNull();
    });

    it('rejects mismatched passwords without persisting a user', () => {
      expect(
        registerUser({
          displayName: 'Jane Demo',
          username: 'demo_user',
          password: 'first-password',
          confirmPassword: 'second-password',
        }),
      ).toEqual({
        ok: false,
        errorCode: 'VALIDATION_ERROR',
        fieldErrors: {
          confirmPassword: 'Passwords do not match.',
        },
      });
      expect(getUsers()).toEqual([]);
    });

    it.each([
      ['the reserved admin username', 'AdMiN'],
      ['an existing username with different casing', ' EXAMPLEUSER '],
    ])('rejects %s', (_, username) => {
      expect(
        saveUsers([
          {
            id: 'user-1',
            displayName: 'Existing User',
            username: 'ExampleUser',
            password: 'local-password',
            role: 'user',
            createdAt: '2026-09-17T10:00:00.000Z',
          },
        ]),
      ).toEqual({ ok: true });

      const result = registerUser({
        displayName: 'Jane Demo',
        username,
        password: 'new-password',
        confirmPassword: 'new-password',
      });

      expect(result).toEqual({
        ok: false,
        errorCode: 'VALIDATION_ERROR',
        fieldErrors: {
          username: 'Username already exists.',
        },
      });
      expect(getUsers()).toHaveLength(1);
      expect(getSession()).toBeNull();
    });

    it('returns a storage error when the user cannot be persisted', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(
        registerUser({
          displayName: 'Jane Demo',
          username: 'demo_user',
          password: 'local-password',
          confirmPassword: 'local-password',
        }),
      ).toEqual({
        ok: false,
        errorCode: 'STORAGE_UNAVAILABLE',
        message: 'Browser storage is unavailable.',
      });
    });

    it('returns a registration-specific error when session creation fails', () => {
      const originalSetItem = Storage.prototype.setItem;

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        key,
        value,
      ) {
        if (key === 'writespace_session') {
          throw new Error('Session storage denied');
        }

        return originalSetItem.call(this, key, value);
      });

      const result = registerUser({
        displayName: 'Jane Demo',
        username: 'demo_user',
        password: 'local-password',
        confirmPassword: 'local-password',
      });

      expect(result).toEqual({
        ok: false,
        errorCode: 'STORAGE_UNAVAILABLE',
        message:
          'Registration is unavailable because browser storage could not be accessed.',
      });
      expect(getUsers()).toHaveLength(1);
      expect(getSession()).toBeNull();
    });
  });

  describe('authentication helpers', () => {
    it('returns role-aware redirect paths', () => {
      expect(redirectPathForRole('admin')).toBe('/admin');
      expect(redirectPathForRole('user')).toBe('/blogs');
      expect(redirectPathForRole('unsupported')).toBe('/blogs');
    });

    it('creates a debug-safe user projection without personal fields', () => {
      expect(
        maskUserForLog({
          id: 'user-1',
          userId: 'session-user-1',
          username: 'private_username',
          displayName: 'Private Name',
          password: 'private-password',
          role: 'user',
          createdAt: '2026-09-17T10:00:00.000Z',
        }),
      ).toEqual({
        id: 'user-1',
        userId: 'session-user-1',
        role: 'user',
        createdAt: '2026-09-17T10:00:00.000Z',
      });
    });

    it('returns an empty debug projection for invalid input', () => {
      expect(maskUserForLog(null)).toEqual({});
      expect(maskUserForLog('invalid')).toEqual({});
    });
  });
});