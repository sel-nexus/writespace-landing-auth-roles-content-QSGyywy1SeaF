import PropTypes from 'prop-types';

const ACCENT_CLASSES = {
  indigo: {
    border: 'border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-700',
    value: 'text-indigo-700',
  },
  violet: {
    border: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-700',
    value: 'text-violet-700',
  },
  sky: {
    border: 'border-sky-200',
    icon: 'bg-sky-100 text-sky-700',
    value: 'text-sky-700',
  },
  emerald: {
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-700',
  },
};

export default function StatCard({
  value,
  label,
  accent = 'indigo',
  icon = null,
}) {
  const accentClasses =
    ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.indigo;

  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm sm:p-6 ${accentClasses.border}`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${accentClasses.icon}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`text-3xl font-bold tracking-tight sm:text-4xl ${accentClasses.value}`}
          >
            {value}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {label}
          </p>
        </div>

        {icon !== null && (
          <span
            aria-hidden="true"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl ${accentClasses.icon}`}
          >
            {icon}
          </span>
        )}
      </div>
    </article>
  );
}

StatCard.propTypes = {
  accent: PropTypes.oneOf(['indigo', 'violet', 'sky', 'emerald']),
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

StatCard.defaultProps = {
  accent: 'indigo',
  icon: null,
};