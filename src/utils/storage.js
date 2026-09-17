const POSTS_KEY = 'writespace_posts';
const USERS_KEY = 'writespace_users';
const ADMIN_USER_ID = 'admin-fixed-id';

/**
 * Reads a JSON-encoded array from localStorage.
 *
 * @param {string} key
 * @returns {Array<unknown>}
 */
export function safeReadArray(key) {
  try {
    const rawValue = globalThis.localStorage.getItem(key);

    if (rawValue === null) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

/**
 * Writes an array to localStorage.
 *
 * @param {string} key
 * @param {Array<unknown>} value
 * @returns {{ ok: boolean, errorCode?: string, message?: string }}
 */
export function safeWriteArray(key, value) {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Storage value must be an array.',
    };
  }

  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
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
 * Returns all locally stored posts.
 *
 * @returns {Array<Object>}
 */
export function getPosts() {
  return safeReadArray(POSTS_KEY);
}

/**
 * Saves all posts to localStorage.
 *
 * @param {Array<Object>} posts
 * @returns {{ ok: boolean, errorCode?: string, message?: string }}
 */
export function savePosts(posts) {
  return safeWriteArray(POSTS_KEY, posts);
}

/**
 * Returns all locally stored managed users.
 *
 * @returns {Array<Object>}
 */
export function getUsers() {
  return safeReadArray(USERS_KEY);
}

/**
 * Saves all managed users to localStorage.
 *
 * @param {Array<Object>} users
 * @returns {{ ok: boolean, errorCode?: string, message?: string }}
 */
export function saveUsers(users) {
  return safeWriteArray(USERS_KEY, users);
}

/**
 * Finds a post by its identifier.
 *
 * @param {string} id
 * @returns {Object|null}
 */
export function getPostById(id) {
  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  return (
    getPosts().find(
      (post) => post && typeof post === 'object' && post.id === id,
    ) ?? null
  );
}

/**
 * Creates a new post owned by the supplied session.
 *
 * @param {{ title?: string, content?: string }} input
 * @param {{ userId?: string, displayName?: string, role?: string }|null} session
 * @returns {Object}
 */
export function createPost(input, session) {
  const fieldErrors = validatePostInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      fieldErrors,
    };
  }

  if (!hasValidSessionIdentity(session)) {
    return {
      ok: false,
      errorCode: 'FORBIDDEN',
      message: 'You must be signed in to create a post.',
      redirectTo: '/login',
    };
  }

  const post = {
    id: createId(),
    title: input.title.trim(),
    content: input.content,
    createdAt: new Date().toISOString(),
    authorId: session.userId,
    authorName: session.displayName.trim(),
  };

  const writeResult = savePosts([...getPosts(), post]);

  if (!writeResult.ok) {
    return writeResult;
  }

  return {
    ok: true,
    post,
    redirectTo: `/blog/${post.id}`,
  };
}

/**
 * Updates an existing post when the session owns it or belongs to an admin.
 *
 * @param {string} id
 * @param {{ title?: string, content?: string }} input
 * @param {{ userId?: string, role?: string }|null} session
 * @returns {Object}
 */
export function updatePost(id, input, session) {
  const fieldErrors = validatePostInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      fieldErrors,
    };
  }

  const posts = getPosts();
  const existingPost = posts.find(
    (post) => post && typeof post === 'object' && post.id === id,
  );

  if (!existingPost) {
    return {
      ok: false,
      errorCode: 'POST_NOT_FOUND',
      message: 'Post not found.',
      redirectTo: '/blogs',
    };
  }

  if (!canManagePost(session, existingPost)) {
    return {
      ok: false,
      errorCode: 'FORBIDDEN',
      message: 'You are not allowed to edit this post.',
      redirectTo: '/blogs',
    };
  }

  const updatedPost = {
    ...existingPost,
    title: input.title.trim(),
    content: input.content,
  };

  const updatedPosts = posts.map((post) =>
    post && typeof post === 'object' && post.id === id ? updatedPost : post,
  );
  const writeResult = savePosts(updatedPosts);

  if (!writeResult.ok) {
    return writeResult;
  }

  return {
    ok: true,
    post: updatedPost,
    redirectTo: `/blog/${id}`,
  };
}

/**
 * Deletes a post when the session owns it or belongs to an admin.
 *
 * @param {string} id
 * @param {{ userId?: string, role?: string }|null} session
 * @returns {Object}
 */
export function deletePost(id, session) {
  const posts = getPosts();
  const existingPost = posts.find(
    (post) => post && typeof post === 'object' && post.id === id,
  );

  if (!existingPost) {
    return {
      ok: false,
      errorCode: 'POST_NOT_FOUND',
      message: 'Post not found.',
      redirectTo: '/blogs',
    };
  }

  if (!canManagePost(session, existingPost)) {
    return {
      ok: false,
      errorCode: 'FORBIDDEN',
      message: 'You are not allowed to delete this post.',
      redirectTo: '/blogs',
    };
  }

  const writeResult = savePosts(
    posts.filter(
      (post) => !(post && typeof post === 'object' && post.id === id),
    ),
  );

  if (!writeResult.ok) {
    return writeResult;
  }

  return {
    ok: true,
    deletedId: id,
    redirectTo: '/blogs',
  };
}

/**
 * Creates a user from the admin user-management workflow.
 *
 * @param {{ displayName?: string, username?: string, password?: string, role?: string }} input
 * @returns {Object}
 */
export function createManagedUser(input) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const displayName =
    typeof safeInput.displayName === 'string'
      ? safeInput.displayName.trim()
      : '';
  const username =
    typeof safeInput.username === 'string' ? safeInput.username.trim() : '';
  const password =
    typeof safeInput.password === 'string' ? safeInput.password : '';
  const role = typeof safeInput.role === 'string' ? safeInput.role : '';
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
      normalizedUsername === 'admin' ||
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

  if (role !== 'admin' && role !== 'user') {
    fieldErrors.role = 'Role is required.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      fieldErrors,
    };
  }

  const user = {
    id: createId(),
    displayName,
    username,
    password,
    role,
    createdAt: new Date().toISOString(),
  };
  const writeResult = saveUsers([...users, user]);

  if (!writeResult.ok) {
    return writeResult;
  }

  return {
    ok: true,
    user,
  };
}

/**
 * Deletes a managed user while protecting the default admin and current user.
 *
 * @param {string} id
 * @param {{ userId?: string }|null} currentSession
 * @returns {Object}
 */
export function deleteManagedUser(id, currentSession) {
  if (id === ADMIN_USER_ID) {
    return {
      ok: false,
      errorCode: 'DELETE_BLOCKED',
      message: 'Default admin cannot be deleted.',
    };
  }

  if (currentSession && currentSession.userId === id) {
    return {
      ok: false,
      errorCode: 'DELETE_BLOCKED',
      message: 'You cannot delete your own account.',
    };
  }

  const users = getUsers();
  const targetUser = users.find(
    (user) => user && typeof user === 'object' && user.id === id,
  );

  if (!targetUser) {
    return {
      ok: false,
      errorCode: 'USER_NOT_FOUND',
      message: 'User not found.',
    };
  }

  const writeResult = saveUsers(
    users.filter(
      (user) => !(user && typeof user === 'object' && user.id === id),
    ),
  );

  if (!writeResult.ok) {
    return writeResult;
  }

  return {
    ok: true,
    deletedId: id,
  };
}

/**
 * Validates fields used to create or update a post.
 *
 * @param {{ title?: string, content?: string }|null} input
 * @returns {Record<string, string>}
 */
function validatePostInput(input) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const fieldErrors = {};

  if (
    typeof safeInput.title !== 'string' ||
    safeInput.title.trim().length === 0
  ) {
    fieldErrors.title = 'Title is required.';
  }

  if (
    typeof safeInput.content !== 'string' ||
    safeInput.content.trim().length === 0
  ) {
    fieldErrors.content = 'Content is required.';
  }

  return fieldErrors;
}

/**
 * Determines whether a session has the identity fields required for authorship.
 *
 * @param {{ userId?: string, displayName?: string }|null} session
 * @returns {boolean}
 */
function hasValidSessionIdentity(session) {
  return Boolean(
    session &&
      typeof session === 'object' &&
      typeof session.userId === 'string' &&
      session.userId.length > 0 &&
      typeof session.displayName === 'string' &&
      session.displayName.trim().length > 0,
  );
}

/**
 * Determines whether a session may mutate a post.
 *
 * @param {{ userId?: string, role?: string }|null} session
 * @param {{ authorId?: string }} post
 * @returns {boolean}
 */
function canManagePost(session, post) {
  if (!session || typeof session !== 'object') {
    return false;
  }

  return (
    session.role === 'admin' ||
    (typeof session.userId === 'string' &&
      session.userId.length > 0 &&
      session.userId === post.authorId)
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