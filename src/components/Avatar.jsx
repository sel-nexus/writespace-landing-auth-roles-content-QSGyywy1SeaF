const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-lg',
  lg: 'h-12 w-12 text-xl',
};

/**
 * Returns an accessible, role-specific avatar.
 *
 * @param {string} role
 * @param {'sm'|'md'|'lg'} size
 * @returns {JSX.Element}
 */
export function getAvatar(role, size = 'md') {
  const isAdmin = role === 'admin';
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const roleClass = isAdmin
    ? 'bg-violet-100 text-violet-700 ring-violet-200'
    : 'bg-indigo-100 text-indigo-700 ring-indigo-200';

  return (
    <span
      aria-label={isAdmin ? 'Admin avatar' : 'User avatar'}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${sizeClass} ${roleClass}`}
      role="img"
    >
      <span aria-hidden="true">{isAdmin ? '♛' : '📖'}</span>
    </span>
  );
}