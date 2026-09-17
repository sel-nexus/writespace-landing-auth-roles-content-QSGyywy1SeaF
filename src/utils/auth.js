import { getUsers, saveUsers } from './storage';

const SESSION_KEY = 'writespace_session';

export const ADMIN_USER = {
  userId: 'admin-fixed-id',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

/**
 * Reads and validates the current session from localStorage.
 *
 * @returns {{ userId: string, username: string, displayName: string, role: 'admin'|'user' }|null}
 */
export function getSession() {
  try {
    const rawValue = globalThis.localStorage.getItem(SESSION_KEY);

    if (rawValue === null) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    return normalizeSession(parsedValue);
  } catch {
    return null;
  }
}

/**
 * Replaces the current browser session.
 *
 * @param {{ userId?: string, username?: string, displayName?: string, role?: string }|null} session
 * @returns {{ ok: boolean, errorCode?: string, message?: string }}
 */
export function setSession(session) {
  const normalizedSession = normalizeSession(session);

  if (!normalizedSession) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'A valid session is required.',
    };
  }

  try {
    globalThis.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(normalizedSession),
    );
    return { ok: true };
  } catch {
    return {
      ok: false,
      errorCode: 'STORAGE_UNAVAILABLE',
      message: 'Browser storage is unavailable.',
    };
  }
}

/**
 * Removes the current browser session.
 *
 * @returns {{ ok: boolean, errorCode?: string, message?: string }}
 */
export function clearSession() {
  try {
    globalThis.localStorage.removeItem(SESSION_KEY);
    return { ok: true };
  } catch {
    return {
      ok: false,
      errorCode: 'STORAGE_UNAVAILABLE',
      message: 'Browser storage is unavailable.',
    };
  }
}

/**
 * Evaluates mock credentials and creates a local browser session.
 *
 * @param {{ username?: string, password?: string }|null} credentials
 * @returns {Object}
 */
export function login(credentials) {
  const safeCredentials =
    credentials && typeof credentials === 'object' ? credentials : {};
  const username =
    typeof safeCredentials.username === 'string'
      ? safeCredentials.username.trim()
      : '';
  const password =
    typeof safeCredentials.password === 'string'
      ? safeCredentials.password
      : '';
  const fieldErrors = {};

  if (!username) {
    fieldErrors.username = 'Username is required.';
  }

  if (!password) {
    fieldErrors.password = 'Password is required.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      fieldErrors,
    };
  }

  if (
    username.toLocaleLowerCase() === ADMIN_USER.username &&
    password === 'admin'
  ) {
    return completeLogin(ADMIN_USER);
  }

  const normalizedUsername = username.toLocaleLowerCase();
  const matchedUser = getUsers().find(
    (user) =>
      isValidStoredUser(user) &&
      user.username.trim().toLocaleLowerCase() === normalizedUsername &&
      user.password === password,
  );

  if (!matchedUser) {
    return {
      ok: false,
      errorCode: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password.',
    };
  }

  const session = {
    userId: matchedUser.id,
    username: matchedUser.username.trim(),
    displayName: matchedUser.displayName.trim(),
    role: matchedUser.role,
  };

  return completeLogin(session);
}

/**
 * Registers a local user and signs that user in.
 *
 * @param {{ displayName?: string, username?: string, password?: string, confirmPassword?: string }|null} payload
 * @returns {Object}
 */
export function registerUser(payload) {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const displayName =
    typeof safePayload.displayName === 'string'
      ? safePayload.displayName.trim()
      : '';
  const username =
    typeof safePayload.username === 'string'
      ? safePayload.username.trim()
      : '';
  const password =
    typeof safePayload.password === 'string' ? safePayload.password : '';
  const confirmPassword =
    typeof safePayload.confirmPassword === 'string'
      ? safePayload.confirmPassword
      : '';
  const users = getUsers();
  const fieldErrors = {};

  if (!displayName) {
    fieldErrors.displayName = 'Display name is required.';
  }

  if (!username) {
    fieldErrors.username = 'Username is required.';
  } else {
    const normalizedUsername = username.toLocaleLowerCase();
    const usernameExists =
      normalizedUsername === ADMIN_USER.username ||
      users.some(
        (user) =>
          user &&
          typeof user === 'object' &&
          typeof user.username === 'string' &&
          user.username.trim().toLocaleLowerCase() === normalizedUsername,
      );

    if (usernameExists) {
      fieldErrors.username = 'Username already exists.';
    }
  }

  if (!password) {
    fieldErrors.password = 'Password is required.';
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = 'Confirm password is required.';
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      fieldErrors,
    };
  }

  const storedUser = {
    id: createId(),
    displayName,
    username,
    password,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  const writeResult = saveUsers([...users, storedUser]);

  if (!writeResult.ok) {
    return writeResult;
  }

  const session = {
    userId: storedUser.id,
    username: storedUser.username,
    displayName: storedUser.displayName,
    role: storedUser.role,
  };
  const sessionResult = setSession(session);

  if (!sessionResult.ok) {
    return {
      ...sessionResult,
      message:
        'Registration is unavailable because browser storage could not be accessed.',
    };
  }

  const user = {
    id: storedUser.id,
    displayName: storedUser.displayName,
    username: storedUser.username,
    role: storedUser.role,
    createdAt: storedUser.createdAt,
  };

  return {
    ok: true,
    user,
    session,
    redirectTo: '/blogs',
  };
}

/**
 * Returns the default destination for a role.
 *
 * @param {string} role
 * @returns {string}
 */
export function redirectPathForRole(role) {
  return role === 'admin' ? '/admin' : '/blogs';
}

/**
 * Creates a debug-safe projection without credentials or personal fields.
 *
 * @param {Object|null} user
 * @returns {Object}
 */
export function maskUserForLog(user) {
  if (!user || typeof user !== 'object') {
    return {};
  }

  const projection = {};

  if (typeof user.id === 'string') {
    projection.id = user.id;
  }

  if (typeof user.userId === 'string') {
    projection.userId = user.userId;
  }

  if (user.role === 'admin' || user.role === 'user') {
    projection.role = user.role;
  }

  if (typeof user.createdAt === 'string') {
    projection.createdAt = user.createdAt;
  }

  return projection;
}

/**
 * Persists a successful login and builds its result.
 *
 * @param {{ userId: string, username: string, displayName: string, role: 'admin'|'user' }} session
 * @returns {Object}
 */
function completeLogin(session) {
  const writeResult = setSession(session);

  if (!writeResult.ok) {
    return {
      ...writeResult,
      message:
        'Login is unavailable because browser storage could not be accessed.',
    };
  }

  return {
    ok: true,
    session: { ...session },
    redirectTo: redirectPathForRole(session.role),
  };
}

/**
 * Validates and normalizes a session-shaped value.
 *
 * @param {unknown} value
 * @returns {{ userId: string, username: string, displayName: string, role: 'admin'|'user' }|null}
 */
function normalizeSession(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const userId = typeof value.userId === 'string' ? value.userId.trim() : '';
  const username =
    typeof value.username === 'string' ? value.username.trim() : '';
  const displayName =
    typeof value.displayName === 'string' ? value.displayName.trim() : '';
  const role = value.role;

  if (
    !userId ||
    !username ||
    !displayName ||
    (role !== 'admin' && role !== 'user')
  ) {
    return null;
  }

  return {
    userId,
    username,
    displayName,
    role,
  };
}

/**
 * Determines whether a stored value can be used for authentication.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidStoredUser(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.id === 'string' &&
      value.id.trim().length > 0 &&
      typeof value.username === 'string' &&
      value.username.trim().length > 0 &&
      typeof value.displayName === 'string' &&
      value.displayName.trim().length > 0 &&
      typeof value.password === 'string' &&
      (value.role === 'admin' || value.role === 'user'),
  );
}

/**
 * Generates an identifier using the strongest browser capability available.
 *
 * @returns {string}
 */
function createId() {
  try {
    if (
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === 'function'
    ) {
      return globalThis.crypto.randomUUID();
    }

    if (
      globalThis.crypto &&
      typeof globalThis.crypto.getRandomValues === 'function'
    ) {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');

      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
        12,
        16,
      )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch {
    // Fall through to a non-cryptographic local identifier.
  }

  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}