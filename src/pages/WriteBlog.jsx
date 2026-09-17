import { useState } from 'react';
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { getSession } from '../utils/auth';
import {
  createPost,
  getPostById,
  updatePost,
} from '../utils/storage';

const EMPTY_FORM = {
  title: '',
  content: '',
};

function canEditPost(session, post) {
  return Boolean(
    session &&
      post &&
      (session.role === 'admin' ||
        session.userId === post.authorId),
  );
}

export default function WriteBlog() {
  const navigate = useNavigate();
  const { id: postId } = useParams();
  const isEditMode =
    typeof postId === 'string' && postId.length > 0;
  const [session] = useState(() => getSession());
  const [existingPost] = useState(() =>
    isEditMode ? getPostById(postId) : null,
  );
  const [form, setForm] = useState(() => {
    if (!isEditMode || !existingPost) {
      return EMPTY_FORM;
    }

    return {
      title:
        typeof existingPost.title === 'string'
          ? existingPost.title
          : '',
      content:
        typeof existingPost.content === 'string'
          ? existingPost.content
          : '',
    };
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (isEditMode && !existingPost) {
    return <Navigate replace to="/blogs" />;
  }

  if (
    isEditMode &&
    !canEditPost(session, existingPost)
  ) {
    return <Navigate replace to="/blogs" />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
    setSubmitError('');
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/blog/${encodeURIComponent(postId)}`);
      return;
    }

    navigate('/blogs');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFieldErrors({});
    setSubmitError('');

    try {
      const result = isEditMode
        ? updatePost(postId, form, session)
        : createPost(form, session);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});

        if (
          result.errorCode === 'FORBIDDEN' ||
          result.errorCode === 'POST_NOT_FOUND'
        ) {
          navigate(result.redirectTo || '/blogs', {
            replace: true,
          });
          return;
        }

        setSubmitError(
          result.message ||
            'Unable to save this post. Please try again.',
        );
        return;
      }

      const destination =
        result.post && typeof result.post.id === 'string'
          ? `/blog/${encodeURIComponent(result.post.id)}`
          : result.redirectTo || '/blogs';

      navigate(destination, { replace: true });
    } catch {
      setSubmitError(
        'Unable to save this post right now. Please try again.',
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section
        aria-labelledby="write-blog-heading"
        className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            {isEditMode ? 'Refine your story' : 'Share an idea'}
          </p>
          <h1
            className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
            id="write-blog-heading"
          >
            {isEditMode ? 'Edit Post' : 'Write a Post'}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            {isEditMode
              ? 'Update your post while keeping its original author and publication date.'
              : 'Turn your thoughts into a local story saved in this browser.'}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {submitError && (
            <div
              className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="title"
              >
                Title
              </label>
              <input
                aria-describedby={
                  fieldErrors.title ? 'title-error' : undefined
                }
                aria-invalid={Boolean(fieldErrors.title)}
                autoComplete="off"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-lg font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="title"
                name="title"
                onChange={handleChange}
                placeholder="Give your post a clear title"
                type="text"
                value={form.title}
              />
              {fieldErrors.title && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="title-error"
                >
                  {fieldErrors.title}
                </p>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-4">
                <label
                  className="block text-sm font-semibold text-slate-700"
                  htmlFor="content"
                >
                  Content
                </label>
                <p
                  aria-live="polite"
                  className="text-xs font-medium text-slate-500"
                >
                  {form.content.length}{' '}
                  {form.content.length === 1
                    ? 'character'
                    : 'characters'}
                </p>
              </div>
              <textarea
                aria-describedby={
                  fieldErrors.content
                    ? 'content-error content-character-count'
                    : 'content-character-count'
                }
                aria-invalid={Boolean(fieldErrors.content)}
                className="mt-2 block min-h-80 w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-base leading-7 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20"
                id="content"
                name="content"
                onChange={handleChange}
                placeholder="Start writing your story..."
                rows={12}
                value={form.content}
              />
              <span className="sr-only" id="content-character-count">
                Current content length is {form.content.length}{' '}
                characters.
              </span>
              {fieldErrors.content && (
                <p
                  className="mt-2 text-sm font-medium text-rose-600"
                  id="content-error"
                >
                  {fieldErrors.content}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                type="submit"
              >
                {isEditMode ? 'Save Changes' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Posts are stored locally in this browser.
        </p>
      </section>
    </main>
  );
}